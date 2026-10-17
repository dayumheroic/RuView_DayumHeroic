#!/usr/bin/env python3
"""Bounded, owner-authenticated stock Deco research collector (Python 3.11+).

Protocol references and limitations are in README.md and THIRD-PARTY-NOTICES.
No browser session access, discovery sweep, configuration writes or CSI claims.
"""

import argparse
import base64
import getpass
import hashlib
import hmac
import http.client
import ipaddress
import json
import math
import os
from pathlib import Path
import re
import secrets
import ssl
import sys
import time
import warnings
from datetime import datetime, timezone

from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.asymmetric import padding as rsa_padding, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

LIMIT = 1024 * 1024
# Fixed forms AND operations: client_list also has dangerous write callbacks.
READS = {
    "devices": ("admin/device", "device_list", {}),
    "clients": ("admin/client", "client_list", {"device_mac": "default"}),
    "performance": ("admin/network", "performance", {}),
    "mode": ("admin/device", "mode", {}),
    # Explicit opt-in, not yet established on every M5/M4R/E4R firmware.
    "signals": ("admin/device", "signal_level_list", {}),
    "traffic": ("admin/client", "traffic_stat", {}),
}


class BridgeError(Exception):
    """Only constant, sanitized messages reach CLI output."""


def compact(value):
    return json.dumps(value, separators=(",", ":"), allow_nan=False).encode()


def checked(value):
    if not isinstance(value, dict):
        raise BridgeError("Malformed response object")
    for key in ("error_code", "errorcode"):
        if key in value and value[key] != 0:
            raise BridgeError("Router rejected request; stopped without automatic retry")
    return value


class Transport:
    def __init__(self, host, pin):
        try:
            address = ipaddress.IPv4Address(host)
        except ipaddress.AddressValueError:
            raise BridgeError("Host must be a literal RFC1918 IPv4 address") from None
        if not any(address in ipaddress.ip_network(net) for net in
                   ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")):
            raise BridgeError("Host must be a literal RFC1918 IPv4 address")
        if not re.fullmatch(r"[a-fA-F0-9]{64}", pin):
            raise BridgeError("Expected a SHA256 certificate fingerprint")
        self.host, self.pin, self.cookie = str(address), pin.lower(), None

    def post(self, path, body):
        # This transport uses an explicit leaf pin, not public CA validation.
        # Connect + compare on this very socket BEFORE sending any HTTP bytes.
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        conn = http.client.HTTPSConnection(self.host, timeout=6, context=context)
        try:
            conn.connect()
            actual = hashlib.sha256(conn.sock.getpeercert(binary_form=True)).hexdigest()
            if not hmac.compare_digest(actual, self.pin):
                raise BridgeError("Certificate pin mismatch; no HTTP request sent")
            headers = {"Content-Type": "application/json", "Connection": "close"}
            if self.cookie:
                headers["Cookie"] = self.cookie
            conn.request("POST", path, body, headers)
            response = conn.getresponse()
            if response.status != 200:
                raise BridgeError("Non-200 HTTP response; no redirect or retry followed")
            raw = response.read(LIMIT + 1)
            if len(raw) > LIMIT:
                raise BridgeError("Router response exceeded size limit")
            for header in response.headers.get_all("Set-Cookie", []):
                match = re.search(r"(?:^|[;,]\s*)sysauth=([a-fA-F0-9]{1,256})(?:;|$)", header)
                if match:
                    self.cookie = "sysauth=" + match[1]
            return checked(json.loads(raw))
        except BridgeError:
            raise
        except (OSError, ValueError, http.client.HTTPException):
            # Never stringify an upstream exception: URLs can contain stok.
            raise BridgeError("TLS, network or response decoding failure") from None
        finally:
            conn.close()


def public_key(parts):
    try:
        if not isinstance(parts, list) or len(parts) != 2:
            raise ValueError()
        if any(not isinstance(x, str) or not re.fullmatch(r"[a-fA-F0-9]{1,1024}", x)
               for x in parts):
            raise ValueError()
        n, e = (int(x, 16) for x in parts)
        if not 512 <= n.bit_length() <= 4096 or e not in (3, 65537):
            raise ValueError()
        return rsa.RSAPublicNumbers(e, n).public_key()
    except ValueError:
        raise BridgeError("Unsupported or malformed API RSA key") from None


def rsa_encrypt(key, data):
    size = (key.key_size + 7) // 8 - 11
    return b"".join(key.encrypt(data[i:i + size], rsa_padding.PKCS1v15())
                    for i in range(0, len(data), size)).hex()


class Session:
    def __init__(self, transport):
        self.transport = transport
        self.token = None
        self.attempted = False

    def handshake(self):
        auth = self.transport.post("/cgi-bin/luci/;stok=/login?form=auth", compact({"operation": "read"}))
        keys = self.transport.post("/cgi-bin/luci/;stok=/login?form=keys", compact({"operation": "read"}))
        try:
            self.sign_key = public_key(auth["result"]["key"])
            self.password_key = public_key(keys["result"]["password"])
            self.seq = auth["result"]["seq"]
            if type(self.seq) is not int or not 0 <= self.seq <= 2**53:
                raise ValueError()
        except (KeyError, TypeError, ValueError):
            raise BridgeError("Malformed handshake") from None
        return {"signing_rsa_bits": self.sign_key.key_size,
                "password_rsa_bits": self.password_key.key_size,
                "tls": "explicit_leaf_sha256_pin", "authentication_attempted": False}

    def encrypt(self, value):
        padder = padding.PKCS7(128).padder()
        plain = compact(value)
        padded = padder.update(plain) + padder.finalize()
        enc = Cipher(algorithms.AES(self.key), modes.CBC(self.iv)).encryptor()
        return base64.b64encode(enc.update(padded) + enc.finalize()).decode()

    def envelope(self, value):
        data = self.encrypt(value)
        sign = (f"k={self.key.decode()}&i={self.iv.decode()}&h={self.digest}"
                f"&s={self.seq + len(data)}").encode()
        from urllib.parse import urlencode
        return urlencode({"sign": rsa_encrypt(self.sign_key, sign), "data": data}).encode()

    def open(self, raw):
        checked(raw)
        try:
            ciphertext = base64.b64decode(raw["data"], validate=True)
            dec = Cipher(algorithms.AES(self.key), modes.CBC(self.iv)).decryptor()
            padded = dec.update(ciphertext) + dec.finalize()
            unpadder = padding.PKCS7(128).unpadder()
            plain = unpadder.update(padded) + unpadder.finalize()
            return checked(json.loads(plain))
        except (KeyError, TypeError, ValueError):
            raise BridgeError("Malformed encrypted response") from None

    def login(self, password):
        if self.attempted:
            raise BridgeError("Only one credential attempt per process is permitted")
        self.attempted = True
        if not isinstance(password, str) or not 1 <= len(password.encode()) <= 1024:
            raise BridgeError("Empty or oversized password")
        self.handshake()
        self.key = (str(secrets.randbelow(9 * 10**15) + 10**15)).encode()
        self.iv = (str(secrets.randbelow(9 * 10**15) + 10**15)).encode()
        # MD5 is required by stock firmware; do not use it for local storage.
        self.digest = hashlib.md5(("admin" + password).encode(), usedforsecurity=False).hexdigest()
        body = self.envelope({"operation": "login", "params": {
            "password": rsa_encrypt(self.password_key, password.encode())}})
        result = self.open(self.transport.post("/cgi-bin/luci/;stok=/login?form=login", body))
        login_result = result.get("result")
        token = login_result.get("stok") if isinstance(login_result, dict) else None
        if not isinstance(token, str) or not re.fullmatch(r"[a-fA-F0-9]{1,256}", token):
            raise BridgeError("Login did not return a supported session token")
        self.token = token

    def read(self, name):
        if name not in READS:
            raise BridgeError("Endpoint is outside the read-only allowlist")
        if not self.token:
            raise BridgeError("Authentication required")
        path, form, params = READS[name]
        payload = {"operation": "read"}
        if params:
            payload["params"] = params.copy()
        result = self.open(self.transport.post(
            f"/cgi-bin/luci/;stok={self.token}/{path}?form={form}", self.envelope(payload)))
        if "result" not in result:
            raise BridgeError("Successful response omitted result")
        return result["result"]


def number(value):
    if isinstance(value, str):
        try:
            value = float(value)
        except ValueError:
            return None
    return value if type(value) in (int, float) and math.isfinite(value) and value >= 0 else None


def normalize(capture, salt, synthetic=False):
    """A deliberately narrow public contract. Unknown/missing is never absent."""
    if not isinstance(capture, dict) or not isinstance(capture.get("responses"), dict):
        raise BridgeError("Malformed capture")
    def alias(mac):
        if not isinstance(mac, str):
            return None
        canonical = re.sub(r"[:-]", "", mac).lower()
        if not re.fullmatch(r"[a-f0-9]{12}", canonical):
            return None
        return hmac.new(salt, canonical.encode(), hashlib.sha256).hexdigest()[:24]

    def rows(endpoint, field):
        result = capture.get("responses", {}).get(endpoint)
        data = result.get(field) if isinstance(result, dict) else None
        if not isinstance(data, list) or any(not isinstance(row, dict) for row in data):
            return None
        output = []
        for row in data:
            identity = alias(row.get("mac"))
            if identity is None:
                return None  # malformed list is incomplete, not an empty mesh
            signal = row.get("signal_level")
            output.append({"id": identity,
                           "online": row.get("online") if type(row.get("online")) is bool else None,
                           "rates": {"down_raw": number(row.get("down_speed")),
                                     "up_raw": number(row.get("up_speed")), "unit": "unverified"},
                           "signal": {"band2_4": number(signal.get("band2_4")),
                                      "band5": number(signal.get("band5")), "scale": "unknown"}
                           if isinstance(signal, dict) else None})
        return output

    return {"schema": "ruview.mesh.v0", "source": "deco_local",
            "source_state": "synthetic" if synthetic else "live_unverified",
            "observed_at": capture.get("observed_at"),
            "capabilities": {"network_telemetry": True, "complex_csi": False,
                             "human_presence": False, "vitals": False, "pose": False},
            "nodes": rows("devices", "device_list"),
            "clients": rows("clients", "client_list")}


def redact(value, depth=0):
    if depth > 32:
        raise BridgeError("Response nesting exceeded limit")
    if isinstance(value, dict):
        return {k: ("[redacted]" if re.search(
            r"password|passwd|secret|token|cookie|stok|credential|(?:^|_)key(?:$|_)|psk", k, re.I)
                    else redact(v, depth + 1)) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(v, depth + 1) for v in value]
    return value


def private_directory(path):
    target = Path(path).expanduser().absolute()
    # Existing directories must already be private. Never chmod someone else's tree.
    if not target.exists():
        target.mkdir(mode=0o700, parents=False)
    stat = target.lstat()
    if target.is_symlink() or not target.is_dir() or stat.st_uid != os.getuid() or stat.st_mode & 0o077:
        raise BridgeError("Output directory must be owner-only (mode 700), not a symlink")
    target = target.resolve()
    for parent in (target, *target.parents):
        if (parent / ".git").exists():
            raise BridgeError("Private captures must be outside Git checkouts")
    return target


def write_private(path, value):
    # Exclusive create, no symlink following or accidental overwrites.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(compact(value) + b"\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("probe", "capture", "replay"))
    parser.add_argument("--host")
    parser.add_argument("--pin", help="Independently checked leaf certificate SHA256")
    parser.add_argument("--output", help="Private directory outside any Git checkout")
    parser.add_argument("--input", help="Explicit offline synthetic JSON fixture")
    parser.add_argument("--extended", action="store_true", help="Also try unverified signal/traffic read forms")
    parser.add_argument("--samples", type=int, default=1)
    parser.add_argument("--interval", type=int, default=30)
    args = parser.parse_args()
    if not 1 <= args.samples <= 120 or not 30 <= args.interval <= 3600:
        parser.error("samples must be 1..120; interval must be 30..3600 seconds")
    if args.command == "replay":
        if not args.input:
            parser.error("replay requires --input")
        with open(args.input, "rb") as stream:
            raw = stream.read(LIMIT + 1)
        if len(raw) > LIMIT:
            raise BridgeError("Fixture exceeded size limit")
        print(json.dumps(normalize(json.loads(raw), b"synthetic-fixture-only", True), indent=2))
        return
    if not args.host or not args.pin:
        parser.error("probe and capture require --host and --pin")
    session = Session(Transport(args.host, args.pin))
    if args.command == "probe":
        print(json.dumps(session.handshake(), indent=2))
        return
    if not args.output:
        parser.error("capture requires --output")
    target = private_directory(args.output)
    # Each run has independent aliases; cross-run identity tracking is not implied.
    salt = secrets.token_bytes(32)
    if not sys.stdin.isatty():
        raise BridgeError("Run capture in a local interactive terminal for secure password entry")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            password = getpass.getpass("Owner TP-Link password (one login attempt; not saved): ")
    except getpass.GetPassWarning:
        raise BridgeError("Secure hidden password entry is unavailable; no credential sent") from None
    session.login(password)
    del password
    for index in range(args.samples):
        capture = {"observed_at": datetime.now(timezone.utc).isoformat(), "responses": {}, "errors": {}}
        names = ["devices", "clients", "performance", "mode"]
        if args.extended:
            names += ["signals", "traffic"]
        for name in names:
            try:
                capture["responses"][name] = session.read(name)
            except BridgeError:
                # Stop the batch; an API failure may be auth expiry or lockout.
                capture["errors"][name] = "read_failed_batch_stopped"
                break
            time.sleep(0.25)
        stamp = f"{time.time_ns()}-{index}"
        write_private(target / f"{stamp}.private.json", redact(capture))
        normalized = normalize(capture, salt)
        write_private(target / f"{stamp}.mesh.json", normalized)
        print(json.dumps({"sample": index + 1, "state": normalized["source_state"],
                          "nodes": len(normalized["nodes"]) if normalized["nodes"] is not None else None,
                          "clients": len(normalized["clients"]) if normalized["clients"] is not None else None,
                          "read_batch_complete": not capture["errors"]}))
        if capture["errors"]:
            raise BridgeError("Read batch stopped; partial private evidence saved, no retry")
        if index + 1 < args.samples:
            time.sleep(args.interval)


if __name__ == "__main__":
    try:
        main()
    except BridgeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except (OSError, ValueError, RecursionError):
        # No server-controlled text, URLs, credentials or tracebacks in CLI logs.
        print("Collector stopped. Check the command, pin, connection and private output; no automatic retry.", file=sys.stderr)
        sys.exit(1)
    except (KeyboardInterrupt, EOFError):
        print("Collector stopped by owner.", file=sys.stderr)
        sys.exit(130)
