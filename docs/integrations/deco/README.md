# Stock Deco → RuView research

Research date: 2026-10-16 (America/Bogota). Scope: the owner's stock Deco
M5/M4R/E4R mesh and a lightweight macOS bridge. No flashing,
firmware upgrades/downgrades, factory resets, or router configuration changes.

Includes a bounded [research collector](../../../tools/deco_bridge/README.md)
and a native Mac RF reader. A local [Mac app, bridge API and RuView mesh page](../../../tools/deco_bridge/APP.md)
now provide a working RF-to-dashboard path. The collector's pinned HTTPS login handshake works
on the main M5; owner-authenticated telemetry capture remains pending. The Mac
reader returns real current-link RSSI/noise/channel/rate. Neither establishes
stock complex CSI or completed protected-mesh acceptance. Signed-in stock UI evidence
and the complete eight-node inventory are in playbook 01 and PR notes.

| Playbook | Desired state and intended effect | Completion evidence |
|---|---|---|
| [01 Hardware and interfaces](01-hardware-and-interfaces.md) | Identify each unit and available stock interfaces; avoid designing against assumed capabilities | Exact inventory and field capability matrix from the owner's devices |
| [02 Authorized assessment](02-authorized-assessment.md) | Understand exposure and validate relevant findings with bounded tests | Target/service register, version-matched advisory evidence, reproducible disposition |
| [03 Tooling review](03-tooling-review.md) | Select relevant, auditable tools from `improvements` | Pinned manifests, license review, execution/side-effect decision |
| [04 Integration design](04-integration-design.md) | Select an observed telemetry path and preserve provenance | Contract, fixture replay and reviewed interface decision |
| [05 macOS bridge](05-macos-bridge.md) | Deliver a small local collector with reliable diagnostics | Offline tests, live exact-firmware acceptance, installation and removal checks |
| [06 Raw telemetry avenues](06-raw-telemetry-research.md) | Investigate APIs, logs, security findings, firmware, BFI and native RF access | Per-avenue evidence, exclusions and falsifiable next gate |

Start with [PR notes](PR-NOTES.md), then [CC handoff](CC-HANDOFF.md). Keep the
PR description and these notes synchronized as evidence changes. Sources and
their limitations are in [SOURCES.md](SOURCES.md).

Separate owner-requested tuning report for another Codex session:
[performance and coverage handoff](PERFORMANCE-HANDOFF.md). It proposes measured,
reversible experiments; no live tuning settings have been changed.

Evidence labels:

- **MEASURED**: a local command or exact-device observation with reproducer.
- **CLAIMED**: documentation, community compatibility report, user-reported
  history, or a proposed design. It is not a local hardware result.
- **SYNTHETIC**: invented fixtures/examples, always watermarked.

Connected-device presence and AP association do not establish human occupancy,
room location, pose, breathing or heart rate. No stock M5/M4R CSI export path
has been verified in this work. Missing data must remain unknown.
