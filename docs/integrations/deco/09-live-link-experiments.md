# Live link experiments and dBm

Status: cloud companion deployed and receiving measured data, 2026-10-16.
No validated human tracking. See E70–E76 in [PR notes](PR-NOTES.md).

## Desired state and effect

Test whether available link measurements reproducibly distinguish controlled
conditions while preserving the Mac/iPad connection. Keep a useful private
live demonstration even if a sensing hypothesis fails. Do not turn network
timing, attachment or raw signal bars into invented positions.

## Prerequisites and observed inputs

Keep the native authenticated bridge running. The outbound publisher and private
cloud viewer provide CoreWLAN RSSI/noise, link rate, raw two-band node quality,
client records and bounded echo probes. All observations retain timestamps.
Client records currently provide no measured per-client RSSI. The publisher
does not increase protected router polling or change Wi-Fi mode/channel.

## Conversion: what can actually be computed

CoreWLAN RSSI and noise are already expressed in dBm. For received power:

`P_mW = 10^(dBm/10)` and `P_nW = 10^((dBm+60)/10)`.

| RSSI | Received power |
|---|---|
| −30 dBm | 1000 nW |
| −48 dBm | about 15.849 nW |
| −60 dBm | 1 nW |
| −90 dBm | 0.001 nW |

A 3 dB increase is about twice the received power; 10 dB is ten times. A dBm
difference is a dB ratio. RSSI minus simultaneous comparable noise is an SNR
estimate, not a newly captured channel measurement. These conversions add no
spatial or phase information. Mean dBm describes geometric mean power; use
linear power averaging if reporting mean watts instead.

Deco's observed 0–3 quality levels have no established thresholds or units in
the inspected source. A many-to-one category has no unique dBm inverse. Do not
calibrate them against the Mac's RSSI: they can represent different receivers,
bands and links. A valid calibration needs matched receiver/link observations,
firmware-specific thresholds and repeatability. Client packet timing is also
not RF propagation time; echo responses include scheduling, buffering, sleep,
retries and OS latency.

## Actions and evidence

1. On the private dashboard, keep Mac placement/orientation fixed. Observe a
   still baseline, then label Still for a timed interval. Record actual actions
   and times; do not label measurements retroactively.
2. Label Walking and follow a fixed route, then return to Still. Separately
   label Device moved while moving the measured device. Repeat with different
   traffic conditions. Owner labels are ground-truth assertions, not output
   from a detector. They apply only to subsequent observations for five minutes.
3. Inspect source freshness, gaps and roaming before comparing. The current
   five-second RF acquisition can miss short events. Keep RF conditions and
   slow mesh snapshots separate; more frequent cloud delivery cannot restore
   missed samples.
4. Compare RSSI distributions/variation across multiple trials. Freeze any
   threshold before a held-out session with both motion and no-motion periods.
   Record false alarms, misses and detection latency. Do not train and evaluate
   on the same interval. No such labelled acceptance has run yet.
5. Optional ICMP uses only up to four cached on-link neighbors, including the
   verified home gateway as control; two requests per target per batch, with
   at least 30 seconds between completed batches. A gateway MAC/subnet guard
   suppresses probes elsewhere. No range sweep. Missing replies are unknown,
   not evidence of absence or movement. Probe and Deco aliases are unrelated.
6. Preserve aggregate results in PR notes. Raw inventories, targets, screenshots,
   invitation tokens and local captures remain owner-only outside Git.

## RuView UI and integration gate

Update2026-10-17: [playbook10](10-ruview-ui-bridge-mode.md) implements and deploys
the adapted existing UI with a dedicated scalar mode, nullable unsupported
outputs and measured time/power traces. The earlier integration proposal below
is retained as rationale; native Rust inference remains undeployed.

The repository already contains `ui/index.html` with Sensing and Live Demo tabs,
and `ui/observatory.html` with 3D visualization. Tracking visuals are not proof
of tracking input: the Observatory includes a DemoDataGenerator, and live paths
expect the sensing server's schema. The deployed `tools/deco_cloud` page is a
separate telemetry companion; the original UI and Rust sensing backend are not
installed on Cloudflare by this slice.

Reuse those interfaces rather than rebuilding their renderers. First define an
explicit telemetry mode that accepts only measured supported fields, displays
unknown pose/location and cannot silently invoke simulation. Preserve the
existing `/ws/sensing` and pose contracts; do not forge ESP32/CSI frames from
mesh counts. An optional demonstration must visibly identify synthetic output.
The Rust service needs a compatible compute host if deployed; this Worker
does not run that native service. Document that deployment boundary before
calling the full RuView application connected.

## Completion and recovery

Live authenticated delivery is demonstrated. Motion/location acceptance remains
open until controlled held-out trials pass. Stop optional probes/publishing by
unloading its LaunchAgent; the working native collector is independent. Revoke
cloud invitations/publisher hash if retiring access. No radio mode, router
configuration, flashing or privilege escalation is part of recovery.

Primary measurement references:
[Apple RSSI](https://developer.apple.com/documentation/corewlan/cwnetwork/rssivalue)
and [Apple noise](https://developer.apple.com/documentation/corewlan/cwinterface/noisemeasurement()).
