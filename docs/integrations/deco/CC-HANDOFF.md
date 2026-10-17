# CC handoff — stock Deco research

## Objective and authority

Newest research E63–E67: owner asks about existing clients and handshake metadata.
[Playbook 08](08-device-metadata-and-feedback.md) locates REA's offline capture
analysis, separates security handshakes from repeated beamforming feedback,
and records existing node signal fields versus missing client signal fields.
A 90-second local observer completed; no router polling increase. An inactive
libpcap capability query returned permission-denied, not a compatibility verdict.
No monitor-mode activation or packet capture. Second Mac/Ethernet availability
is pending for a later isolated receiver trial. Detailed household inventory
and observations stay private. Existing RuView BFI code is a research asset,
not proof of Deco capture compatibility or movement detection.

Latest continuation: E61 confirms a successful protected local snapshot with
eight nodes/twelve client records. The owner now requests continuous delivery
and private phone/iPad access through their Cloudflare account. See
[playbook 07](07-continuous-feed-and-private-cloud.md). This is proposed cloud
design, not a deployed stream. Hostname and initial owner email are pending.
Keep the working authenticated Mac app running. Cloud delivery cannot convert
traffic/RSSI into validated human-motion measurements. Never tunnel the current
local auth/control port or expose its bridge key to remote viewers.

Continue the owner's RuView–Deco project toward a lightweight macOS bridge.
The user authorizes repository research, documentation and assessment of their
own network; start with read-only hardware/interface discovery. No flashing or
router changes. Security-provider verification does not replace exact target
scope or authorize a different tool/operator to exceed it.

## Checkouts and baseline

Both checkouts are sibling directories under the selected macOS workspace:
`RuView_DayumHeroic` and `improvements`. The parent repository was empty
(`main`, no commits, no remote); do not confuse it with either source checkout.

- RuView source: `dayumheroic/RuView_DayumHeroic`, baseline
  `3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76`, research branch
  `codex/deco-stock-telemetry-research`.
- Tool library: `dayumheroic/improvements`, baseline
  `d0e906c9538221f76a84cfaace6744b542674b2a`, branch
  `claude/focused-goodall-b5ot6r`, unchanged by this work.
- Both are shallow sparse checkouts; unmaterialized files are not absent from
  the repository. Consult `git ls-tree` before drawing absence conclusions.
  Submodules and Rust workspace dependencies were not installed. The collector's
  pinned Python wheels are installed only in its ignored `.venv`.

Read current git status and root/scoped instructions before editing. RuView
`AGENTS.md` and `CLAUDE.md` were read; improvements root README/CATALOG and
REA scoped instructions/security policy were inspected. No vendored tool ran.

## Findings and next actions

1. Read [PR notes](PR-NOTES.md), [avenue register](06-raw-telemetry-research.md)
   and [collector commands](../../../tools/deco_bridge/README.md). Current slice
   now includes a runnable local Mac app, sidecar API and RuView mesh page;
   [APP.md](../../../tools/deco_bridge/APP.md) defines the implemented contract.
   It remains a research preview, with no Rust provider/model ingress.
2. Pinned HTTPS `probe` works on the main M5. Initial CA verification failed;
   later certificate retrieval succeeded. Use a checked leaf SHA256 pin on the
   same TLS connection before sending credentials. Public API signing/password
   keys measure 512/1024 bits; the HTTPS certificate is 2048 bits. These do not
   establish the mesh SSH key size. Browser credentials/cookies were not extracted.
3. First protected API acceptance needs owner password entry locally: the app
   now has a direct password form and pin-comparison gate, or use terminal
   `getpass` for a private CLI fixture. One attempt per collection session, no
   persistence; the app now has explicit Reconnect Deco after worker exit and a
   30-second sign-in cooldown. The CLI remains one attempt per run.
   A private local launcher was prepared
   outside Git; inspect any capture files directly rather than asking the owner to
   read them. Existing signed-in Chrome supports further UI telemetry research
   while standalone enrollment remains unfinished. Keep all private JSON
   outside this public repo; review redaction before turning fields into fixtures.
   App reads are devices/clients only. CLI defaults also include performance/mode.
   The owner's first login passed authentication/device/client request return
   checks, then failed at performance before normalization; no response fixture
   or schema/unit acceptance followed. App collection now excludes that unused
   form and offers recovery. Extended signal/traffic
   reads are optional and still unverified on this firmware. Stop on first failure.
4. Focused synthetic tests cover crypto/login/read, endpoint denial, pin mismatch,
   response limits, private writes and unknown data. Live probe is separate
   hardware evidence. Native `mac_radio.swift` also compiles/runs on this Intel Mac
   and returns current-link RSSI/noise/channel/rate without identifiers. Existing
   RuView connected-link scanner has a different schema; no server ingest added.
   The companion now exposes the measurements to its own dashboard and RuView's
   separate mesh page. See latest PR notes for current tests/live witnesses.
5. Eight-node inventory: two M5(3.2), two M4R(2.0), four E4R(4.0), builds in playbook 01.
   Main ports 22/23 refuse; satellite ports 22/23 refuse/time out. All seven TCP 80
   ports accept; three TCP 443 accept and four time out. Do not assume a timeout means absent
   or map these transport groups to models without verified device-list records.
6. Stock logs expose association/disassociation and internal root SSH events.
   Important side effect: source inspection after viewing showed the page prepares
   `feedback_log` with operation `build` automatically. No explicit Save/Clear or
   config control was used. These callbacks are excluded from the strict collector.
7. Prioritize matching stock internal telemetry callbacks and the BFI capture path
   after the normal API fixture. Reviewed advisories do not establish an applicable
   exploit on this inventory. CSI-Bench's IPQ4019 support depends on vendor-enabled
   drivers/utilities; no stock-M5 CSI conclusion follows. No exploit, monitor-mode
   switch, driver load, firmware change or router configuration save occurred.

## Integration decision to preserve

Implemented files: `tools/deco_bridge/bridge_service.py`, `MacApp.swift`,
`install_macos.py`, and `ui/mesh*`. The installed app/runtime live outside Git
under the owner's Applications/Application Support folders. Do not commit the
private config, bridge key, certificate pin, captures or local screenshots.
Inspect local results directly. The real protected API gate remains open;
browser DOM observations must never be relabeled as unattended API captures.
Next: one explicit owner login in the app; inspect API schema/units and compare
with stock UI, then capture/redact an exact-firmware CLI fixture. If unsupported,
stop and fix the adapter using observed fields, without automatic retries.
The updated app was reopened at sign-in after the first failed collection.
Inspect local snapshot output directly when the owner retries. Never request
the password in chat or try to recover it from process/browser memory.
After the desktop restart a newer attempt failed at authentication; the old
stage-only result cannot identify its cause. The unauthenticated pinned probe
still passes. The app now exposes fixed failure_reason categories with no
upstream exception text, so inspect stage/reason together on the next attempt.
The next inspected attempt passed login and failed at device-list read with
transport_or_decode. The owner reports briefly seeing device records earlier,
but no successful capture/screenshot was retained. Preserve that distinction.
The app now allows a 30-second request timeout and one delayed transient-read
retry using the same session; no automatic login retry. Last successful records
remain visible as Stale/last observed, so inspect their capture time before
claiming current presence. CLI transport default remains six seconds.

Mesh/device telemetry belongs in a separate surface. Existing sensing outputs
and MQTT publication are not generic Deco inputs. A native provider needs an
ADR-270 contract and registry changes. Preserve ADR-295 source states and never
transform client presence into people, CSI, pose or vitals. No verified stock
M5/M4R CSI export path was found; this is a research limit, not proof that no
possible path exists.

## Required return note

For each CC continuation, add a dated PR note with commit, files changed,
exact target tuple, command/request, expected/actual result, evidence ID,
privacy treatment, validation status, unresolved questions and next action.
Use MEASURED/CLAIMED/SYNTHETIC labels. Keep sensitive exploit findings in the
appropriate private security channel. Never paste credentials or raw traffic.

This file is the handoff artifact; no external message has been sent to CC.
