# CC handoff — stock Deco research


## Latest continuation: attachment build deployed, live gate pending

2026-10-17: playbook11 and E84–E88 describe the new attachment pipeline.
Worker deployment5e11df51f0f84d87ab00274f70727548 serves the shared view on the
companion and original RuView Hardware tab. Native node-filter reads are opt-in
through private associations_enabled, two extra serial reads per normal cycle.
The first real filtered response failed the array-only schema while basic
8-node mesh collection remained connected. A diagnostic update proved a schema
mismatch, not a TLS/auth failure. The installed parser now accepts exactly an
empty object as an empty client report, rejects missing/null/populated objects,
and keeps bounded type/count witnesses only locally. Fresh local sign-in and a
complete sweep are still needed to classify the actual response and verify
memberships. Do not call mapping verified yet; no movement/roam trial has run.

Main-node previous is ignored, matching the stock UI, giving seven reported
parent edges. Keep unknown/conflicting/stale attachments explicit. One delayed
optional retry is allowed only for classified transient transport failures;
rejection/schema failure stops optional reads without dropping base telemetry.
No raw private captures, diagnostics, names, addresses or passwords go to Git or
the cloud. Preserve the next working session. Latest focused tests:60Python,
14cloud Node,23existing Node. Pending: protected full sweep, production
--require-associations, browser proof and commit/push/PR evidence update.


## Latest continuation: existing RuView UI deployed in bridge mode

2026-10-17: [playbook10](10-ruview-ui-bridge-mode.md) and E77–E83 describe the
implemented `/ruview/` UI. This supersedes the earlier original-UI integration
gap below. It reuses original shell/CSS/tabs, SensingTab/Gaussian renderer and
PoseRenderer with a dedicated scalar service, not the stock backend bootstrap.
Dashboard maps expected inputs, Hardware shows raw levels, Sensing plots real
RSSI/noise against time, and Live Demo keeps pose empty with inspectable mapped
JSON. Native Rust inference, full synthetic Observatory and training controls
remain undeployed. Unsupported outputs remain null, not absent/zero people.

The existing bridge was closed overnight. It was reopened; one explicit local
owner login restored eight nodes/twelve clients. Preserve that session. Existing
owner invitation refreshed for the same role/eight-hour duration, no new viewer.
Latest cloud deployment `b438328f980d41cf9ccf3e868ebff27d`. Private credentials and
screenshots stay outside Git. No router write/flashing/mode/capture changes.

The pure mapper is `ui/services/deco-sensing.mjs`, shared by browser and mapped
API. RSSI variance has its own dB² name; it is not CSI amplitude variance.
Median/MAD plus percentile-guard link change is an unvalidated heuristic, not
human sensing. Stale/gapped/insufficient data stays unavailable/collecting.
Effective RF delivery is slower/less regular than a nominal five-second read;
irregular data gets no Nyquist claim. A bounded45sample1second helper trial
returned real scalar data without altering installed acquisition; independent
hardware refresh/motion sensitivity remains unknown. Next: controlled labelled
trials, consider an optional faster scalar path without disrupting owner auth,
and continue richer RF-source research. Do not manufacture CSI or keypoints.

## Current handoff: private live companion deployed

E70–E76 in [PR notes](PR-NOTES.md) are the latest state. The native bridge's
protected collection has succeeded. Preserve its working owner-authenticated
session. An installed owner-scoped outbound publisher now exports an allowlist
to a Cloudflare Worker/SQLite Durable Object. An authenticated dashboard receives
real WebSocket updates; the latest acceptance saw eight nodes, eleven clients
and four echo probes. No router writes/flashing/radio-mode change occurred.

The owner selected private app authentication because Access was unavailable;
no plan/billing setup was completed. Invitations are expiring bearer tokens,
with hash-only cloud bindings and a separate publisher credential. One owner
invitation exists, no invite-management UI. Keep tokens/account details and raw
telemetry in private Application Support, never PRs. See
[cloud README](../../../tools/deco_cloud/README.md) for deployment, auth,
retention, reproduction, publisher start/stop and revocation. The native bridge
is independent of the new LaunchAgent. It must remain awake/home/running.

**The cloud dashboard is a companion, not the original RuView UI or Rust
sensing backend.** The owner explicitly asked about the existing tracking UI;
the answer is that RuView already includes Sensing/Live Demo/Observatory. Reuse
those views with an explicit telemetry mode, preserve unknown tracking fields
and prohibit silent synthetic fallback. Do not call the full RuView tracking
application connected yet. Native Rust needs a suitable compute deployment;
the Worker does not run it. No validated human-motion/location result exists.

Next: [playbook09](09-live-link-experiments.md) for controlled current-Mac/iPad
tests and original-UI integration gates. Current RF is scalar and five-second
acquisition can miss events. Deco quality0–3 cannot be uniquely converted to
dBm; Mac RSSI already is dBm. Power/SNR conversion is tested. ICMP RTT is not RF
radar. Only cached neighbors on the verified home subnet are probed, with at
most four targets/two requests per target per batch. No sweep or monitor mode.

Focused checks passed: Python/Node contracts and existing mesh client, Worker
types/build/audit/dry-run, local DO/auth round-trip, real HTTPS/auth/WebSocket
acceptance and browser rendering. Actual iPad/Safari/cellular, long-run
sleep/wake, full-app resources and held-out motion acceptance remain open.
Current source changes are on `codex/deco-stock-telemetry-research`, draft PR34;
use its latest commit rather than the historical baselines below.

## Historical handoff context (superseded by the current section)

## Objective and authority

Newest research E63–E67: owner asks about existing clients and handshake metadata.
[Playbook 08](08-device-metadata-and-feedback.md) locates REA's offline capture
analysis, separates security handshakes from repeated beamforming feedback,
and records existing node signal fields versus missing client signal fields.
A 90-second local observer completed; no router polling increase. An inactive
libpcap capability query returned permission-denied, not a compatibility verdict.
No monitor-mode activation or packet capture. E68 resolves hardware availability:
second Mac is Wi-Fi only; owner selects research on current Mac and iPad.
Defer isolated receiver trials and preserve this connection. E69 traces stock
client filters/band labels and raw node-parent topology; no signal-scale
conversion or continuous RF stream found in the inspected source paths.
Detailed household inventory
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
