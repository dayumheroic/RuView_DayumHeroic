# Stock Deco research collector

Small Python 3.11+ command-line companion for owner-authorized local discovery.
It implements the stock Deco web protocol independently of a browser session.
It now includes a loopback service, a RuView mesh page and an unsigned native
Mac app, alongside private CLI capture. No Rust sensing ingress or
signed/notarized distribution is added. See [Mac app setup and API](APP.md).

**MEASURED:** the main M5 hardware 3.2 / firmware 1.9.5 Build 20260602
Rel.25369 answers the pinned HTTPS `auth` and `keys` read forms, advertising
512-bit signing and 1024-bit password RSA keys. Authenticated native-app
collection subsequently succeeded; see evidence E61 and E70–E76 in the
[PR notes](../../docs/integrations/deco/PR-NOTES.md). Unit tests use synthetic
firmware responses; real acceptance is recorded separately.
None of this establishes a complex-CSI export path.

## Install and test

From the repository root, in a local terminal:

```sh
python3 -m venv tools/deco_bridge/.venv
tools/deco_bridge/.venv/bin/python -m pip install --only-binary=:all: -r tools/deco_bridge/requirements.txt
tools/deco_bridge/.venv/bin/python -m unittest discover -s tools/deco_bridge -v
```

Dependencies are pinned to the wheels actually available and tested on the
development host, rather than an unverified latest-version claim. The global
Python environment is not changed. No upstream integration package, install
script, Home Assistant runtime or vendored exploit is executed.

## Establish the target and pin

Use the main Deco's LAN address, obtained from its Device Info screen. Only
literal RFC1918 IPv4 targets are accepted; there is no network sweep or fallback.
Compare the leaf certificate fingerprint in your already verified local browser
with the SHA256 of its exported DER certificate. Supply that 64-character hex
fingerprint as `PIN` below. Initial trust needs this owner-verified comparison;
an unauthenticated first certificate fetch alone is not proof of identity.
Do not silently replace the pin after a firmware update or mismatch.

```sh
tools/deco_bridge/.venv/bin/python tools/deco_bridge/deco_bridge.py probe --host "$DECO_LAN_IP" --pin "$PIN"
tools/deco_bridge/.venv/bin/python tools/deco_bridge/deco_bridge.py capture --host "$DECO_LAN_IP" --pin "$PIN" --output "$HOME/Deco-private-capture"
```

`probe` makes two unauthenticated read requests and prints only key lengths.
`capture` prompts for the owner TP-Link password using `getpass` in your local
terminal. Do not paste it into chat or pass it on the command line. One login
attempt is allowed per process. No browser cookies, saved passwords or session
keys are read. The password/session remain in process memory and are not saved;
Python cannot guarantee secure memory erasure. No Keychain enrollment yet.

Default reads: device list, client list, CPU/memory performance and operation
mode. `--extended` additionally tries the community-documented signal-level and
traffic-stat read forms; support on these exact firmware versions is unverified.
An error stops the batch and saves partial evidence, without a login loop.
Optional `--samples 10 --interval 30` collects a bounded series (maximum 120
samples, at least 30 seconds between completed batches); Ctrl-C stops it.
This is a research session, not a background service with sleep/wake recovery.

## Outputs and interpretation

The output directory must be owner-only (0700), owned by you, and outside Git.
Each sample creates two exclusive 0600 files:

- `*.private.json`: minimally redacted original response fields for schema
  research. **Still private:** contains client/node identifiers and names.
  Secret-looking keys are redacted recursively; unknown values are not a
  guarantee of de-identification. Never attach these files to a public PR.
- `*.mesh.json`: selected fields only, HMAC aliases instead of MAC/IP/names,
  unknown units/scales preserved. Aliases remain stable only within a run.
  Times and activity can still be sensitive. No automatic upload or deletion.

Missing/malformed lists become `null`, distinct from verified empty lists.
No inferred absence, departure, human occupancy, respiration, heart rate or pose.
Rates remain raw with `unit: unverified`; radio bars are not labeled dBm.
Live data stays `live_unverified` until compared with the app on this firmware.
All offline `replay --input FIXTURE` output is explicitly `synthetic`.

The collector uses the protocol's AES-CBC/MD5/RSA for compatibility. Its outer
HTTPS connection requires an exact leaf-certificate pin on the same connected
socket before any HTTP bytes (including credentials) are sent. CA/hostname
checks are replaced by that explicit pin, not a trust-all network policy.
No redirects/proxies, arbitrary endpoint command, cloud forwarding, router
writes, firmware uploads, diagnostic daemon start or WLAN/password read exists
in the CLI. Responses are limited to 1 MiB; socket timeout is six seconds
(inactivity timeout, not an absolute whole-response deadline).

## Native Mac RF route

`mac_radio.swift` reads only the Mac's currently associated link through public
CoreWLAN methods. It produces separate `ruview.local_link.v0` JSON lines with
RSSI/noise in dBm, channel and transmit rate in Mbps. No SSID/BSSID, scan,
monitor mode, password, network change or CSI reconstruction. Apple's zero
error/disconnection sentinel becomes unavailable/missing data, not a measurement.

```sh
swiftc tools/deco_bridge/mac_radio.swift -o /private/tmp/ruview-mac-radio
/private/tmp/ruview-mac-radio --samples 10 --interval 1
```

**MEASURED:** Swift 6.3.3 compiled it on Intel macOS 26.6.2 and three one-second
samples returned available RSSI/noise/channel/rate. Polling cadence is not a
guarantee of independent hardware sample cadence. Disconnection/sleep/wake and
resource budgets remain untested. Samples describe one link, not every mesh
node. Existing RuView `MacosCoreWlanScanner` and `archive/v1/src/sensing/mac_wifi.swift`
already cover connected-link RSSI with a different schema; this privacy-minimal
research stream is not a drop-in replacement or a new server ingress.

CLI boundary witness: `--samples 0`, `--samples 121`, `--interval 0`,
`--interval 61`, `--unknown 1`, duplicate `--samples`, and missing option values
each exit2 without stdout. Valid samples were checked for the stated schema,
no identifiers, `complex_csi: false` and negative finite RSSI when available.

## Next gates / removal

Complete one owner-authenticated capture, compare counts/units with stock UI,
review sanitized field names, and add exact-firmware fixtures before expanding
the provider. The loopback server, RuView mesh UI and local Mac wrapper now
exist. Protected hardware acceptance, Keychain opt-in, persistent identity,
reconnect/sleep-wake, signing and full resource measurements remain unfinished.
See [research playbooks](../../docs/integrations/deco/README.md).

Stop a foreground CLI collector with Ctrl-C. Remove its private capture directory
and `.venv` when no longer needed. The CLI adds no root service, driver or router
setting; the separately installed cloud publisher has its own LaunchAgent.
Protocol provenance and license notice: [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES).

## Outbound cloud continuation

The working native bridge can now feed the separate private cloud companion
through `research_feed.py`. This reads only the existing loopback snapshot,
rebuilds an export allowlist and optionally probes bounded cached home neighbors.
`install_publisher.py` manages its owner-scoped LaunchAgent independently of
the native app. See [cloud setup and lifecycle](../deco_cloud/README.md) and
[controlled link experiments](../../docs/integrations/deco/09-live-link-experiments.md).
No original RuView tracking UI/Rust backend is deployed by this publisher.
