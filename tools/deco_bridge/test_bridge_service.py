"""SYNTHETIC boundary tests. Hardware witnesses are recorded separately."""
import http.client
import json
from pathlib import Path
import socket
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

from bridge_service import Server, State, config_read, origin, radio_read


CONFIG = {"host": "192.168.50.1", "pin": "a" * 64, "bridge_key": "b" * 64, "port": 8766}


class StateTests(unittest.TestCase):
    def setUp(self):
        self.state = State(CONFIG, Path("/unused"))

    def tearDown(self):
        self.state.close()

    def test_missing_is_not_zero_or_live(self):
        snapshot = self.state.snapshot()
        self.assertEqual(snapshot["connection"], "setup_required")
        self.assertIsNone(snapshot["mesh"]["clients"])
        self.assertEqual(snapshot["radio"]["source_state"], "disconnected")
        self.assertFalse(any(snapshot["capabilities"].values()))

    def test_expiry_error_and_monotonic_age(self):
        self.state.radio = {"source_state": "live_unverified", "available": True}
        self.state.mesh = {"source_state": "live_unverified", "clients": []}
        self.state.radio_time = self.state.mesh_time = 100
        self.state.phase = "connected"
        self.assertEqual(self.state.snapshot(110)["radio"]["source_state"], "live_unverified")
        self.assertEqual(self.state.snapshot(116)["radio"]["source_state"], "stale")
        self.assertEqual(self.state.snapshot(191)["mesh"]["source_state"], "stale")
        self.state.phase = "failed"
        self.assertEqual(self.state.snapshot(110)["mesh"]["source_state"], "stale")
        self.state.radio_failed = True
        self.assertEqual(self.state.snapshot(110)["radio"]["source_state"], "stale")

    def test_pause_drops_mesh_immediately(self):
        self.state.mesh = {"clients": [{"id": "old"}]}
        self.state.pause()
        self.assertEqual(self.state.snapshot()["connection"], "paused")
        self.assertIsNone(self.state.snapshot()["mesh"]["clients"])
        self.assertTrue(self.state.mesh_stop.is_set())

    def test_sleep_elapsed_and_backward_clock_step_are_stale(self):
        self.state.radio = {"source_state": "live_unverified", "available": True}
        self.state.mesh = {"source_state": "live_unverified", "clients": []}
        self.state.radio_time = self.state.mesh_time = 100
        self.state.radio_wall = self.state.mesh_wall = 1000
        self.state.phase = "connected"
        for wall in (2000, 900):
            with patch("bridge_service.time.time", return_value=wall):
                result = self.state.snapshot(101)
                self.assertEqual(result["radio"]["source_state"], "stale")
                self.assertEqual(result["mesh"]["source_state"], "stale")

    def test_no_login_before_explicit_pin_confirmation(self):
        with self.assertRaises(Exception):
            self.state.connect("synthetic-password", False)
        self.assertFalse(self.state.attempted)

    def test_failed_auth_is_single_attempt_no_retry_or_secret(self):
        calls = []
        class Broken:
            def login(self, _password):
                calls.append("login")
                raise RuntimeError("SECRET-SENTINEL")
        self.state.factory = Broken
        self.state.connect("synthetic-password", True)
        self.state.workers[-1].join(2)
        self.assertEqual(calls, ["login"])
        self.assertEqual(self.state.phase, "failed")
        self.assertEqual(self.state.snapshot()["failure_stage"], "authentication")
        self.assertNotIn("SECRET-SENTINEL", json.dumps(self.state.snapshot()))
        with self.assertRaises(Exception):
            self.state.connect("synthetic-password", True)

    def test_successful_batch_keeps_aliases_and_fixed_reads(self):
        calls = []
        class Firmware:
            def login(self, _password): calls.append("login")
            def read(self, name):
                calls.append(name)
                return {"device_list": [{"mac": "aa:bb:cc:dd:ee:01"}]} if name == "devices" else (
                    {"client_list": []} if name == "clients" else {})
        self.state.factory = Firmware
        self.state.connect("synthetic-password", True)
        deadline = time.monotonic() + 3
        while self.state.phase == "connecting" and time.monotonic() < deadline:
            time.sleep(.01)
        result = self.state.snapshot()
        self.assertEqual(calls, ["login", "devices", "clients"])
        self.assertEqual(result["mesh"]["clients"], [])
        self.assertNotIn("aa:bb:cc", json.dumps(result))
        self.assertEqual(result["mesh"]["source_state"], "live_unverified")

    def test_unused_performance_form_cannot_break_required_snapshot(self):
        calls = []
        class Firmware:
            def login(self, _password): pass
            def read(self, name):
                calls.append(name)
                if name == "devices": return {"device_list": []}
                if name == "clients": return {"client_list": []}
                raise RuntimeError("Unsupported optional form")
        self.state.factory = Firmware
        self.state.connect("synthetic-password", True)
        deadline = time.monotonic() + 2
        while self.state.phase == "connecting" and time.monotonic() < deadline:
            time.sleep(.01)
        self.assertEqual(self.state.phase, "connected")
        self.assertEqual(calls, ["devices", "clients"])
        self.assertEqual(self.state.snapshot()["mesh"]["nodes"], [])

    def test_explicit_reset_has_cooldown_and_does_not_log_in(self):
        calls = []
        class Broken:
            def login(self, _password):
                calls.append("login")
                raise RuntimeError("synthetic")
        self.state.factory = Broken
        self.state.connect("synthetic-password", True)
        self.state.mesh_worker.join(2)
        self.assertFalse(self.state.snapshot()["recovery"]["can_reset"])
        with self.assertRaises(Exception): self.state.reset()
        self.state.last_attempt = time.monotonic() - 31
        self.assertTrue(self.state.snapshot()["recovery"]["can_reset"])
        radio = {"source_state": "live_unverified", "available": True}
        self.state.radio = radio
        self.state.reset()
        self.assertEqual(calls, ["login"])
        self.assertIs(self.state.radio, radio)
        self.assertFalse(self.state.attempted)
        self.assertEqual(self.state.phase, "setup_required")
        self.state.connect("synthetic-password", True)
        self.state.mesh_worker.join(2)
        self.assertEqual(calls, ["login", "login"])

    def test_pause_cannot_reset_while_router_read_is_in_flight(self):
        entered, release = threading.Event(), threading.Event()
        class Slow:
            def login(self, _password): pass
            def read(self, _name):
                entered.set()
                release.wait(3)
                return {"device_list": []}
        self.state.factory = Slow
        self.state.connect("synthetic-password", True)
        self.assertTrue(entered.wait(2))
        self.state.pause()
        self.state.last_attempt = time.monotonic() - 31
        try:
            self.assertTrue(self.state.snapshot()["recovery"]["worker_active"])
            with self.assertRaises(Exception): self.state.reset()
        finally:
            release.set()
            self.state.mesh_worker.join(2)
        self.state.reset()
        self.assertEqual(self.state.phase, "setup_required")
        self.assertIsNone(self.state.snapshot()["mesh"]["clients"])

    def test_reset_is_rejected_during_normal_collection(self):
        self.state.phase = "connected"
        with self.assertRaises(Exception): self.state.reset()

    def test_bad_schema_stops_collection(self):
        class Firmware:
            def login(self, _password): pass
            def read(self, _name): return {"unexpected": []}
        self.state.factory = Firmware
        self.state.connect("synthetic-password", True)
        self.state.workers[-1].join(3)
        self.assertEqual(self.state.phase, "failed")
        self.assertIsNone(self.state.mesh)
        self.assertEqual(self.state.snapshot()["failure_stage"], "response_schema")

    def test_radio_allowlist_and_zero_rejection(self):
        sample = {"schema": "ruview.local_link.v0", "source": "macos_corewlan", "available": True,
                  "complex_csi": False, "rssi_dbm": -55, "noise_dbm": -90, "channel": 44,
                  "transmit_rate_mbps": 866, "ssid": "PRIVATE-SENTINEL"}
        with patch("bridge_service.subprocess.run") as run:
            run.return_value.stdout = json.dumps(sample).encode()
            result = radio_read("/trusted/helper")
            self.assertNotIn("PRIVATE-SENTINEL", json.dumps(result))
            self.assertEqual(result["rssi_dbm"], -55)
            sample["rssi_dbm"] = 0
            run.return_value.stdout = json.dumps(sample).encode()
            with self.assertRaises(ValueError): radio_read("/trusted/helper")

    def test_origins_and_config_permissions(self):
        for value in ("https://example.org", "http://127.0.0.1:8080/path", "http://user@localhost:8080", "http://127.0.0.1:8080#secret", "http://localhost:80"):
            with self.assertRaises(ValueError): origin(value)
        self.assertEqual(origin("http://127.0.0.1:8080"), "http://127.0.0.1:8080")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            path.write_text(json.dumps(CONFIG))
            path.chmod(0o600)
            self.assertEqual(config_read(path)["port"], 8766)
            path.chmod(0o644)
            with self.assertRaises(ValueError): config_read(path)


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with socket.socket() as temporary:
            temporary.bind(("127.0.0.1", 0))
            port = temporary.getsockname()[1]
        cls.config = {**CONFIG, "port": port, "ruview_origin": "http://127.0.0.1:8080"}
        cls.state = State(cls.config, Path("/unused"))
        cls.server = Server(cls.config, cls.state, Path(__file__).resolve().parents[2] / "ui")
        cls.worker = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.state.close()
        cls.worker.join(2)

    def request(self, method="GET", path="/v1/snapshot", headers=None, body=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.config["port"], timeout=4)
        try:
            connection.request(method, path, body, headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_auth_host_and_origin_denial(self):
        self.assertEqual(self.request()[0], 401)
        self.assertEqual(self.request(headers={"Authorization": "Bearer " + CONFIG["bridge_key"]})[0], 200)
        self.assertEqual(self.request(headers={"Host": "evil.example", "Authorization": "Bearer " + CONFIG["bridge_key"]})[0], 403)
        for request_origin in ("null", "https://evil.example", "http://127.0.0.1:9999"):
            self.assertEqual(self.request(headers={"Origin": request_origin})[0], 403)

    def test_active_port_is_not_shared(self):
        with self.assertRaises(OSError):
            Server(self.config, self.state, Path("/unused"))

    def test_exact_cors_no_cache_and_no_query_token(self):
        status, headers, body = self.request(headers={"Origin": "http://127.0.0.1:8080", "Authorization": "Bearer " + CONFIG["bridge_key"]})
        self.assertEqual(status, 200)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "http://127.0.0.1:8080")
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertNotIn(CONFIG["bridge_key"].encode(), body)
        self.assertEqual(self.request(path="/v1/snapshot?token=" + CONFIG["bridge_key"])[0], 404)
        self.assertEqual(self.request("OPTIONS", headers={"Origin": "http://127.0.0.1:8080"})[0], 204)

    def test_bootstrap_requires_header_and_assets_are_allowlisted(self):
        status, _, public = self.request(path="/")
        self.assertEqual(status, 200)
        self.assertNotIn(CONFIG["bridge_key"].encode(), public)
        _, _, native = self.request(path="/", headers={"Authorization": "Bearer " + CONFIG["bridge_key"]})
        self.assertIn(CONFIG["bridge_key"].encode(), native)
        for path in ("/../deco_bridge.py", "/config.json", "/%2e%2e/config.json"):
            self.assertEqual(self.request(path=path)[0], 404)

    def test_mutations_bounded_and_no_router_write_endpoint(self):
        auth = {"Authorization": "Bearer " + CONFIG["bridge_key"], "Content-Type": "application/json"}
        self.assertEqual(self.request("POST", "/v1/deco/reboot", auth, "{}")[0], 404)
        self.assertEqual(self.request("POST", "/v1/deco/connect", auth, "x" * 4097)[0], 400)
        self.assertEqual(self.request("POST", "/v1/deco/connect", auth, "[]")[0], 400)
        self.assertEqual(self.request("POST", "/v1/deco/connect", auth, '{"password":"synthetic","pin_confirmed":false}')[0], 409)
        self.assertFalse(self.state.attempted)

    def test_recovery_endpoint_requires_auth_and_restores_setup(self):
        auth = {"Authorization": "Bearer " + CONFIG["bridge_key"], "Content-Type": "application/json"}
        self.assertEqual(self.request("POST", "/v1/deco/reset", {"Content-Type":"application/json"}, "{}")[0], 401)
        self.state.phase, self.state.attempted = "failed", True
        try:
            self.assertEqual(self.request("POST", "/v1/deco/reset", auth, "{}")[0], 202)
            self.assertEqual(self.state.phase, "setup_required")
            self.assertFalse(self.state.attempted)
        finally:
            self.state.phase, self.state.attempted = "setup_required", False


if __name__ == "__main__":
    unittest.main()
