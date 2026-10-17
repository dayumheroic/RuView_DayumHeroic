#!/usr/bin/env python3
"""Read existing loopback measurements, optional bounded ICMP, outbound-only feed.

No router credentials, session extraction, RF capture, mode changes or scans.
Standard library only. Private configuration and captures stay outside Git.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import http.client
import ipaddress
import json
import math
import os
from pathlib import Path
import re
import secrets
import ssl
import stat
import subprocess
import sys
import time
from urllib.parse import urlsplit

CAPABILITIES = {"complex_csi": False, "human_presence": False, "pose": False, "vitals": False}


def now():
    return datetime.now(timezone.utc).isoformat()


def status(value):
    # LaunchAgent stdout is a private status log. Bound regular-file retention.
    try:
        info = os.fstat(sys.stdout.fileno())
        if stat.S_ISREG(info.st_mode) and info.st_uid == os.getuid() and info.st_size > 1024 * 1024:
            os.ftruncate(sys.stdout.fileno(), 0)
            os.lseek(sys.stdout.fileno(), 0, os.SEEK_SET)
    except (OSError, ValueError):
        pass
    print(json.dumps(value), flush=True)


def private_config(path):
    path = Path(path).expanduser()
    s = path.lstat()
    if path.is_symlink() or not stat.S_ISREG(s.st_mode) or s.st_uid != os.getuid() or s.st_mode & 0o077 or s.st_size > 16384:
        raise ValueError("Private owner-only configuration required")
    value = json.loads(path.read_bytes())
    if not isinstance(value, dict):
        raise ValueError("Object configuration required")
    return value


def numeric(value, low, high):
    return value if type(value) in (int, float) and math.isfinite(value) and low <= value <= high else None


def dbm_to_nanowatts(value):
    value = numeric(value, -127, -1)
    return 10 ** ((value + 60) / 10) if value is not None else None


def ordinal_to_dbm(_value):
    return None  # No validated calibration; a many-to-one quality label has no unique inverse.


def association_export(value):
    if not isinstance(value, dict):
        return None
    if value.get("source") != "deco_node_filtered_client_list" or value.get("state") not in ("collecting", "stopped") or value.get("failure_reason") not in (None, "inventory_schema", "filtered_read_failed"):
        raise ValueError("Unsupported association source")
    def identity(x):
        if not isinstance(x, str) or not re.fullmatch(r"[a-f0-9]{24}", x):
            raise ValueError("Invalid association alias")
        return x
    def stamp(x):
        if not isinstance(x, str) or len(x) > 40:
            raise ValueError("Invalid association timestamp")
        datetime.fromisoformat(x.replace("Z", "+00:00"))
        return x
    return {"source": value.get("source"), "observed_at": stamp(value.get("observed_at")),
            "state": value.get("state"), "failure_reason": value.get("failure_reason"),
            "node_observations": [{"node_id": identity(x.get("node_id")), "observed_at": stamp(x.get("observed_at")),
                                   "client_count": len(x.get("client_ids", []))} for x in value.get("node_observations", [])[:32]],
            "clients": [{"client_id": identity(x.get("client_id")), "node_id": identity(x["node_id"]) if x.get("node_id") is not None else None, "observed_at": stamp(x["observed_at"]) if x.get("observed_at") is not None else None,
                         "state": x.get("state") if x.get("state") in ("last_observed", "ambiguous", "unknown") else "unknown", "candidate_node_ids": [identity(n) for n in x.get("candidate_node_ids", [])[:4]],
                         "candidate_count": len(x.get("candidate_node_ids", []))} for x in value.get("clients", [])[:128]],
            "events": [{"client_id": identity(x.get("client_id")), "from_node_id": identity(x.get("from_node_id")), "to_node_id": identity(x.get("to_node_id")),
                        "previous_observed_at": stamp(x.get("previous_observed_at")), "observed_at": stamp(x.get("observed_at")), "kind": "observed_attachment_change"}
                       for x in value.get("events", [])[-32:]]}


def projection(value, collection, sequence, probes):
    if value.get("schema") != "ruview.bridge.v0" or value.get("capabilities") != CAPABILITIES:
        raise ValueError("Unsupported bridge source")
    r = value["radio"]
    m = value["mesh"]
    if r.get("source") != "macos_corewlan" or r.get("complex_csi") is not False:
        raise ValueError("Unsupported radio source")
    states = {"live_unverified", "stale", "disconnected"}
    if r.get("source_state") not in states or m.get("source_state") not in states:
        raise ValueError("Unsupported source state")
    radio = {"source": "macos_corewlan", "source_state": r["source_state"],
             "available": r.get("available") is True, "observed_at": r.get("observed_at"),
             "rssi_dbm": numeric(r.get("rssi_dbm"), -127, -1), "noise_dbm": numeric(r.get("noise_dbm"), -127, -1),
             "channel": numeric(r.get("channel"), 1, 233), "transmit_rate_mbps": numeric(r.get("transmit_rate_mbps"), .001, 100000)}
    if not radio["available"]:
        radio["rssi_dbm"] = radio["noise_dbm"] = None

    def rows(items, limit):
        if items is None:
            return None
        if not isinstance(items, list) or len(items) > limit:
            raise ValueError("Oversized or malformed inventory")
        result = []
        for item in items:
            if not isinstance(item, dict) or not re.fullmatch(r"[a-f0-9]{24}", item.get("id", "")):
                raise ValueError("Invalid alias")
            signal = item.get("signal") or {}
            rates = item.get("rates") or {}
            result.append({"id": item["id"], "online": item.get("online") if type(item.get("online")) is bool else None,
                           "parent_id": item.get("parent_id") if isinstance(item.get("parent_id"), str) and re.fullmatch(r"[a-f0-9]{24}", item["parent_id"]) else None,
                           "is_main": item.get("is_main") if type(item.get("is_main")) is bool else None,
                           "model": item.get("model") if item.get("model") in ("M5", "M4R", "M4", "E4R", "E4") else None,
                           "signal_2g": numeric(signal.get("band2_4"), 0, 100), "signal_5g": numeric(signal.get("band5"), 0, 100),
                           "down_raw": numeric(rates.get("down_raw"), 0, 1e12), "up_raw": numeric(rates.get("up_raw"), 0, 1e12)})
        return result

    return {"schema": "ruview.observatory.v1", "collection": collection, "sequence": sequence, "sent_at": now(),
            "radio": radio, "mesh": {"source_state": m["source_state"], "observed_at": m.get("observed_at"),
                                      "nodes": rows(m.get("nodes"), 32), "clients": rows(m.get("clients"), 128),
                                      "associations": association_export(m.get("associations"))},
            "connection": value.get("connection"), "probes": probes, "capabilities": CAPABILITIES}


def snapshot(config):
    port = config.get("port", 8766)
    key = config.get("bridge_key")
    if type(port) is not int or not 1024 <= port <= 65535 or not isinstance(key, str) or not re.fullmatch(r"[a-f0-9]{64}", key):
        raise ValueError("Invalid local configuration")
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    try:
        c.request("GET", "/v1/snapshot", headers={"Authorization": "Bearer " + key})
        r = c.getresponse()
        raw = r.read(1048577)
        if r.status != 200 or len(raw) > 1048576:
            raise ValueError("Local snapshot unavailable")
        return json.loads(raw)
    finally:
        c.close()


def cached_targets(host, expected_gateway_mac=None):
    """At most four existing on-link entries, never a range sweep."""
    local = subprocess.run(["/usr/sbin/ipconfig", "getifaddr", "en0"], capture_output=True, timeout=3, check=True).stdout.decode().strip()
    mask = subprocess.run(["/usr/sbin/ipconfig", "getoption", "en0", "subnet_mask"], capture_output=True, timeout=3, check=True).stdout.decode().strip()
    network = ipaddress.IPv4Network(f"{local}/{mask}", strict=False)
    address = ipaddress.IPv4Address(host)
    if address not in network or not address.is_private:
        raise ValueError("Deco must be on the current private subnet")
    raw = subprocess.run(["/usr/sbin/arp", "-an"], capture_output=True, timeout=3, check=True).stdout
    if len(raw) > 65536:
        raise ValueError("Neighbor inventory exceeded bound")
    candidates = []
    gateway_mac = None
    for line in raw.decode().splitlines():
        match = re.search(r"\((\d+\.\d+\.\d+\.\d+)\) at ([a-fA-F0-9:]+) on en0(?: |$)", line)
        if not match:
            continue
        ip = ipaddress.IPv4Address(match[1])
        if str(ip) == host:
            gateway_mac = "".join(f"{int(part,16):02x}" for part in match[2].split(":"))
        if ip in network and ip not in (network.network_address, network.broadcast_address) and str(ip) != local:
            candidates.append(str(ip))
    if expected_gateway_mac is not None and gateway_mac != expected_gateway_mac:
        raise ValueError("Home gateway identity unavailable; no probes")
    selected = ([host] if host in candidates else []) + [x for x in candidates if x != host]
    return list(dict.fromkeys(selected))[:4]


def echo(target):
    # Fixed argv, two packets, one second apart; bounded wall time, no shell.
    try:
        p = subprocess.run(["/sbin/ping", "-n", "-c", "2", "-i", "1", "-W", "1000", "-t", "4", target],
                           capture_output=True, timeout=6)
        text = p.stdout[:8192].decode("ascii", errors="replace")
        loss = re.search(r"([\d.]+)% packet loss", text)
        average = re.search(r"(?:round-trip|rtt)[^=]*=\s*[\d.]+/([\d.]+)/", text)
        return {"observed_at": now(), "rtt_ms": numeric(float(average[1]), 0, 10000) if average else None,
                "loss_percent": numeric(float(loss[1]), 0, 100) if loss else None}
    except (OSError, subprocess.SubprocessError, ValueError):
        return {"observed_at": now(), "rtt_ms": None, "loss_percent": None}


def publish(url, token, frame, local=False):
    u = urlsplit(url)
    if u.username or u.password or u.query or u.fragment or u.path not in ("", "/"):
        raise ValueError("Invalid publisher origin")
    if local:
        if u.scheme != "http" or u.hostname != "127.0.0.1" or u.port != 8787:
            raise ValueError("Local test origin must be literal loopback port8787")
        c = http.client.HTTPConnection("127.0.0.1", 8787, timeout=8)
    else:
        if u.scheme != "https" or u.port not in (None, 443) or not re.fullmatch(r"ruview-deco\.[a-z0-9-]+\.workers\.dev", u.hostname or ""):
            raise ValueError("Publisher must use the configured RuView HTTPS origin")
        # Framework Python on macOS may have no bundled CA file. Use the
        # system trust bundle, retaining chain AND hostname verification.
        system_ca = Path("/etc/ssl/cert.pem")
        context = ssl.create_default_context(cafile=str(system_ca) if system_ca.is_file() else None)
        c = http.client.HTTPSConnection(u.hostname, timeout=8, context=context)
    if not isinstance(token, str) or not re.fullmatch(r"[a-f0-9]{64}", token):
        raise ValueError("Invalid publisher credential")
    body = json.dumps(frame, separators=(",", ":"), allow_nan=False).encode()
    if len(body) > 65536:
        raise ValueError("Export exceeded size bound")
    try:
        c.request("POST", "/api/ingest", body, {"Authorization": "Bearer " + token, "Content-Type": "application/json"})
        response = c.getresponse()
        raw = response.read(1025)
        if response.status != 200 or len(raw) > 1024 or json.loads(raw).get("accepted") is not True:
            raise ValueError("Publication rejected; no redirect followed")
    finally:
        c.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--bridge-config", default=str(Path.home() / "Library/Application Support/RuViewDecoBridge/config.json"))
    parser.add_argument("--seconds", type=int, default=3600)
    parser.add_argument("--icmp", action="store_true", help="Two ICMP requests per cached target, max4 targets, each30seconds")
    parser.add_argument("--local-test", action="store_true")
    args = parser.parse_args()
    if not 0 <= args.seconds <= 86400:
        parser.error("seconds must be0(until stopped)..86400")
    config, bridge = private_config(args.config), private_config(args.bridge_config)
    expected_mac = config.get("gateway_mac")
    if args.icmp and (not isinstance(expected_mac, str) or not re.fullmatch(r"[a-f0-9]{12}", expected_mac)):
        parser.error("ICMP requires an owner-verified private home gateway MAC")
    targets = []
    collection = secrets.token_hex(16)
    start, next_probe, sequence, failures = time.monotonic(), 0, 0, 0
    probes = []
    status({"event": "publisher_started", "icmp": args.icmp})
    with ThreadPoolExecutor(max_workers=4) as pool:
        while args.seconds == 0 or time.monotonic() - start < args.seconds:
            try:
                source = snapshot(bridge)
                if args.icmp and time.monotonic() >= next_probe:
                    mesh = source.get("mesh") or {}
                    permitted = source.get("connection") == "connected" and mesh.get("source_state") == "live_unverified"
                    try:
                        targets = cached_targets(bridge["host"], expected_mac) if permitted else []
                    except (OSError, ValueError, subprocess.SubprocessError):
                        targets = []
                    results = list(pool.map(echo, targets))
                    probes = [{"id": f"probe-{i+1}", "kind": "gateway" if target == bridge["host"] else "neighbor", **result}
                              for i, (target, result) in enumerate(zip(targets, results))]
                    next_probe = time.monotonic() + 30
                    source = snapshot(bridge)
                value = projection(source, collection, sequence, probes)
                publish(config["origin"], config["publisher_token"], value, args.local_test)
                sequence += 1
                if failures or sequence == 1 or sequence % 12 == 0:
                    status({"event": "published", "sequence": sequence, "radio_available": value["radio"]["available"],
                                      "nodes": len(value["mesh"]["nodes"] or []), "clients": len(value["mesh"]["clients"] or []),
                                      "probes_with_reply": sum(p["rtt_ms"] is not None for p in probes)})
                failures = 0
            except (OSError, ValueError, KeyError, TypeError, http.client.HTTPException, subprocess.SubprocessError):
                failures += 1
                if failures == 1 or failures % 12 == 0:
                    status({"event": "publication_unavailable", "consecutive_failures": failures})
            time.sleep(min(30, 5 * 2 ** min(failures, 3)))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
