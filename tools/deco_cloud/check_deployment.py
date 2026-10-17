#!/usr/bin/env python3
"""Bounded read/auth/stream acceptance against the owner's deployed feed.

Reads owner-only config; never prints capabilities, cookies or household IDs.
No router requests, inventory changes, annotations or simulated measurements.
"""
import argparse
import base64
import http.client
import json
import os
from pathlib import Path
import socket
import ssl
import struct
import sys
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "deco_bridge"))
from research_feed import private_config


def check(config_path):
    cfg = private_config(config_path)
    u = urlsplit(cfg["origin"])
    if u.scheme != "https" or not (u.hostname or "").endswith(".workers.dev") or u.port or u.path or u.query or u.fragment:
        raise ValueError("Expected configured HTTPS Worker origin")
    ctx = ssl.create_default_context(cafile="/etc/ssl/cert.pem" if Path("/etc/ssl/cert.pem").is_file() else None)

    def request(method, path, body=None, headers=None):
        c = http.client.HTTPSConnection(u.hostname, context=ctx, timeout=12)
        try:
            c.request(method, path, body, headers or {})
            r = c.getresponse()
            data = r.read(131073)
            if len(data) > 131072:
                raise ValueError("Response bound exceeded")
            return r.status, data, r.getheader("Set-Cookie")
        finally:
            c.close()

    assert request("GET", "/api/snapshot")[0] == 401
    assert request("GET", "/")[0] == 303
    assert request("GET", "/health")[0] == 200
    assert request("POST", "/api/ingest", "{}", {"Content-Type": "application/json"})[0] == 401
    assert request("POST", "/api/login", json.dumps({"token": "0" * 64}),
                   {"Content-Type": "application/json", "Origin": cfg["origin"]})[0] == 401
    assert request("POST", "/api/login", "{}", {"Content-Type": "application/json", "Origin": "https://wrong.example"})[0] == 403
    status, _, cookie = request("POST", "/api/login", json.dumps({"token": cfg["owner_invitation"]}),
                                {"Content-Type": "application/json", "Origin": cfg["origin"]})
    assert status == 200 and all(x in cookie for x in ("Secure", "HttpOnly", "SameSite=Strict", "Max-Age="))
    session = {"Cookie": cookie.split(";")[0]}
    status, raw, _ = request("GET", "/api/snapshot", headers=session)
    assert status == 200
    value = json.loads(raw)
    assert value["latest"] and value["latest"]["radio"]["source"] == "macos_corewlan"
    for forbidden in (b"certificate_sha256", b"bridge_key", b"publisher_token", b"owner_invitation", b"192.168."):
        assert forbidden not in raw
    assert request("POST", "/api/ingest", "{}", {**session, "Content-Type": "application/json"})[0] == 401
    assert request("POST", "/api/label", "{}", {**session, "Content-Type": "application/json", "Origin": "https://wrong.example"})[0] == 403
    assert request("GET", "/api/live", headers=session)[0] == 403

    # Validate two server WebSocket messages without a browser or third-party client.
    with socket.create_connection((u.hostname, 443), timeout=15) as tcp:
        with ctx.wrap_socket(tcp, server_hostname=u.hostname) as s:
            key = base64.b64encode(os.urandom(16)).decode()
            wire = (f"GET /api/live HTTP/1.1\r\nHost: {u.hostname}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                    f"Origin: {cfg['origin']}\r\nCookie: {session['Cookie']}\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: {key}\r\n\r\n")
            s.sendall(wire.encode())
            pending = b""
            while b"\r\n\r\n" not in pending:
                chunk = s.recv(4096)
                if not chunk or len(pending) > 16384:
                    raise ValueError("Invalid upgrade")
                pending += chunk
            head, pending = pending.split(b"\r\n\r\n", 1)
            assert head.startswith(b"HTTP/1.1 101"), head[:80]

            def exact(n):
                nonlocal pending
                while len(pending) < n:
                    chunk = s.recv(min(65536, n - len(pending)))
                    if not chunk:
                        raise ValueError("Stream closed")
                    pending += chunk
                out, pending = pending[:n], pending[n:]
                return out

            def message():
                a, b = exact(2)
                assert a == 0x81 and b & 0x80 == 0
                length = b & 127
                if length == 126:
                    length = struct.unpack("!H", exact(2))[0]
                elif length == 127:
                    length = struct.unpack("!Q", exact(8))[0]
                if length > 131072:
                    raise ValueError("Frame bound")
                return json.loads(exact(length))

            first = message()
            assert first["type"] == "snapshot"
            # Annotation/expiry resynchronizations may arrive between data
            # updates. Admit either supported envelope and require advancement.
            for _ in range(5):
                second = message()
                assert second["type"] in ("snapshot", "update")
                if second.get("latest") and second["latest"]["collection"] == first["latest"]["collection"] and second["latest"]["sequence"] > first["latest"]["sequence"]:
                    break
            else:
                raise ValueError("No advancing observation in bounded stream check")
            mask = os.urandom(4)
            s.sendall(bytes((0x88, 0x82)) + mask + bytes(x ^ mask[i % 4] for i, x in enumerate(b"\x03\xe8")))
    latest = second["latest"]
    summary = {"label": "MEASURED", "anonymous_denial": True, "cross_origin_denial": True,
               "private_cookie": True, "publisher_viewer_isolation": True, "live_websocket_updates": True,
               "sequence_before": first["latest"]["sequence"], "sequence_after": latest["sequence"],
               "stream_envelope": second["type"],
               "nodes": len(latest["mesh"]["nodes"] or []), "clients": len(latest["mesh"]["clients"] or []),
               "rssi_dbm": latest["radio"]["rssi_dbm"], "noise_dbm": latest["radio"]["noise_dbm"],
               "probe_count": len(latest["probes"]), "sensing_capabilities": latest["capabilities"]}
    print(json.dumps(summary))
    return summary


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--config", required=True)
    args = p.parse_args()
    check(args.config)
