# Local Mac application — research preview

Build on macOS with Swift and Python 3.11+, after the venv setup in
[README](README.md):

```sh
tools/deco_bridge/.venv/bin/python tools/deco_bridge/install_macos.py \
  --host "$DECO_LAN_IP" --pin "$PIN" \
  --ruview-origin http://127.0.0.1:8080
open "$HOME/Applications/RuView Deco Bridge.app"
```

The installer compiles the current architecture, copies only the reviewed
service/static assets, and installs pinned wheels in an isolated private venv.
It needs the host Python installation; this is a local build, not a portable
standalone or notarized release. Existing apps are not overwritten; quit and
move an old app aside before installing a reviewed replacement. Config target,
pin and consumer-origin changes require explicit private config review.

The native AppKit/WebKit window starts its own loopback service and supplies a
random 256-bit bridge key via a request header. Its WebKit data store is
ephemeral. No bridge token in URLs, browser persistence or request logs.
RF starts immediately without a Deco login. The owner password goes into the
app's local form, after comparing the displayed certificate pin with the trusted
router certificate. One explicit attempt per collection session; no owner
password is saved. After rejection or pause, use **Reconnect Deco** to return
to sign-in. It enables after any in-flight operation finishes and at least
30 seconds have elapsed since the last sign-in attempt. Reset never contacts
the router or logs in automatically. No credential is needed in chat.
Python/JavaScript cannot guarantee secure erasure of in-memory strings.

**MEASURED:** on the development Intel Mac, the installed service returned real
CoreWLAN RSSI/noise/channel/rate. The new RuView page displayed those readings
through a separate test bridge across the explicitly allowed UI origin.
Stopping that test service cleared live values. Terminating the native lifetime
owner closed its service port within three seconds. Native-window rendering,
owner-authenticated protected API collection, actual sleep/wake, arm64 and
steady-state full-app resource acceptance remain unverified.

## API and consumer

| Endpoint | Contract |
|---|---|
| `GET /v1/snapshot` | `ruview.bridge.v0`, containing separate `ruview.local_link.v0` radio and `ruview.mesh.v0` mesh records, connection phase and source states. Unknown node/client lists are `null`, not zero/empty. Target/pin are local config metadata, never credentials. |
| `POST /v1/deco/connect` | Bounded JSON `{password, pin_confirmed: true}`; explicitly requests one login and device/client reads. Unused performance/mode forms are excluded from dashboard collection. The checkbox is an owner's trust assertion, not automatic certificate verification. |
| `POST /v1/deco/pause` | Bounded JSON `{}`; stops subsequent Deco reads and immediately removes the mesh snapshot. One already in-flight read may finish. |
| `POST /v1/deco/reset` | Bounded JSON `{}`; explicit recovery only from failed/paused after worker exit and the sign-in cooldown. Clears collection state/aliases, restores sign-in, and preserves RF collection. No router request. |

All data/actions require `Authorization: Bearer <private bridge_key>`. It lives
in the owner-only `config.json` under
`~/Library/Application Support/RuViewDecoBridge/`. Never commit or send this file.
The service binds only `127.0.0.1:8766`, validates Host and Origin, and serves
only four fixed UI assets. The optional RuView origin is an explicit trust
decision: pages/scripts at that origin can use the key entered there. No wildcard
CORS or LAN binding. No router URL/endpoint proxy exists.

RuView's **Deco Mesh** navigation opens `ui/mesh.html`. When served by RuView,
enter the companion URL and bridge key once; both stay in page memory and are
lost on reload. The native app supplies its own key automatically. Browser local
network-access permission, if requested by that browser, is owner-controlled.
The mesh page operates independently of the sensing server. It does not feed
RSSI/mesh records into a pose model or register an unvalidated vendor provider.

RF polling is five seconds, stale after 15 seconds or a failed helper read.
Mesh polling is 30 seconds **after a completed batch**, stale after 90 seconds
or any later collection failure. Elapsed wall and monotonic time cover sleep
and clock changes; a backward clock step fails freshness closed until the next
sample. These transitions are tested synthetically; real sleep/wake is pending.
All real samples remain `live_unverified`; no attestation or calibrated sensing
claim. No automatic owner-login retry or reconnect after a protected read/schema
error. Connection phases are `setup_required`, `connecting`, `connected`,
`failed` and `paused`, separate from ADR-295 source states.
Failure diagnostics expose only a fixed stage (authentication, a named status
read or schema validation), never router error text or session URLs.

The API uses one HTTP request handler at a time, three-second local socket
timeouts and 4 KiB mutation bodies. Separate RF and mesh workers keep sampling
out of the HTTP handler. Router reads retain the collector's 1 MiB limit and
six-second inactivity timeout (not an absolute whole-response deadline). A
complete device/client schema is required before publishing a mesh batch.
API rates retain unknown units, aliases are per-collection-session HMACs, and RF has no
SSID/BSSID. No raw protected payload is retained by the service. Use the
separate private CLI capture when an owner-authenticated fixture can be obtained.

## Owner-reported failure and recovery

The first owner login reached device/client reads and failed at the later
performance form. The old app discarded that entire batch and hid sign-in
without offering recovery. Those two defects are fixed: the dashboard now reads
only the two forms it uses, and Reconnect Deco restores sign-in locally. The
performance failure's underlying router/transport cause is not established.
The CLI retains its separate four-form research batch and private partial output.
Authentication/read-return success does not establish normalized schema or units;
full hardware acceptance still needs a successful dashboard snapshot.

## Check and remove

```sh
tools/deco_bridge/.venv/bin/python -m unittest discover -s tools/deco_bridge -v
node --test tools/deco_bridge/test_mesh_client.mjs
```

Quit with Command-Q or close the app's last window. The service also watches
its native parent and exits if it dies. Nothing starts at login. To uninstall,
quit first, move `~/Applications/RuView Deco Bridge.app` to Trash, then optionally
move the private `~/Library/Application Support/RuViewDecoBridge/` folder to
Trash. That removes runtime/config/key; historical CLI captures in the separate
research folder are unaffected. No root service, driver, Keychain record or
router configuration needs removal. Full uninstall/fresh-profile acceptance is
still a release gate.
