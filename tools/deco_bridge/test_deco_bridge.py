"""Synthetic contract/security witnesses, not target-firmware validation."""

import base64
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
from urllib.parse import parse_qs

from cryptography.hazmat.primitives.asymmetric import padding as rsa_padding, rsa

import deco_bridge as bridge


class Contracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.private = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def session(self):
        session = bridge.Session(Mock())
        session.key = b"1234567890123456"
        session.iv = b"6543210987654321"
        session.digest = "f" * 32
        session.seq = 123
        session.sign_key = self.private.public_key()
        return session

    def test_envelope_independent_rsa_decryption(self):
        session = self.session()
        fields = parse_qs(session.envelope({"operation": "read"}).decode())
        cipher = bytes.fromhex(fields["sign"][0])
        signature = b"".join(self.private.decrypt(cipher[i:i + 256], rsa_padding.PKCS1v15())
                             for i in range(0, len(cipher), 256)).decode()
        self.assertEqual(signature, f"k={session.key.decode()}&i={session.iv.decode()}"
                         f"&h={session.digest}&s={session.seq + len(fields['data'][0])}")
        value = {"error_code": 0, "result": {"count": 3}}
        self.assertEqual(session.open({"data": session.encrypt(value)}), value)

    def test_rsa_multiple_blocks(self):
        data = b"x" * 600
        encrypted = bytes.fromhex(bridge.rsa_encrypt(self.private.public_key(), data))
        self.assertEqual(b"".join(self.private.decrypt(encrypted[i:i + 256], rsa_padding.PKCS1v15())
                                  for i in range(0, len(encrypted), 256)), data)

    def test_unencrypted_error_and_corruption_fail(self):
        for raw in ({"error_code": -1}, {"data": "badbase64"}, {"data": base64.b64encode(b"x").decode()}, []):
            with self.subTest(raw=raw), self.assertRaises(bridge.BridgeError):
                self.session().open(raw)

    def test_write_endpoints_rejected_before_network(self):
        session = self.session()
        for name in ("reboot", "wlan", "debug", "admin/device", "client_list"):
            with self.assertRaises(bridge.BridgeError):
                session.read(name)
        session.transport.post.assert_not_called()

    def test_read_operation_cannot_be_overridden(self):
        session = self.session()
        session.token = "abc123"
        session.transport.post.return_value = {"data": session.encrypt({"error_code": 0, "result": {}})}
        session.read("clients")
        path, body = session.transport.post.call_args.args
        payload = json.loads(self.decrypt_payload(session, body))
        self.assertEqual(payload, {"operation": "read", "params": {"device_mac": "default"}})
        self.assertTrue(path.endswith("/admin/client?form=client_list"))

    def decrypt_payload(self, session, body):
        from cryptography.hazmat.primitives import padding
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        data = base64.b64decode(parse_qs(body.decode())["data"][0])
        dec = Cipher(algorithms.AES(session.key), modes.CBC(session.iv)).decryptor()
        unpadder = padding.PKCS7(128).unpadder()
        return unpadder.update(dec.update(data) + dec.finalize()) + unpadder.finalize()

    def test_failed_login_never_retries(self):
        session = bridge.Session(Mock())
        session.handshake = Mock(side_effect=bridge.BridgeError("Malformed handshake"))
        for _ in range(2):
            with self.assertRaises(bridge.BridgeError):
                session.login("synthetic-password")
        session.handshake.assert_called_once()
        argv = ["deco_bridge.py", "capture", "--host", "192.168.0.1",
                "--pin", "0" * 64, "--output", "/unused-synthetic-output"]
        with patch.object(bridge.sys, "argv", argv), patch.object(bridge, "private_directory"), \
             patch.object(bridge.sys.stdin, "isatty", return_value=True), \
             patch.object(bridge.getpass, "getpass", side_effect=bridge.getpass.GetPassWarning("private detail")), \
             patch.object(bridge, "Session") as factory:
            with self.assertRaises(bridge.BridgeError) as error:
                bridge.main()
            self.assertNotIn("private detail", str(error.exception))
            factory.return_value.login.assert_not_called()

    def test_complete_login_and_read_against_synthetic_firmware(self):
        from cryptography.hazmat.primitives import padding
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        key = self.private.public_key().public_numbers()
        parts = [format(key.n, "x"), format(key.e, "x")]
        paths = []

        def decrypt_rsa(cipher):
            data = bytes.fromhex(cipher)
            return b"".join(self.private.decrypt(data[i:i + 256], rsa_padding.PKCS1v15())
                            for i in range(0, len(data), 256))

        def firmware(path, body):
            paths.append(path)
            if path.endswith("form=auth"):
                self.assertEqual(json.loads(body), {"operation": "read"})
                return {"error_code": 0, "result": {"key": parts, "seq": 123}}
            if path.endswith("form=keys"):
                return {"error_code": 0, "result": {"password": parts}}
            fields = parse_qs(body.decode())
            signature = parse_qs(decrypt_rsa(fields["sign"][0]).decode())
            self.assertEqual(signature["s"], [str(123 + len(fields["data"][0]))])
            self.assertEqual(signature["h"], [hashlib.md5(b"adminsynthetic-password").hexdigest()])
            aes_key, iv = signature["k"][0].encode(), signature["i"][0].encode()
            dec = Cipher(algorithms.AES(aes_key), modes.CBC(iv)).decryptor()
            padded = dec.update(base64.b64decode(fields["data"][0])) + dec.finalize()
            unpadder = padding.PKCS7(128).unpadder()
            request = json.loads(unpadder.update(padded) + unpadder.finalize())
            if path.endswith("form=login"):
                self.assertEqual(request["operation"], "login")
                self.assertEqual(decrypt_rsa(request["params"]["password"]), b"synthetic-password")
                result = {"stok": "abcdef"}
            else:
                self.assertIn(";stok=abcdef/admin/client?form=client_list", path)
                self.assertEqual(request, {"operation": "read", "params": {"device_mac": "default"}})
                result = {"client_list": []}
            padder = padding.PKCS7(128).padder()
            plain = json.dumps({"error_code": 0, "result": result}).encode()
            padded = padder.update(plain) + padder.finalize()
            enc = Cipher(algorithms.AES(aes_key), modes.CBC(iv)).encryptor()
            return {"data": base64.b64encode(enc.update(padded) + enc.finalize()).decode()}

        session = bridge.Session(Mock(post=firmware))
        session.login("synthetic-password")
        self.assertEqual(session.read("clients"), {"client_list": []})
        self.assertEqual(len(paths), 4)
        with self.assertRaises(bridge.BridgeError):
            session.login("synthetic-password")
        self.assertEqual(len(paths), 4)

    def test_normalization_unknowns_and_aliases(self):
        raw = {"responses": {"devices": {"device_list": [{"mac": "02-00-00-00-00-01", "name": "private-room",
               "ip": "10.1.1.2", "online": "yes", "up_speed": "NaN", "down_speed": "4",
               "signal_level": {"band2_4": "2", "band5": "-1"}}]}}}
        result = bridge.normalize(raw, b"salt")
        row = result["nodes"][0]
        self.assertIsNone(row["online"])
        self.assertIsNone(row["rates"]["up_raw"])
        self.assertEqual(row["rates"]["down_raw"], 4)
        self.assertEqual(row["signal"]["scale"], "unknown")
        self.assertIsNone(result["clients"])
        self.assertNotIn("private-room", json.dumps(result))
        self.assertNotIn("10.1.1.2", json.dumps(result))
        self.assertFalse(result["capabilities"]["complex_csi"])
        self.assertEqual(result["source_state"], "live_unverified")
        raw["responses"]["devices"]["device_list"][0]["mac"] = "02:00:00:00:00:01"
        self.assertEqual(bridge.normalize(raw, b"salt")["nodes"][0]["id"], row["id"])
        self.assertNotEqual(bridge.normalize(raw, b"other")["nodes"][0]["id"], row["id"])

    def test_empty_missing_and_malformed_are_distinct(self):
        for value in ({}, {"device_list": [None]}, {"device_list": [{"mac": "bad"}]}):
            self.assertIsNone(bridge.normalize({"responses": {"devices": value}}, b"salt")["nodes"])
        self.assertEqual(bridge.normalize({"responses": {"devices": {"device_list": []}}}, b"salt")["nodes"], [])
        with self.assertRaises(bridge.BridgeError):
            bridge.normalize([], b"salt")

    def test_secret_redaction_nested(self):
        raw = {"nested": [{"group_key": "SECRET", "password": "SECRET", "stok": "SECRET", "up_speed": 1}]}
        clean = bridge.redact(raw)
        self.assertNotIn("SECRET", json.dumps(clean))
        self.assertEqual(clean["nested"][0]["up_speed"], 1)


class Boundaries(unittest.TestCase):
    def test_hosts_and_pins(self):
        for host in ("example.com", "127.0.0.1", "169.254.1.1", "8.8.8.8", "192.168.0.1/24", "::1"):
            with self.assertRaises(bridge.BridgeError):
                bridge.Transport(host, "0" * 64)
        with self.assertRaises(bridge.BridgeError):
            bridge.Transport("192.168.0.1", "no-pin")

    def mock_connection(self, cert=b"synthetic-certificate", status=200, body=b'{"error_code":0}'):
        conn = Mock()
        conn.sock.getpeercert.return_value = cert
        response = conn.getresponse.return_value
        response.status = status
        response.read.return_value = body
        response.headers.get_all.return_value = []
        return conn

    def test_pin_mismatch_sends_nothing_and_closes(self):
        conn = self.mock_connection()
        with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn):
            with self.assertRaises(bridge.BridgeError):
                bridge.Transport("192.168.0.1", "0" * 64).post("/", b"secret")
        conn.request.assert_not_called()
        conn.close.assert_called_once()

    def test_pin_match_same_connection_and_cookie(self):
        cert = b"synthetic-certificate"
        conn = self.mock_connection(cert)
        conn.getresponse.return_value.headers.get_all.return_value = ["sysauth=ab12; Path=/; HttpOnly"]
        with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn):
            transport = bridge.Transport("192.168.0.1", hashlib.sha256(cert).hexdigest())
            transport.post("/first", b"{}")
            transport.post("/second", b"{}")
        self.assertEqual(conn.request.call_args.args[3]["Cookie"], "sysauth=ab12")
        self.assertEqual(conn.connect.call_count, 2)

    def test_redirect_oversize_and_invalid_response_are_not_retried(self):
        for status, body in ((302, b""), (200, b"x" * (bridge.LIMIT + 1)), (200, b"[]"), (200, b"bad")):
            conn = self.mock_connection(status=status, body=body)
            with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn):
                with self.assertRaises(bridge.BridgeError):
                    bridge.Transport("192.168.0.1", hashlib.sha256(b"synthetic-certificate").hexdigest()).post("/", b"{}")
            conn.request.assert_called_once()
            conn.close.assert_called_once()

    def test_private_output_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as parent:
            target = bridge.private_directory(Path(parent) / "capture")
            path = target / "sample.json"
            bridge.write_private(path, {"synthetic": True})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(target.stat().st_mode & 0o777, 0o700)
            with self.assertRaises(FileExistsError):
                bridge.write_private(path, {})
            (target / "alias").symlink_to(path)
            with self.assertRaises(FileExistsError):
                bridge.write_private(target / "alias", {})
            (Path(parent) / ".git").mkdir()
            with self.assertRaises(bridge.BridgeError):
                bridge.private_directory(target)

    def test_timeout_is_distinct_and_never_exposes_exception_text(self):
        conn = self.mock_connection()
        conn.connect.side_effect = TimeoutError("PRIVATE-TOKEN-SENTINEL")
        with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn):
            with self.assertRaises(bridge.BridgeError) as caught:
                bridge.Transport("192.168.0.1", "0" * 64).post("/", b"{}")
        self.assertEqual(str(caught.exception), "Network request timed out")
        conn.request.assert_not_called()

    def test_timeout_is_bounded_and_reaches_the_tls_connection(self):
        for timeout in (0, 31, -1, True, float("inf")):
            with self.assertRaises(bridge.BridgeError):
                bridge.Transport("192.168.0.1", "0" * 64, timeout=timeout)
        conn = self.mock_connection()
        with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn) as connect:
            bridge.Transport("192.168.0.1", hashlib.sha256(b"synthetic-certificate").hexdigest(), timeout=30).post("/", b"{}")
        self.assertEqual(connect.call_args.kwargs["timeout"], 30)

    def test_json_failure_is_distinct_without_body_or_session_url(self):
        conn = self.mock_connection(body=b"PRIVATE-HTML-TOKEN-SENTINEL")
        with patch.object(bridge.http.client, "HTTPSConnection", return_value=conn):
            with self.assertRaises(bridge.BridgeError) as caught:
                bridge.Transport("192.168.0.1", hashlib.sha256(b"synthetic-certificate").hexdigest()).post("/", b"{}")
        self.assertEqual(str(caught.exception), "Router response was not valid JSON")

    def test_public_directory_rejected_without_chmod(self):
        with tempfile.TemporaryDirectory() as parent:
            os.chmod(parent, 0o755)
            with self.assertRaises(bridge.BridgeError):
                bridge.private_directory(parent)
            self.assertEqual(Path(parent).stat().st_mode & 0o777, 0o755)


if __name__ == "__main__":
    unittest.main()
