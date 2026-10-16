# CC handoff — stock Deco research

## Objective and authority

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
  Submodules and dependencies were not installed.

Read current git status and root/scoped instructions before editing. RuView
`AGENTS.md` and `CLAUDE.md` were read; improvements root README/CATALOG and
REA scoped instructions/security policy were inspected. No vendored tool ran.

## Findings and next actions

1. Read [PR notes](PR-NOTES.md) and [playbooks](README.md). The Mac is confirmed;
   no Deco telemetry or vulnerability has been validated yet.
2. E17 provides app-view evidence of the main address and two firmware builds.
   E20 supersedes the routing problem in E18: the owner joined the Deco Wi-Fi,
   the main address is on-link, and the gateway neighbor MAC matches the app.
   HTTP root/index pages and static models are reachable (E21/E22). Verify
   operating mode separately; do not infer the full topology from connectivity.
3. Complete the exact device inventory, especially remaining models, region and
   hardware revisions. Main M5 and one M4R app firmware views are recorded in
   playbook 01; this does not validate their local API. Record aliases in PR notes;
   keep addresses, MACs, account data and room names private.
4. Inspect the endpoint declarations in playbook 04. Strict HTTPS verification
   failed and a certificate-inspection handshake timed out (E23). Resolve the
   transport gate before automated credential use. The owner later supplied a
   signed-in Chrome dashboard screenshot (E24); no password or protected API
   request was submitted by the agent. The supported browser tool rejected page
   access under its URL policy (E25). Do not evade that block via Chrome or
   terminal/session extraction. Continue from owner-provided read-only inventory
   screenshots while supported product controls/support resolve browser access.
   Community integration remains a reference; avoid control services.
5. Update the matrix with sanitized evidence. Choose the access path only
   after observing a real response. Then implement the fixture parser and
   bridge contract before connecting live collection.

## Integration decision to preserve

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
