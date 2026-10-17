# 05 — Lightweight macOS bridge delivery

## Desired state and effect

A small local application collects the verified telemetry contract, reports
health and reconnects safely without router changes. The current preview includes
the CLI, native RF reader, loopback service, RuView mesh page and an unsigned
AppKit/WebKit Mac app. See [installation and implemented contract](../../../tools/deco_bridge/APP.md).
RF-to-API-to-dashboard and native-parent cleanup are measured; protected mesh
acceptance, native-window visual validation, production distribution and real
sleep/wake/reconnect acceptance remain unfinished. Build slices below are the
broader delivery roadmap, not all completed features.

## Prerequisites and design choice

Finish inventory, local-interface validation and contract review first. The
measured development host is an Intel MacBook Pro with 16 GB RAM on macOS
26.6.2. Ship/test x86_64 first on this host; arm64 support requires its own
build and validation. The first collector uses Python 3.11 with pinned
cryptography wheels and a small independent Swift CoreWLAN reader. This fits the
available host toolchains; the inspected standalone upstream SDK requires
Python 3.14 and includes unrestricted mutators/transport behavior we do not need.
The preview shell uses platform AppKit/WebKit, not a bundled browser runtime.
Rust plus a SwiftUI shell remains a future packaging option. Keep collection
independently runnable.

Current code and exact commands: [collector README](../../../tools/deco_bridge/README.md).
Sixteen synthetic protocol/security tests pass, including a complete mocked
firmware login/read. Live `probe` passes on the main M5 without credentials.
The native RF reader compiled with Swift 6.3.3 and returned three current-link
samples at one-second intervals on this Intel Mac. These are not CPU/RSS,
sleep/wake, disconnected-state or end-to-end RuView acceptance measurements.
An additional short five-sample run measured 4.04 s elapsed and 4,833,280-byte peak
native process RSS (E42); this does not establish the 15-minute application budget.

## Build slices

1. **Offline contract slice:** fixture parser, normalized snapshot, state machine
   and CLI diagnostics. Explicit fixture mode is SYNTHETIC. No credentials or
   network writes; deterministic tests cover playbook 04 failure cases.
2. **Live read slice:** owner-selected literal target, Keychain entry, reviewed
   session handshake and status-read allowlist. Timeouts, serialized polling,
   auth lockout handling and bounded retries. No general proxy or arbitrary URL
   input. Show the exact model/firmware currently being validated.
3. **RuView consumer slice:** authenticated loopback API plus separate mesh
   panel. Enforce Host/Origin policy and explicit allowed RuView origin; no
   wildcard CORS. Never put tokens in URLs, browser storage or telemetry logs.
   Evaluate same-origin proxying under existing RuView auth before choosing
   browser transport; loopback alone does not prevent hostile web-page access.
4. **Application slice:** menu status, last-success age, node/client counts,
   credential setup, pause/resume and diagnostics export with preview/redaction.
   Render unavailable data honestly; no occupancy/biometric labels.
5. **Delivery slice:** reproducible x86_64 build, optional universal build,
   versioned app/config and owner-controlled startup. Signing/notarization and
   distribution require a separately configured release identity/process.

## Acceptance matrix

| Scenario | Required observable outcome |
|---|---|
| Start without credentials | Setup state; no repeated login loop |
| Correct owner login | Status-only snapshot matches app on exact firmware |
| Wrong/expired credentials | Clear auth error; stop automatic credential retries |
| Router absent, Wi-Fi/VPN change | No sweep or gateway fallback; stale then disconnected policy |
| Sleep/wake | One resumed collection; no retry burst or old data shown as fresh |
| Missing/partial clients | Unknown/partial coverage, not fabricated departure events |
| RuView offline | Collector bounded and healthy; UI explains separation |
| Hostile Origin or wrong local token | Request denied, no device data disclosed |
| Polling paused | No router requests; state visibly paused/stale |
| Uninstall | Process/startup entry removed; optional Keychain/config removal confirmed |

Proposed performance budget (unmeasured): steady resident memory below 100 MiB,
average idle CPU below 1% of one core over a 15-minute run, no more than one
collection every 30 seconds, bounded storage and response buffers. Measure CPU,
RSS, wakeups, request count and sleep/wake recovery on the target Mac; document
actuals rather than claiming the budget has been achieved.

Keep acceptance evidence in PR notes: app/collector commit, macOS and CPU
architecture, exact Deco tuple, scenario, timestamps, observed outcome and
sanitized logs. Distinguish offline fixture results from live-device witnesses.

## Installation and removal contract

No root daemon, packet-capture entitlement or driver installation for the MVP.
Owner installs the app; startup remains off until selected. Store configuration
under the user's Application Support directory with restrictive permissions,
bounded rotating sanitized logs and no raw-response retention by default.
Provide version/diagnostic commands, manual start/stop, credential replacement,
config migration/rollback and explicit uninstall instructions. Test removal on a
fresh profile before calling the application deployable.

## Completion and recovery

Gate: offline checks pass, one exact-model/firmware live session is witnessed,
acceptance scenarios pass, resource measurements are captured, and install,
upgrade, rollback and removal are verified. Stop/pause the bridge to recover;
retain private credentials unless the owner explicitly removes them. Hardware
support claims list only the model/revision/firmware actually tested.
