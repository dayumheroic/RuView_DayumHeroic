#!/usr/bin/env python3
"""Build an unsigned local Mac app using Swift and an isolated Python runtime.

No root, startup item, router mutation or saved owner password.
"""
import argparse
from pathlib import Path
import plistlib
import secrets
import shutil
import subprocess
import sys
import tempfile

from deco_bridge import Transport, private_directory, write_private
from bridge_service import config_read, origin


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True)
    parser.add_argument("--pin", required=True)
    parser.add_argument("--ruview-origin", help="Explicit loopback UI origin, e.g. http://127.0.0.1:8080")
    args = parser.parse_args()
    if sys.platform != "darwin":
        parser.error("This installer requires macOS with Swift and Python 3.11+")
    Transport(args.host, args.pin)
    ruview = origin(args.ruview_origin) if args.ruview_origin else None
    source = Path(__file__).resolve().parent
    support = Path.home() / "Library/Application Support/RuViewDecoBridge"
    support = private_directory(support)
    destination = Path.home() / "Applications/RuView Deco Bridge.app"
    if destination.exists() or destination.is_symlink():
        parser.error("App already exists; quit and move that app aside before installing a reviewed replacement")
    config_path = support / "config.json"
    if config_path.exists():
        config = config_read(config_path)
        if (config["host"] != args.host or config["pin"] != args.pin.lower()
                or config.get("ruview_origin") != ruview):
            parser.error("Existing target/pin/origin differs; review the private config instead of silently replacing trust")
    else:
        write_private(config_path, {"host": args.host, "pin": args.pin.lower(), "bridge_key": secrets.token_hex(32),
                                    "port": 8766, "ruview_origin": ruview})
    runtime = support / "runtime"
    if runtime.is_symlink():
        parser.error("Runtime must not be a symlink")
    if not runtime.exists():
        subprocess.run([sys.executable, "-m", "venv", str(runtime)], check=True)
    subprocess.run([str(runtime / "bin/python"), "-m", "pip", "install", "--only-binary=:all:",
                    "-r", str(source / "requirements.txt")], check=True)
    with tempfile.TemporaryDirectory(prefix="ruview-deco-build-") as temporary:
        bundle = Path(temporary) / destination.name
        contents = bundle / "Contents"
        resources = contents / "Resources"
        executable = contents / "MacOS"
        resources.mkdir(parents=True)
        executable.mkdir()
        for name in ("bridge_service.py", "deco_bridge.py"):
            shutil.copyfile(source / name, resources / name)
        assets = resources / "ui"
        assets.mkdir()
        for name in ("mesh.html", "mesh.css", "mesh.mjs", "mesh-client.mjs"):
            shutil.copyfile(source.parent.parent / "ui" / name, assets / name)
        subprocess.run(["swiftc", str(source / "mac_radio.swift"), "-o", str(resources / "mac-radio")], check=True)
        subprocess.run(["swiftc", str(source / "MacApp.swift"), "-o", str(executable / "RuViewDecoBridge")], check=True)
        with (contents / "Info.plist").open("wb") as stream:
            plistlib.dump({"CFBundleIdentifier": "local.ruview.deco-bridge", "CFBundleName": "RuView Deco Bridge",
                          "CFBundleExecutable": "RuViewDecoBridge", "CFBundlePackageType": "APPL",
                          "CFBundleShortVersionString": "0.1.0", "CFBundleVersion": "1",
                          "NSHighResolutionCapable": True, "LSMinimumSystemVersion": "13.0",
                          "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True}}, stream)
        destination.parent.mkdir(exist_ok=True)
        shutil.copytree(bundle, destination)
    print("Installed local research app:", destination)
    print("Private runtime/config:", support)
    print("The certificate pin is configured, not independently verified. Compare it before Deco sign-in.")


if __name__ == "__main__":
    main()
