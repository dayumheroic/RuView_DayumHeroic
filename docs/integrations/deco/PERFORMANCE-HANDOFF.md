# Deco performance and coverage handoff

## Objective and working scope

Improve usable coverage, local throughput, latency and roaming on the owner's
existing stock mesh. Start with read-only measurements and a reversible tuning
plan; no flashing, firmware upgrades/downgrades, factory resets or speculative
power/clock modifications. A request for this report is not a request to change
live settings immediately. Preserve the RuView telemetry project and its draft
PR #34; isolate concurrent implementation work after reading current git status,
root instructions and attached worktrees. Do local/browser inspection yourself.

## Verified inventory and access

| Count | UI model / hardware | Firmware |
|---|---|---|
| 2 | M5 / 3.2 | 1.9.5 Build 20260602 Rel.25369 |
| 2 | M4R / 2.0 | 1.8.2 Build 20251027 Rel.36869 |
| 4 | E4R / 4.0 | 1.1.2 Build 20250226 Rel.35508 |

Main is an M5. Regions/physical labels and complete per-node wired/wireless
mapping remain unverified. The UI has shown chained satellite relationships;
parent topology has varied between observations, so recapture it before tuning.
The main WAN uses an upstream private network distinct from its own LAN;
inspect operating mode and upstream routing before diagnosing double NAT.

The owner's Chrome session is signed in and usable for normal UI inspection.
No need to ask the owner to read files, paste diagnostics or repeat setup when
these are accessible locally. Do not extract browser tokens/passwords. The
standalone collector's protected API capture is a separate unfinished gate:
it currently needs its own owner credential entry, not broader machine permission.
Native CoreWLAN RSSI/noise/channel/rate reads already work on this Intel Mac.

## Measured baseline and unresolved hypotheses

- Browser observation at 2026-10-17T01:13:19.282Z: ten visible client rows, three
  with nonzero rate pairs; five explicitly Wireless(5G), five unknown. Read via
  DOM, without names/IP/MAC retained. Values are UI observations, not raw API
  fields or a maximum-throughput benchmark. Private JSON saved outside Git.
- Twenty one-second ICMP probes from the Mac to the main: 20/20 replies,
  0% loss; min/mean/max/stddev 4.258/34.655/210.050/47.912 ms. This short,
  uncontrolled sample suggests latency variation worth testing. It does not
  distinguish airtime, backhaul, client power saving, host scheduling or router
  ICMP prioritization. No LAN throughput or ISP capacity test has run.
- Earlier native samples reported an 866 Mbps transmit PHY rate on channel 44.
  This describes the Mac's current radio link at that instant, not application
  goodput or every satellite. Channel width and effective backhaul capacity need
  independent verification.

## Highest-value investigations

1. **Correct the benchmark.** Dashboard rates are current traffic, not capacity
   ([official explanation](https://community.tp-link.com/us/home/threads/topic/814326)).
   Separate ISP/main WAN testing from local Wi-Fi and mesh transport. Use a known
   wired LAN peer for bounded bidirectional throughput tests when available;
   never select an arbitrary client as a test server. Repeat at least three times
   in fixed locations, with the same client/orientation and recorded background
   activity. Capture median goodput, latency distribution, loss, channel and
   actual associated node. IP traceroute does not count layer 2 wireless relays.
2. **Check port/cable negotiation.** Vendor specifications list
   [M5](https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-m5/) and
   [M4](https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-m4/) with
   Gigabit ports; [E4v4](https://www.tp-link.com/en/home-networking/deco/deco-e4/)
   has 10/100 Mbps ports. Verify the exact units and negotiated links. An E4 wired
   segment cannot carry Gigabit traffic; an E4 wireless satellite does not impose
   a blanket 100 Mbps cap on the entire mesh. Software cannot upgrade its port PHY.
3. **Prioritize the backbone.** Evaluate wired M5/M4R links first where existing
   cabling allows. Follow [Deco Ethernet-backhaul wiring rules](https://www.tp-link.com/nordic/support/faq/1794/)
   for the verified Router/AP mode; avoid loops. E4 wiring can improve stability
   but caps that wired path, so compare it against the measured wireless path.
4. **Audit density and relay depth.** There are eight nodes. TP-Link generally
   recommends [up to six for wireless/PLC backhaul](https://www.tp-link.com/us/support/faq/1588/);
   this is guidance, not proof eight is wrong or a hard device limit. Test whether
   redundant nodes or long wireless chains waste airtime. Temporarily disabling
   a node is a scheduled experiment with restoration, not deletion/reset.
5. **Improve placement and parent selection.** Put relays where they still
   receive a strong upstream link, then extend outward. Use elevated/open
   positions and test wall/floor paths. [Connection Preference](https://www.tp-link.com/us/support/faq/3480/)
   can select parents/clients on supported models; inspect actual availability
   on these firmware builds. Closest node is not automatically the best parent.
6. **Audit settings after the physical baseline.** Inspect QoS total-bandwidth
   values/priorities, guest/IoT restrictions, ECO/power settings, radio channels,
   widths, beamforming and fast-roaming availability. Change one supported setting
   at a time and retain previous values. Do not blindly maximize channel width,
   disable protections, force every client to 5 GHz or assume all mixed-model
   settings are available. QoS is an allocation tool, not added radio capacity
   ([vendor QoS guide](https://www.tp-link.com/au/support/faq/1601/)).

## Deliverables and acceptance

Produce an exact topology/link-rate inventory, baseline room matrix, ranked
bottlenecks, and reversible experiments with before/after evidence. Choose
configurations that improve the target rooms without degrading critical devices,
coverage, loss or roaming. Document inconclusive tests rather than promising a
percentage gain. Recommend purchases only after demonstrating a hardware limit;
the first pass should use existing equipment and cabling.

Range/throughput tuning does not establish raw CSI access. The companion project
must keep network telemetry, current-link RF metrics and any future complex CSI
as distinct capabilities. Keep private captures outside Git and add sanitized
findings/tests/rollback results to PR notes. No other Codex session has been
created or messaged by this handoff.
