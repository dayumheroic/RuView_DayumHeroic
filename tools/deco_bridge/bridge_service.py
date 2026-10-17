#!/usr/bin/env python3
"""Loopback companion. Separate mesh and current-link RF; never CSI ingress."""
import argparse
import copy
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import math
import os
from pathlib import Path
import re
import secrets
import signal
from socketserver import TCPServer
import stat
import subprocess
import threading
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

from deco_bridge import BridgeError, Session, Transport, compact, normalize

CAPABILITIES = {"complex_csi": False, "human_presence": False, "vitals": False, "pose": False}
# Exact collector-owned messages map to fixed categories. Unknown upstream text
# is never reflected in diagnostics or request logs.
FAILURE_REASONS = {
    "Certificate pin mismatch; no HTTP request sent": "certificate_pin_mismatch",
    "TLS, network or response decoding failure": "transport_or_decode",
    "Non-200 HTTP response; no redirect or retry followed": "http_response",
    "Router rejected request; stopped without automatic retry": "router_rejected",
    "Malformed encrypted response": "encrypted_response",
    "Malformed handshake": "handshake_schema",
    "Unsupported or malformed API RSA key": "api_key",
    "Login did not return a supported session token": "session_token",
    "Unsupported protected response schema": "response_schema",
    "Router response exceeded size limit": "response_size",
    "Network request timed out": "network_timeout",
    "TLS negotiation or record failure": "tls_failed",
    "Router response was not valid JSON": "response_decode",
    "HTTP protocol or connection failure": "http_protocol",
    "Network connection failed": "network_failed",
}
TRANSIENT_READ_FAILURES = {"network_timeout", "tls_failed", "response_decode", "http_protocol", "network_failed"}
ASSETS = {"/": ("mesh.html", "text/html; charset=utf-8"),
          "/mesh.html": ("mesh.html", "text/html; charset=utf-8"),
          "/mesh.css": ("mesh.css", "text/css; charset=utf-8"),
          "/mesh.mjs": ("mesh.mjs", "text/javascript; charset=utf-8"),
          "/mesh-client.mjs": ("mesh-client.mjs", "text/javascript; charset=utf-8")}


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def origin(value):
    """Only an explicitly configured literal loopback HTTP consumer."""
    if not isinstance(value, str):
        raise ValueError("Expected an origin string")
    parsed = urlsplit(value)
    if (parsed.scheme != "http" or parsed.hostname not in ("127.0.0.1", "localhost")
            or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment
            or not parsed.port or not 1024 <= parsed.port <= 65535):
        raise ValueError("Expected a loopback HTTP origin with an explicit port")
    return f"http://{parsed.hostname}:{parsed.port}"


def config_read(path):
    path = Path(path).expanduser().absolute()
    metadata = path.lstat()
    if (path.is_symlink() or not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid()
            or metadata.st_mode & 0o077 or metadata.st_size > 8192):
        raise ValueError("Config must be an owner-only regular file")
    value = json.loads(path.read_bytes())
    if (not isinstance(value, dict) or not isinstance(value.get("host"), str)
            or not isinstance(value.get("pin"), str) or not isinstance(value.get("bridge_key"), str)):
        raise ValueError("Malformed private configuration")
    Transport(value["host"], value["pin"])
    if not re.fullmatch(r"[a-f0-9]{64}", value["bridge_key"]):
        raise ValueError("Invalid bridge key")
    port = value.get("port", 8766)
    if type(port) is not int or not 1024 <= port <= 65535:
        raise ValueError("Invalid port")
    if value.get("ruview_origin"):
        value["ruview_origin"] = origin(value["ruview_origin"])
    return value


def radio_read(helper):
    # Trusted packaged helper, no shell, no user-supplied command or arguments.
    result = subprocess.run([str(helper), "--samples", "1"], capture_output=True, timeout=3, check=True)
    if len(result.stdout) > 4096:
        raise ValueError("Oversized radio sample")
    value = json.loads(result.stdout)
    if (value.get("schema") != "ruview.local_link.v0" or value.get("source") != "macos_corewlan"
            or value.get("complex_csi") is not False or type(value.get("available")) is not bool):
        raise ValueError("Unsupported radio schema")
    available = value["available"]
    rssi = value.get("rssi_dbm")
    if available and (type(rssi) is not int or not -127 <= rssi <= -1):
        raise ValueError("Invalid RSSI")
    # Rebuild from an allowlist; never forward identifiers or arbitrary helper fields.
    clean = {"schema": "ruview.local_link.v0", "source": "macos_corewlan",
             "source_state": "live_unverified" if available else "disconnected",
             "observed_at": utcnow(), "available": available, "complex_csi": False}
    for name, lower, upper in (("rssi_dbm", -127, -1), ("noise_dbm", -127, -1),
                               ("channel", 1, 233), ("transmit_rate_mbps", 0.001, 100000)):
        item = value.get(name)
        valid = type(item) in (float, int) and math.isfinite(item) and lower <= item <= upper
        clean[name] = item if available and valid else None
    return clean


class State:
    def __init__(self, config, helper, session_factory=None):
        self.config, self.helper = config, helper
        self.factory = session_factory or (lambda: Session(Transport(config["host"], config["pin"], timeout=30)))
        self.lock = threading.Lock()
        self.stop = threading.Event()
        self.mesh_stop = threading.Event()
        self.salt = secrets.token_bytes(32)
        self.radio = None
        self.mesh = None
        self.radio_time = self.mesh_time = None
        self.radio_wall = self.mesh_wall = None
        self.radio_failed = False
        self.phase = "setup_required"
        self.failure_stage = None
        self.failure_reason = None
        self.attempted = False
        self.last_attempt = None
        self.mesh_worker = None
        self.read_retry_deadline = None
        self.workers = []

    def start_radio(self):
        worker = threading.Thread(target=self.radio_loop, daemon=True)
        self.workers.append(worker)
        worker.start()

    def radio_loop(self):
        while not self.stop.is_set():
            try:
                value = radio_read(self.helper)
                with self.lock:
                    self.radio, self.radio_time, self.radio_failed = value, time.monotonic(), False
                    self.radio_wall = time.time()
            except (OSError, ValueError, subprocess.SubprocessError):
                with self.lock:
                    self.radio_failed = True
            self.stop.wait(5)

    def connect(self, password, confirmed):
        if confirmed is not True:
            raise BridgeError("Compare the displayed certificate pin with the trusted router certificate first")
        if not isinstance(password, str) or not 1 <= len(password.encode()) <= 1024:
            raise BridgeError("Enter an owner password of at most 1024 bytes")
        with self.lock:
            if self.attempted or self.phase == "paused":
                raise BridgeError("Use Reconnect Deco before another explicit sign-in attempt")
            self.attempted, self.phase = True, "connecting"
            self.last_attempt = time.monotonic()
        worker = threading.Thread(target=self.mesh_loop, args=(password,), daemon=True)
        self.mesh_worker = worker
        self.workers.append(worker)
        worker.start()

    def mesh_loop(self, password):
        session = None
        stage = "authentication"
        try:
            session = self.factory()
            session.login(password)
            password = None
            while not self.stop.is_set() and not self.mesh_stop.is_set():
                capture = {"observed_at": utcnow(), "responses": {}}
                # Only these two responses contribute to the dashboard contract.
                # An unused performance/mode form must not gate a useful snapshot.
                for name in ("devices", "clients"):
                    if self.stop.is_set() or self.mesh_stop.is_set():
                        return
                    stage = "read_" + name
                    for attempt in range(2):
                        try:
                            capture["responses"][name] = session.read(name)
                            break
                        except BridgeError as error:
                            reason = FAILURE_REASONS.get(str(error))
                            if attempt != 0 or reason not in TRANSIENT_READ_FAILURES:
                                raise
                            # Status reads are idempotent. Keep the same in-memory
                            # session for one delayed retry; never call login again.
                            with self.lock:
                                if self.stop.is_set() or self.mesh_stop.is_set():
                                    return
                                self.phase = "retry_wait"
                                self.read_retry_deadline = time.monotonic() + 30
                            if self.mesh_stop.wait(30) or self.stop.is_set():
                                return
                            with self.lock:
                                self.read_retry_deadline = None
                                if self.mesh_stop.is_set():
                                    return
                                self.phase = "connecting"
                    if self.mesh_stop.wait(0.25):
                        return
                stage = "response_schema"
                value = normalize(capture, self.salt)
                # Missing lists must not count as a successful hardware schema validation.
                if value["nodes"] is None or value["clients"] is None:
                    raise BridgeError("Unsupported protected response schema")
                with self.lock:
                    if self.mesh_stop.is_set() or self.stop.is_set():
                        return
                    self.mesh, self.mesh_time, self.phase = value, time.monotonic(), "connected"
                    self.mesh_wall = time.time()
                if self.mesh_stop.wait(30):
                    return
        except Exception as error:
            # Router-controlled exception messages can contain a session URL or secret.
            with self.lock:
                if self.phase != "paused":
                    self.phase = "failed"
                    self.failure_stage = stage
                    self.failure_reason = FAILURE_REASONS.get(str(error), "request_failed") if isinstance(error, BridgeError) else "request_failed"
        finally:
            password = session = None
            with self.lock:
                self.read_retry_deadline = None

    def pause(self):
        self.mesh_stop.set()
        with self.lock:
            self.phase = "paused"
            self.read_retry_deadline = None
            # Drop aliases/measurements from the API immediately. An in-flight read may finish.
            self.mesh, self.mesh_time, self.mesh_wall = None, None, None

    def recovery(self):
        """Called while holding lock. No reset while a router operation is active."""
        active = self.mesh_worker is not None and self.mesh_worker.is_alive()
        delay = max(0, math.ceil(30 - (time.monotonic() - self.last_attempt))) if self.last_attempt is not None else 0
        return {"can_reset": self.phase in ("failed", "paused") and not active and delay == 0,
                "retry_after_seconds": delay, "worker_active": active}

    def reset(self):
        # Explicit local action only: forget the failed/paused collection session.
        # It never logs in, contacts the router, or restarts current-link RF.
        with self.lock:
            if not self.recovery()["can_reset"]:
                raise BridgeError("Reconnect is available after collection stops and the 30-second sign-in cooldown ends")
            self.mesh_stop.clear()
            self.mesh, self.mesh_time, self.mesh_wall = None, None, None
            self.salt = secrets.token_bytes(32)
            self.attempted, self.failure_stage, self.phase = False, None, "setup_required"
            self.failure_reason = None
            self.mesh_worker = None
            self.workers = [worker for worker in self.workers if worker.is_alive()]

    def snapshot(self, now=None):
        now = time.monotonic() if now is None else now
        with self.lock:
            radio, mesh = copy.deepcopy(self.radio), copy.deepcopy(self.mesh)
            rf_age = max(0, now - self.radio_time) if self.radio_time is not None else None
            mesh_age = max(0, now - self.mesh_time) if self.mesh_time is not None else None
            # Wall elapsed time also covers system sleep on clocks that pause monotonic ticks.
            # A backward clock step fails freshness closed until the next observation.
            wall = time.time()
            if rf_age is not None and self.radio_wall is not None:
                rf_age = max(rf_age, wall - self.radio_wall, 16 if self.radio_wall > wall + 5 else 0)
            if mesh_age is not None and self.mesh_wall is not None:
                mesh_age = max(mesh_age, wall - self.mesh_wall, 91 if self.mesh_wall > wall + 5 else 0)
            if radio is None:
                radio = {"schema": "ruview.local_link.v0", "source": "macos_corewlan",
                         "source_state": "disconnected", "available": False, "complex_csi": False}
            elif rf_age > 15 or self.radio_failed:
                radio["source_state"] = "stale"
            radio["age_seconds"] = rf_age
            if mesh is None:
                mesh = {"schema": "ruview.mesh.v0", "source": "deco_local",
                        "source_state": "disconnected", "nodes": None, "clients": None,
                        "capabilities": {**CAPABILITIES, "network_telemetry": True}}
            elif mesh_age > 90 or self.phase != "connected":
                mesh["source_state"] = "stale"
            mesh["age_seconds"] = mesh_age
            return {"schema": "ruview.bridge.v0", "radio": radio, "mesh": mesh,
                    "connection": self.phase, "capabilities": CAPABILITIES,
                    "failure_stage": self.failure_stage,
                    "failure_reason": self.failure_reason,
                    "recovery": self.recovery(),
                    "read_retry_after_seconds": max(0, math.ceil(self.read_retry_deadline - now)) if self.read_retry_deadline is not None else None,
                    "target": {"host": self.config["host"], "certificate_sha256": self.config["pin"]},
                    "sign_in_attempted": self.attempted}

    def close(self):
        self.stop.set()
        self.mesh_stop.set()


class Server(HTTPServer):
    allow_reuse_address = True  # Restart after TIME_WAIT; an active listener still prevents binding.

    def server_bind(self):
        # HTTPServer otherwise performs a reverse-DNS lookup even for loopback.
        TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address

    def __init__(self, config, state, assets):
        self.config, self.state, self.assets = config, state, Path(assets)
        self.allowed_hosts = {f"127.0.0.1:{config.get('port', 8766)}", f"localhost:{config.get('port', 8766)}"}
        self.origins = {f"http://{host}" for host in self.allowed_hosts}
        if config.get("ruview_origin"):
            self.origins.add(config["ruview_origin"])
        super().__init__(("127.0.0.1", config.get("port", 8766)), Handler)


class Handler(BaseHTTPRequestHandler):
    server_version = "RuViewBridge/0.1"

    def setup(self):
        super().setup()
        self.connection.settimeout(3)

    def log_message(self, *_args):
        pass  # No request URLs, headers or bodies in logs.

    def permitted(self, auth=True):
        if self.headers.get_all("Host") != [self.headers.get("Host")] or self.headers.get("Host") not in self.server.allowed_hosts:
            self.reply(403, {"error": "Loopback Host required"})
            return False
        request_origin = self.headers.get("Origin")
        if request_origin is not None and request_origin not in self.server.origins:
            self.reply(403, {"error": "Origin denied"})
            return False
        if auth:
            expected = "Bearer " + self.server.config["bridge_key"]
            provided = self.headers.get("Authorization", "")
            if not hmac.compare_digest(provided.encode(), expected.encode()):
                self.reply(401, {"error": "Bridge access key required"})
                return False
        return True

    def reply(self, status, value, mime="application/json", cors=True):
        raw = value if isinstance(value, bytes) else compact(value)
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' http://127.0.0.1:* http://localhost:*; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
        request_origin = self.headers.get("Origin")
        if cors and request_origin in self.server.origins:
            self.send_header("Access-Control-Allow-Origin", request_origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        if not self.permitted(False):
            return
        if self.path not in ("/v1/snapshot", "/v1/deco/connect", "/v1/deco/pause", "/v1/deco/reset"):
            self.reply(404, {"error": "Unknown endpoint"})
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if not self.permitted(False):
            return
        if self.path in ASSETS:
            name, mime = ASSETS[self.path]
            raw = (self.server.assets / name).read_bytes()
            # Native wrapper supplies the bridge key on this request, never in a URL.
            if name == "mesh.html":
                expected = "Bearer " + self.server.config["bridge_key"]
                if hmac.compare_digest(self.headers.get("Authorization", "").encode(), expected.encode()):
                    raw = raw.replace(b'content="BRIDGE_BOOTSTRAP"',
                                      f'content="{self.server.config["bridge_key"]}"'.encode())
                else:
                    raw = raw.replace(b'content="BRIDGE_BOOTSTRAP"', b'content=""')
            self.reply(200, raw, mime)
        elif self.path == "/v1/snapshot":
            if self.permitted():
                self.reply(200, self.server.state.snapshot())
        else:
            self.reply(404, {"error": "Unknown endpoint"})

    def do_POST(self):
        if not self.permitted():
            return
        if self.path not in ("/v1/deco/connect", "/v1/deco/pause", "/v1/deco/reset"):
            self.reply(404, {"error": "Unknown endpoint"})
            return
        try:
            length = int(self.headers.get("Content-Length", "-1"))
            if (self.headers.get("Transfer-Encoding") or not 0 < length <= 4096
                    or self.headers.get("Content-Type") != "application/json"):
                raise ValueError()
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError()
            if self.path == "/v1/deco/connect":
                self.server.state.connect(payload.get("password"), payload.get("pin_confirmed"))
            elif self.path == "/v1/deco/pause":
                self.server.state.pause()
            else:
                self.server.state.reset()
            self.reply(202, {"accepted": True})
        except BridgeError as error:
            self.reply(409, {"error": str(error)})
        except (ValueError, OSError):
            self.reply(400, {"error": "Expected a bounded JSON request"})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--radio-helper", required=True)
    parser.add_argument("--assets", required=True)
    parser.add_argument("--parent-pid", type=int, help="Native app lifetime owner")
    args = parser.parse_args()
    config = config_read(args.config)
    state = State(config, Path(args.radio_helper).resolve(strict=True))
    server = Server(config, state, args.assets)
    state.start_radio()
    def terminate(_signum, _frame):
        raise KeyboardInterrupt()
    signal.signal(signal.SIGTERM, terminate)
    if args.parent_pid:
        if args.parent_pid <= 1:
            raise ValueError("Invalid lifetime owner")
        def watch_parent():
            while not state.stop.wait(1):
                if os.getppid() != args.parent_pid:
                    os.kill(os.getpid(), signal.SIGTERM)
                    return
        threading.Thread(target=watch_parent, daemon=True).start()
    print("RuView bridge ready", flush=True)  # Native wrapper waits for successful bind.
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        state.close()
        server.server_close()


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, BridgeError):
        raise SystemExit("Bridge could not start. Check its private config, runtime and port.") from None
