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
| main-01 | Main (app) | M5 (app) | Unknown | 1.9.5 Build 20260602 Rel. 25369 | Operating mode unknown | E17: owner-provided app screenshots; no local API response yet |
| node-01 | Satellite (app) | M4R (app) | Unknown | 1.8.2 Build 20251027 Rel. 36869 | App shows wireless link to main on 2.4/5 GHz | E17: app screenshot; exact revision still unknown |
| remaining | Count unknown | E4/M4R reported | Unknown | Unknown | Unknown | Owner reported two E4s; reconcile inventory |

The supplied app views show client counts, per-node/per-client rates and signal
indicators. These are measured observations of what the app displays, not proof
that a local API exposes the same fields. The earlier subnet mismatch (E18) is
resolved: the Mac joined the Deco LAN, and its gateway/ARP identity matches the
main unit in the app (E20). Local root and index pages returned HTTP 200 (E21).
The broader upstream/downstream topology and operating mode remain unverified.

## Capability matrix

These remain **CLAIMED collection capabilities**, not measured authenticated
responses. E22 provides **MEASURED static source evidence** for node/client and
performance reads on the main unit's current UI. Community source S2 supplies
additional polling precedent; the owner's M4R/E4 revisions still need testing.

| Candidate data | Validation on target | Limitation |
|---|---|---|
| Nodes, versions, client list, association | Compare status response with app and labels | Private interface can change by firmware |
| Connection type and traffic rates | Verify units, interval and per-client coverage | Rates are not necessarily cumulative bytes |
| Backhaul/status indicators | Compare each satellite and wired/wireless uplink | Indicator scale is not calibrated dBm |
| CPU/memory diagnostics | Query only if discovered; verify scale | Optional; absence must not become zero |
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
