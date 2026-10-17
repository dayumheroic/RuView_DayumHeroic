# Stock Deco → RuView research

Research date: 2026-10-16 (America/Bogota). Scope: the owner's stock Deco
M5/M4R/E4R mesh and a lightweight macOS bridge. No flashing,
firmware upgrades/downgrades, factory resets, or router configuration changes.

Includes a bounded [research collector](../../../tools/deco_bridge/README.md)
and a native Mac RF reader. A local [Mac app, bridge API and RuView mesh page](../../../tools/deco_bridge/APP.md)
now provide working RF and protected mesh-to-dashboard paths. E61 verifies a
live normalized API snapshot with eight nodes and twelve client records; an
earlier owner screenshot showed eleven clients. The Mac reader returns real
current-link RSSI/noise/channel/rate. Raw-rate units, complete field semantics
and long-run reliability remain unverified. No stock complex CSI or human-motion
detection is established. Signed-in stock UI evidence
and the complete eight-node inventory are in playbook 01 and PR notes.

The private cloud companion is now deployed, receiving the existing bridge's
allowlisted export over authenticated HTTPS and delivering WebSocket updates.
It includes real dBm/power measurements and optional bounded ICMP experiments.
An adapted bridge mode of the original RuView UI is now deployed at `/ruview/`;
the native Rust tracking backend remains undeployed. See
[UI integration and data meanings](10-ruview-ui-bridge-mode.md), the
[cloud implementation](../../../tools/deco_cloud/README.md) and E70–E76.

| Playbook | Desired state and intended effect | Completion evidence |
|---|---|---|
| [01 Hardware and interfaces](01-hardware-and-interfaces.md) | Identify each unit and available stock interfaces; avoid designing against assumed capabilities | Exact inventory and field capability matrix from the owner's devices |
| [02 Authorized assessment](02-authorized-assessment.md) | Understand exposure and validate relevant findings with bounded tests | Target/service register, version-matched advisory evidence, reproducible disposition |
| [03 Tooling review](03-tooling-review.md) | Select relevant, auditable tools from `improvements` | Pinned manifests, license review, execution/side-effect decision |
| [04 Integration design](04-integration-design.md) | Select an observed telemetry path and preserve provenance | Contract, fixture replay and reviewed interface decision |
| [05 macOS bridge](05-macos-bridge.md) | Deliver a small local collector with reliable diagnostics | Offline tests, live exact-firmware acceptance, installation and removal checks |
| [06 Raw telemetry avenues](06-raw-telemetry-research.md) | Investigate APIs, logs, security findings, firmware, BFI and native RF access | Per-avenue evidence, exclusions and falsifiable next gate |
| [07 Continuous feed and private cloud](07-continuous-feed-and-private-cloud.md) | Deliver observations to owner/invited mobile viewers through Cloudflare | Deployed private companion; authenticated ingest and real WebSocket delivery measured |
| [08 Device metadata and feedback](08-device-metadata-and-feedback.md) | Investigate owned clients, packet metadata and beamforming feedback without flashing | Measured node/client signal-field coverage, read-only capture preflight and controlled-trial gates |
| [09 Live link experiments](09-live-link-experiments.md) | Test dBm, link variation and network timing without inventing tracks | Unit vectors and live measurements; controlled motion acceptance remains open |
| [10 RuView UI bridge mode](10-ruview-ui-bridge-mode.md) | Reuse the original interface and map expected inputs to the live bridge | Deployed private UI, live scalar picture and explicit unknown tracking fields |
| [11 Device-to-node attachments](11-device-node-associations.md) | Show node-filtered membership, ages and observed attachment changes | MEASURED eight-node sweep and live cloud acceptance; unknown/conflicting claims preserved; physical roam validation open |
| [12 Private room map](12-private-room-map.md) | Owner-authored floor zones and router anchors with live device attachments | MEASURED eight room bindings/full sweep/cloud acceptance; private editable schematic; geometry refinement open |

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
