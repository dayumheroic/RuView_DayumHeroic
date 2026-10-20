# 01 — Hardware and interface discovery

## Desired state and effect

An exact device/firmware/topology inventory and a measured field matrix tell
the bridge what it can collect without altering the network.

## Prerequisites

The owner has authorized assessment of their network. Resolve target identity
before active probing: a default gateway is not necessarily a Deco, and a VPN,
AP-mode deployment or upstream router can change routing. Use the owner's
existing Deco app session for inventory; do not put account passwords in chat,
shell arguments, screenshots, fixtures or PRs.

## Actions

1. Read `AGENTS.md`, `CLAUDE.md`, nearest scoped instructions and git status.
   Record branch/commit and preserve unrelated changes.
2. Run local, read-only discovery (these commands may print private identifiers;
   retain raw output privately and publish only a sanitized summary):

   ```sh
   uname -s
   sw_vers
   networksetup -listallhardwareports
   ifconfig en0
   route -n get default
   netstat -rn -f inet
   arp -an
   ```

   Identify the Wi-Fi interface first rather than assuming `en0` on another Mac.
   ARP is a cache, not a complete host inventory or proof of vendor identity.
3. In the Deco app, read network mode, main-unit LAN address, model, hardware
   revision, full firmware build, node count and uplink/backhaul per node.
   Read the underside label if the app omits revision/region. Resolve M5 vs
   E4 vs M4R from labels; do not silently rename an M4R to a tested M4.
4. Check the route to the confirmed main-unit address. Make one unauthenticated
   request to its login page with a short timeout, no redirects, no credentials
   and a response size limit. A timeout is reachability evidence only.
   Do not disable the VPN or change routes automatically.
5. Prefer the stock management UI. After identity is established and the owner
   supplies credentials through local secure entry, inspect only status reads.
   Local web APIs can use POST for `operation=read`; classify the operation by
   payload and endpoint, not HTTP verb alone. Login creates session state.
6. Compare two bounded status snapshots to the app. Record source field names,
   units, timestamps, optionality and node coverage. Redact before retaining a
   fixture. Keep failed/unsupported queries in the matrix too.

## Inventory worksheet

| Alias | Role | Label model | HW/region | Full firmware | Mode/uplink | Evidence |
|---|---|---|---|---|---|---|
| main-01 | Main | M5 | 3.2 / region unknown | 1.9.5 Build 20260602 Rel. 25369 | Distinct WAN/LAN interfaces observed | E17, E28, E29 |
| node-01 | Satellite | M4R | 2.0 / region unknown | 1.8.2 Build 20251027 Rel. 36869 | E17 shows wireless link to main | E17, E29 |
| node-02 | Satellite | M5 | 3.2 / region unknown | 1.9.5 Build 20260602 Rel. 25369 | Uplink shown in UI hierarchy; link type unverified | E26, E29 |
| node-03 | Satellite | M4R | 2.0 / region unknown | 1.8.2 Build 20251027 Rel. 36869 | Link type unverified | E29 |
| node-04 | Satellite | E4R | 4.0 / region unknown | 1.1.2 Build 20250226 Rel. 35508 | Link type unverified | E29 |
| node-05 | Satellite | E4R | 4.0 / region unknown | 1.1.2 Build 20250226 Rel. 35508 | Link type unverified | E29 |
| node-06 | Satellite | E4R | 4.0 / region unknown | 1.1.2 Build 20250226 Rel. 35508 | Link type unverified | E29 |
| node-07 | Satellite | E4R | 4.0 / region unknown | 1.1.2 Build 20250226 Rel. 35508 | Link type unverified | E29 |

The signed-in firmware table resolves the earlier reported inventory discrepancy:
two M5, two M4R and four E4R units. Revisions above are the UI's model suffixes;
physical label/region checks remain useful before applying regional advisories.
Room names and identifier mappings are omitted from public notes.

The supplied app views show client counts, per-node/per-client rates and signal
indicators. These are measured observations of what the app displays, not proof
that a local API exposes the same fields. The earlier subnet mismatch (E18) is
resolved: the Mac joined the Deco LAN, and its gateway/ARP identity matches the
main unit in the app (E20). Local root and index pages returned HTTP 200 (E21).
The signed-in Status page subsequently showed the main unit's WAN on the
previous upstream subnet and its LAN on the Deco subnet (E28), explaining the
original routing mismatch. It reports a Dynamic IP internet connection and
separate WAN/LAN interfaces; a dedicated operating-mode field was not inspected.

## Capability matrix

The table separates **MEASURED signed-in UI observations** from unverified
standalone collection capabilities. E22 also supplies static source evidence.
No reusable API response fixture or credentialed collector has been validated.

| Candidate data | Validation on target | Limitation |
|---|---|---|
| Node count, model, revision and firmware | MEASURED UI: eight entries, exact tuples above (E26/E29) | Standalone response and region still unverified |
| Client list and connection type | MEASURED UI: twelve displayed clients; names/addresses and Wireless(5G) or dash (E27) | Dash means unknown; UI freshness/completeness unverified |
| Per-client traffic rates | MEASURED UI: paired rates labelled KB/s; non-zero values observed (E27) | Raw API units, decimal/binary scale and accuracy still unverified |
| Client association | UI provides an all-node/per-node selector (E27) | Selection label changed, but refreshed row membership was not verified |
| Topology and backhaul indicators | MEASURED UI: hierarchy for eight nodes (E26) | Complete link type/quality and calibrated dBm remain unverified |
| WAN/LAN and radio status | MEASURED UI: separate interfaces, Dynamic IP, radio channels and guest/IoT enable flags (E28) | Describes the observed instant, not a validated polling contract |
| CPU/memory diagnostics | Static declarations only (E22); no live values observed | Optional; absence must not become zero |
| Raw complex CSI | Require documented export plus real capture | No verified stock-Deco path found |
| Human occupancy/pose/vitals | Require a separate validated sensing source | Never infer from client association/counters |

See playbook 04 for the endpoint declarations and response-validation gate.

## Evidence and completion gate

Keep UTC capture time, operator, exact device tuple, command/request class,
response outcome, privacy treatment and evidence ID. Gate passes only when
every in-scope node is inventoried, a route and identity are verified, and each
promised field has an exact-device observation. An unsupported interface is a
valid recorded outcome; it is not a reason to flash.

## Recovery

Stop discovery on identity uncertainty, authentication lockout, latency spikes
or instability. Close the research session and stop the collector; do not reboot,
reset or update a router as an automatic recovery step. Read-only local
discovery needs no router rollback.
