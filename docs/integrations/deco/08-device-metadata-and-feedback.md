# Device metadata and beamforming-feedback research

## Desired state and effect

Current owner constraint (E68): the second Mac is Wi-Fi only; keep research on
the current Mac and iPad. Preserve their associated Wi-Fi connections and the
running bridge. Defer dedicated monitor-mode trials; second-Mac/Ethernet
availability is no longer a pending question. Continue source review, existing
normalized API observations and ordinary associated-link measurements locally.

Use existing owned clients as transmitters, where compatible, to investigate
observable radio changes without flashing Decos or clients. First establish
what measurements exist; then perform labelled motion trials. This playbook
does not claim a working motion detector. The owner's detailed client inventory
stays private outside Git; product names alone do not establish active Wi-Fi,
band, antenna count, negotiated beamforming or accessible telemetry.

## Handshakes are different data sources

| Source | Potential observation | Limit |
|---|---|---|
| Association/probe frames | Advertised capabilities, supported bands/rates and connection events | Not a continuous channel measurement; not a reliable model/person identity |
| WPA security handshake | Key-establishment protocol metadata | Not CSI; collecting it does not create sensing measurements or require password recovery |
| DHCP / TLS metadata | Address assignment or application connection metadata, when visible | Network context rather than propagation measurements; TLS SNI may be absent/encrypted |
| Radiotap packet metadata | Receiver-reported signal, frequency/rate and other available fields | Depends on capture driver; signal is measured at the sniffer, not automatically at each Deco |
| Repeated beamforming feedback | Quantized feedback angles/steering information used during normal Wi-Fi operation | Promising channel-related sensing input, not recovered full CSI; format and cadence must be measured |
| Stock Deco node signal fields | Existing API provides two numeric band fields per node | Scale/link direction unknown; no per-client signal object observed in the current export |

Apple private Wi-Fi addresses also limit long-term MAC-based identity claims.
Do not disable privacy settings for discovery. Keep an owner-reviewed mapping
private if later needed; distinguish device attachment from human location.

## What was found in improvements

At checkout `d0e906c9538221f76a84cfaace6744b542674b2a`, REA is pinned to upstream
`3e7c6302233ecbcb9b92e43ee5a60337738961bd` (MIT). Relevant files:

- `reverse-engineering/rea/docs/packet-captures.md`: selected TShark fields from
  an existing capture; does not open a capture interface. This provider requires
  Linux and `prlimit`; macOS/Windows inspection is refused by this integration.
- `reverse-engineering/rea/docs/pcap-analysis.md`: existing-capture protocol,
  DNS, endpoint and TLS-SNI summaries. macOS capture inspection has an explicit
  capability gap; version probes alone are not analysis support.
- `reverse-engineering/rea/docs/web-network-captures.md`: offline HAR/SAZ/web
  evidence, with no recorded-target fetching or proxy/browser started.

These are plausible matches to the owner's remembered metadata tool, not proof
of which tool they meant. Root inventory and targeted tree/doc review did not
identify a dedicated CSI receiver. A broad lazy-object content search was
stopped in favor of targeted reads; no exhaustive whole-tree content claim.
Aliens_eye's own README identifies username OSINT; power-pwn targets Microsoft
cloud services. Neither establishes a stock-Deco capture path. No vendored
tool was installed/executed, and the improvements worktree remains unchanged.

## Existing RuView feedback tooling

The source tree already contains `tools/bfi/README.md`, `bfi_decode.py`, Linux
capture helpers, independent TShark comparison and quality reporting. Proposed
ADRs 364 and 365 separate live admission/continuity from public datasets.
Consult the current source with `git show HEAD:<path>` in sparse checkouts;
these files were not materialized or changed in this continuation.

The offline decoder supports selected complete VHT/HE SU reports in radiotap
classic PCAP. Other shapes/formats must fail closed. The Linux capture helper
changes its dedicated Wi-Fi interface and requires independent wired management;
it is not a portable macOS capture command. Existing repository results on an
Archer BE550 / separate Linux receiver are source-reported prior experiments,
not measurements of this owner's M5/M4R/E4R mesh. Do not transfer their capture
rates, firmware compatibility or activity results to these devices. Those prior
trials also had multi-second silent periods; they did not establish sustained
sensing. ADR-364 proposes three repeated trials with reports in at least27 of
30 sender bins and no gap above2seconds. It is a project engineering gate,
not a published accuracy guarantee or an accepted hardware result here.

Wi-BFI and BeamSense provide primary research supporting this avenue without
requiring changes to target AP/client firmware. A compatible capture receiver,
channel setup and usable feedback are still required. More/newer clients do
not ensure feedback: the negotiated AP/client link constrains features.

## Read-only measurements in this continuation

- E63: running installed API HTTP200, connected, eight node records with both
  numeric signal bands, twelve client records with no signal objects. A bounded
  90.4-second loopback observer retained twenty distinct snapshots and three
  mesh observation timestamps, without adding router requests. Observed node
  values were 0..3 for band2_4 and 0..2 for band5. These are compatible with a
  coarse ordinal scale, not proof of that interpretation. Zero is not asserted
  to mean offline or missing. Mac RSSI ranged -49..-48dBm. No movement labels
  were recorded, so no sensitivity/detection result follows.
- E65: local tcpdump4.99.1/libpcap1.10.1; tshark/capinfos/dumpcap not on PATH.
  On this Intel Mac, an inactive `pcap_create("en0")` handle succeeded but
  `pcap_can_set_rfmon` returned -8 (`PCAP_ERROR_PERM_DENIED`). Handle closed;
  no activation, mode-setting, privilege escalation or packet capture. This
  does not establish support or lack of support for monitor mode/BFI reception.
- E67: two unauthenticated, same-socket pinned static model GETs returned200.
  Router/client models supplied no additional signal-field semantics. Downloaded
  JavaScript was not executed. Private files/hashes are retained separately.

Local observation reproducer: use the running app's private config to read
`GET /v1/snapshot` on literal127.0.0.1 with the existing bearer key. Retain only
normalized `radio`/`mesh` and phase outside Git in mode0600 files; omit the
top-level target/pin. Sample locally every2seconds for90seconds, deduplicate on
source observation timestamps, count signal objects separately for nodes and
clients, and report distinct finite band values. This adds no collector login
or protected router reads. Do not print the config/key or upload the witness.

The capture-capability check uses only `pcap_create`, `pcap_can_set_rfmon` and
`pcap_close` on an inactive handle, with checked return values and declared FFI
signatures. It must not call `pcap_activate` or a mode/channel setter during
read-only discovery. See libpcap's documented distinction below.

## Client roles and next experiments

| Candidate | Initial role | Verify before use |
|---|---|---|
| MacBooks | Controllable stationary endpoint; public CoreWLAN scalar sampler; possible separate capture host | Exact hardware/OS, radio capabilities, independent management and capture privileges |
| Phones/tablets | Owned, awake associated client for a bounded feedback trial | Actual linked Deco, band, negotiated capabilities, power/traffic state; no developer mode assumed |
| TVs, speakers, appliance | Fixed-position candidate links for repeatability | Wi-Fi rather than Ethernet, active transmissions and available radio features; no assumption of continuous packets |
| Watches | Optional future Wi-Fi/Bluetooth observation | Actual active transport and hardware; Bluetooth requires a separate capture path and is not Wi-Fi CSI |

1. Establish the meaning and cadence of existing node signal fields against
   matched stock UI/source. Keep the running collection unchanged. Investigate
   per-client signal/association fields only through source-backed read forms;
   do not confuse backhaul quality with client-to-AP RSSI.
2. A second Mac can collect its own associated-link scalar time series without
   monitor mode or flashing. Compare stationary versus independently labelled
   walking periods with fixed endpoints; record traffic, channel and roaming
   changes as confounders. This is an experiment, not a calibrated detector.
3. For passive feedback capture, select a separate receiver with independent
   management first. The owner confirmed Wi-Fi-only hardware and selected
   current-Mac/iPad research (E68), so defer this trial. Do not switch the
   current bridge/remote-session Wi-Fi interface into monitor mode. A later
   capture setup remains separate from current read-only research.
4. First demonstrate own-AP beacons on the verified channel with bounded time,
   size/packet limits and restoration. Then filter intended own-link feedback,
   retaining captures privately. Do not force reconnects/deauthentication,
   impersonate nodes, extract passwords or capture application content to
   obtain a sensing signal. Ordinary bounded traffic is a later controlled
   variable, not a guarantee of sounding or permission to flood clients.
5. Validate complete supported reports against an independent decoder. Measure
   unique reports, full-window coverage/gaps and drops. A beacon/handshake-only
   recording or a zero-report run cannot certify BFI incompatibility.
6. Only after sustained usable measurements: freeze a protocol for stationary
   controls versus labelled movement, held-out trials, false alarms and missed
   detections. Compare against a no-motion baseline. Keep results separate from
   mesh records and from RuView pose/vitals claims.

## Recovery and evidence

### Same-Mac static-source follow-up (E69)

Seven bounded unauthenticated same-socket pinned GETs read the declared module
registry, router model/controllers/view, client controller and common utility
controller. No downloaded code ran; no session material or protected form was
used. The client controller sends the selected `device_mac` with the existing
client-list read and renders `connection_type` labels. Its ten-second UI reload
timer is not a validated polling recommendation for this bridge. No polling
configuration was changed.

The router controller's `list2Tree` links non-master records using the raw
`previous` field; it selects identity/display fields, images and online state
for the tree. This supports a candidate topology parser, not proof of stable
identifiers or complete parent semantics in a captured fixture. Generic code
for newer Deco models/bands is not evidence this hardware supports them.

No dBm mapping, signal-field conversion or continuous radio sample stream was
found in the inspected paths. This bounded negative result does not establish
that all stock interfaces lack richer fields. Next, verify parent/client-band
fields in a future explicit allowlisted diagnostic capture, then compare node
quality with a matching stock display/source. Do not inspect process/session
memory or restart a successful collection merely to obtain extra raw fields.

| Static source under `/webpages/` | SHA256 |
|---|---|
| `config/modules.json` | `9a0e16e24c9e9387566cfab3d6e4bb9f68f8fb54b90f89b4bb5d163e622654ec` |
| `modules/networkMap/mapRouter/models.js` | `eadd8cb52a7b70161d0cdd66a4aaf7a3b6ee9a8f015b0eb1565115b1c1f75128` |
| `modules/networkMap/controllers.js` | `5cfc2446290c5ec6ec524c0b62eef6584d92a457601e824dae3a446d2b555ac7` |
| `modules/networkMap/mapRouter/controllers.js` | `f2aa8ac9dfa20010613229f77160098886b8fdb000d594d8abe38bdddb2772c4` |
| `modules/networkMap/mapRouter/view.html` | `b1d310927e5268cfc139949f8be26364551fa721bf9277270263f71f3f47dcb1` |
| `modules/networkMap/mapClients/controllers.js` | `2259b978160eb19c80fc964a7e644b524f6cec468cf7bf3203ca856c8aae6d66` |
| `modules/utils/controllers.js` | `542055803bd6c4700b3a5d73ef22e34ed315beaa0d48ece70a22636ea47a4e67` |

### Cleanup

Stop local snapshot observation with no router rollback. Packet trials must
record and verify receiver restoration before being called complete. Keep raw
captures, names, mappings, addresses and the household device inventory outside
Git. Publish aggregate outcomes and exact software/format limits in PR notes.

## Primary references

- [Wi-BFI paper](https://arxiv.org/abs/2309.04408) and
  [author implementation](https://github.com/kfoysalhaque/Wi-BFI).
- [BeamSense paper](https://arxiv.org/abs/2303.09687).
- [Wireshark WLAN capture](https://wiki.wireshark.org/CaptureSetup/WLAN/) and
  [radiotap fields](https://www.wireshark.org/docs/dfref/r/radiotap.html).
- [Kismet macOS capture](https://www.kismetwireless.net/docs/readme/datasources/wifi-macos/)
  — receiver/driver/channel/privilege requirements, not compatibility proof.
- [libpcap inactive capability query](https://www.tcpdump.org/manpages/pcap_can_set_rfmon.3pcap.html).
- [Apple private Wi-Fi addresses](https://support.apple.com/en-us/102509).
