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
  Submodules and Rust workspace dependencies were not installed. The collector's
  pinned Python wheels are installed only in its ignored `.venv`.

Read current git status and root/scoped instructions before editing. RuView
`AGENTS.md` and `CLAUDE.md` were read; improvements root README/CATALOG and
REA scoped instructions/security policy were inspected. No vendored tool ran.

## Findings and next actions

1. Read [PR notes](PR-NOTES.md), [avenue register](06-raw-telemetry-research.md)
   and [collector commands](../../../tools/deco_bridge/README.md). Current slice
   is a runnable research collector, not a finished application or RuView provider.
2. Pinned HTTPS `probe` works on the main M5. Initial CA verification failed;
   later certificate retrieval succeeded. Use a checked leaf SHA256 pin on the
   same TLS connection before sending credentials. Public API signing/password
   keys measure 512/1024 bits; the HTTPS certificate is 2048 bits. These do not
   establish the mesh SSH key size. Browser credentials/cookies were not extracted.
3. First protected API capture needs owner password entry in the local terminal
   (`getpass`, one attempt, no persistence). A private local launcher was prepared
   outside Git; inspect any capture files directly rather than asking the owner to
   read them. Existing signed-in Chrome supports further UI telemetry research
   while standalone enrollment remains unfinished. Keep all private JSON
   outside this public repo; review redaction before turning fields into fixtures.
   Default reads are devices, clients, performance and mode. Extended signal/traffic
   reads are optional and still unverified on this firmware. Stop on first failure.
4. Sixteen synthetic tests cover crypto/login/read, endpoint denial, pin mismatch,
   response limits, private writes and unknown data. Live probe is separate
   hardware evidence. Native `mac_radio.swift` also compiles/runs on this Intel Mac
   and returns current-link RSSI/noise/channel/rate without identifiers. Existing
   RuView connected-link scanner has a different schema; no server ingest added.
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
