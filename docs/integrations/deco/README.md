# Stock Deco → RuView research

Research date: 2026-10-16 (America/Bogota). Scope: the owner's stock Deco
M5/M4R mesh, possible E4 nodes, and a lightweight macOS bridge. No flashing,
firmware upgrades/downgrades, factory resets, or router configuration changes.

This is a research and implementation plan, not a working collector or a claim
of hardware compatibility. App screenshots identify the main M5 firmware and
one M4R firmware. After joining the Deco Wi-Fi, the Mac reached the main unit's
stock web UI and its local neighbor identity matched the app screenshot.
After the owner explicitly allowed the router origin in Chrome permissions,
agent read-only browser access succeeded. The signed-in UI exposed client rates,
connection types, network status and the complete model/revision/firmware table.
Standalone collector response contracts and HTTPS trust remain unverified.
See E20–E29 in PR notes; the measured inventory is in playbook 01.

| Playbook | Desired state and intended effect | Completion evidence |
|---|---|---|
| [01 Hardware and interfaces](01-hardware-and-interfaces.md) | Identify each unit and available stock interfaces; avoid designing against assumed capabilities | Exact inventory and field capability matrix from the owner's devices |
| [02 Authorized assessment](02-authorized-assessment.md) | Understand exposure and validate relevant findings with bounded tests | Target/service register, version-matched advisory evidence, reproducible disposition |
| [03 Tooling review](03-tooling-review.md) | Select relevant, auditable tools from `improvements` | Pinned manifests, license review, execution/side-effect decision |
| [04 Integration design](04-integration-design.md) | Select an observed telemetry path and preserve provenance | Contract, fixture replay and reviewed interface decision |
| [05 macOS bridge](05-macos-bridge.md) | Deliver a small local collector with reliable diagnostics | Offline tests, live exact-firmware acceptance, installation and removal checks |

Start with [PR notes](PR-NOTES.md), then [CC handoff](CC-HANDOFF.md). Keep the
PR description and these notes synchronized as evidence changes. Sources and
their limitations are in [SOURCES.md](SOURCES.md).

Evidence labels:

- **MEASURED**: a local command or exact-device observation with reproducer.
- **CLAIMED**: documentation, community compatibility report, user-reported
  history, or a proposed design. It is not a local hardware result.
- **SYNTHETIC**: invented fixtures/examples, always watermarked.

Connected-device presence and AP association do not establish human occupancy,
room location, pose, breathing or heart rate. No stock M5/M4R CSI export path
has been verified in this work. Missing data must remain unknown.
