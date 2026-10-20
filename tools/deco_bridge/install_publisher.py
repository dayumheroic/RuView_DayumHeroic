#!/usr/bin/env python3
"""Install/remove only the owner-scoped RuView outbound publisher LaunchAgent."""
import argparse
import os
from pathlib import Path
import plistlib
import subprocess
import sys

from research_feed import private_config

LABEL = "com.ruview.deco.publisher"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install", "stop", "start"))
    args = parser.parse_args()
    root = Path.home() / "Library/Application Support/RuViewDecoBridge"
    plist = Path.home() / "Library/LaunchAgents" / (LABEL + ".plist")
    domain = f"gui/{os.getuid()}"
    if args.action == "stop":
        subprocess.run(["/bin/launchctl", "bootout", domain + "/" + LABEL], check=True)
        print("Publisher stopped; bridge and cloud application unchanged")
        return
    if args.action == "start":
        subprocess.run(["/bin/launchctl", "bootstrap", domain, str(plist)], check=True)
        print("Publisher started")
        return
    private_config(root / "cloud.private.json")
    private_config(root / "config.json")
    if plist.exists() or plist.is_symlink():
        raise SystemExit("Existing publisher registration requires explicit stop/review before replacement")
    root_stat = root.stat()
    if root.is_symlink() or root_stat.st_uid != os.getuid() or root_stat.st_mode & 0o077:
        raise SystemExit("Private application directory required")
    executable = root / "cloud_publisher.py"
    if executable.exists() or executable.is_symlink():
        raise SystemExit("Existing installed publisher source requires review")
    with executable.open("xb") as f:
        os.fchmod(f.fileno(), 0o600)
        f.write(Path(__file__).with_name("research_feed.py").read_bytes())
    for name in ("publisher-status.log", "publisher-error.log"):
        fd = os.open(root / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
    runtime = root / "runtime/bin/python"
    python = str(runtime) if runtime.is_file() else str(Path(sys.executable).resolve())
    value = {"Label": LABEL, "ProgramArguments": [python, "-u", str(executable), "--config", str(root / "cloud.private.json"),
               "--bridge-config", str(root / "config.json"), "--seconds", "0", "--icmp"],
             "RunAtLoad": True, "KeepAlive": True, "ThrottleInterval": 30, "ProcessType": "Background",
             "StandardOutPath": str(root / "publisher-status.log"), "StandardErrorPath": str(root / "publisher-error.log")}
    plist.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(plist, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as f:
        plistlib.dump(value, f)
    subprocess.run(["/bin/launchctl", "bootstrap", domain, str(plist)], check=True)
    print("Installed owner-scoped publisher; two ICMP packets per cached target per30seconds, max4 targets")


if __name__ == "__main__":
    main()
