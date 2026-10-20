# RF field visualization and movement calibration

Continuation 2026-10-17. Desired effect: show the owner's router anchors and
field overlaps, then test whether available observations discriminate movement
from a still baseline. A static attachment map does not satisfy that movement
goal. The new RF Field tab is a demonstrable coverage model and experiment
surface; validated human tracking remains an open hardware acceptance gate.

## Inputs and evidence

- Owner-authored floor/room rectangles and known approximate router anchors,
  fetched from the existing private configuration API. Unknown placements are
  omitted from the spatial field. No household geometry or labels enter Git.
- MEASURED current-link Mac RSSI, noise and source timestamps. There is one
  receiver stream, not one stream per Deco. Its associated Deco identity and
  receiver position are not established by the exported contract.
- MEASURED Deco node quality reports, retained as raw ordinal values. New
  numeric-to-numeric changes highlight the corresponding configured router;
  first observations, missing values, duplicate/reversed/future/stale frames
  cannot manufacture change events. Source timestamps and collection resets
  govern the bounded browser-local event history.
- MEASURED reported attachment transitions, mapped to room anchors as dashed
  endpoint links. These do not establish the intervening physical path, exact
  handoff time, a person carrying the device or movement without a device.

## Formula and spatial model

The illustrative isotropic log-distance model uses schematic drawing units:

```text
P(d) = P_ref - 10 n log10(max(d, d_ref) / d_ref) - F |floor_delta|
d_ref = 100 drawing units
r_same_floor = d_ref 10^((P_ref - threshold) / (10 n))
```

P_ref, path-loss exponent n, coverage threshold, floor separation and additional
floor loss F are explicitly adjustable assumptions. Default values are generic
illustrations, not measured hardware/room parameters. If reference power is
already below threshold, the modeled coverage radius is zero. Display radii
are capped at 1500 units while tile calculations retain the full bounded model.
Room scale, inter-floor registration, obstructions, antenna patterns, channels
and transmit powers remain uncalibrated. A sphere is a same-floor radial model;
the cross-floor grid also applies the extra floor loss. It is not an RF scan.

Overlap tiles count independently modeled links above threshold. They do not
add dBm values, compute interference or show a measured energy distribution.
All geometry is separate from `signal_field`, CSI and person outputs, which
remain unknown. Measured Mac RSSI never controls the radius of all routers.

Unit conversion alone is exact for the stated scalar:

```text
P_mW = 10^(RSSI_dBm / 10)
power_ratio = 10^(delta_dB / 10)
```

For example, -50 dBm is 10 nW and a -3 dB change is approximately half the
received power. This conversion does not recover propagation phase, wall
geometry, body size, distance, direction or CSI. A path-loss distance estimate
also requires calibrated reference measurements and a suitable propagation
model; multipath can invalidate a simple monotonic distance assumption.

RSS-based device-free localization is a legitimate research path. The primary
[multi-scale radio-tomography paper](https://arxiv.org/abs/1302.5914) uses many
known static links, channel diversity and link-specific spatial models. It
explains why movement may increase, decrease or leave RSS unchanged under
multipath. Its experimental performance is not evidence for this Deco feed.
A future spatial inverse model needs independent link observations, known
endpoints and calibrated spatial sensitivity; one global Mac scalar plus coarse
quality categories does not establish those inputs.

## Trial protocol and completion gate

1. Keep this Mac stationary and preserve normal Wi-Fi/bridge operation. Do not
   change radio mode, channels, source cadence or router configuration.
2. Owner clicks Mark still baseline and remains still for about 90 seconds.
3. Owner clicks Mark walking and walks nearby for about 90 seconds, then ends
   the trial. The label applies only after its actual save time; it expires
   after five minutes. Do not label assumed actions on the owner's behalf.
4. Compare distinct source-timestamped samples within the retained 15-minute
   history, only after this browser's trial start and within the same collection.
   Each condition needs at least eight samples spanning at least 30 seconds.
5. Inspect median RSSI, median absolute deviation, variance, median shift and
   power ratio. These are exploratory comparisons, not classifier accuracy or
   occupancy/localization outputs. A null or small difference is a valid result.
6. Repeat independently with still holdouts, other activity controlled where
   practical, and negative controls for traffic/orientation/roaming. Predefine
   a decision threshold using training trials; evaluate held-out false alarms,
   missed events and latency before making any human-motion claim.

The source cadence remains roughly five seconds, with actual delivered times
shown. Do not infer fast human dynamics or vitals from that sampling. Node
attachment sweeps are slower and staggered. A pause clears the shared action
label; ordinary household activity must not be counted as an intended trial.
No complete controlled movement trial has been accepted for this feature yet.

## Validation and recovery

Run cloud `npm test`, `npm run check`, `npm run build`, audit and deployment dry
run. Focused tests cover conversion vectors, threshold radius, parameter bounds,
unknown placements, overlap, source-state/timestamp deduplication and reset,
trial sample requirements and labelled comparisons. Synthetic inputs remain in
an isolated literal-loopback renderer fixture, never production.

Production acceptance uses `check_deployment.py --require-associations
--require-floorplan`, actual authenticated RF Field rendering and live source
ages. Capture private screenshots/normalized witnesses outside Git and put
aggregate results, failed gates and deployment revisions in [PR notes](PR-NOTES.md).
Software/visual acceptance is separate from physical movement validation.

This cloud UI change needs no collector/publisher restart or new Deco sign-in.
It changes no polling bounds, radio capture, firmware, router forms, viewer
population or backend inference contract. Existing owner access can be renewed
privately when its invitation expires; bearer codes never belong in PRs, URLs,
screenshots or chat. Browser cookies retain their eight-hour maximum.

To recover, select the prior reviewed Worker version, preserving its private
bindings and current cloud floor-plan revision. Do not reseed layout geometry,
delete the Durable Object or restart the authenticated native app to fix a
browser-only problem. Trial labels can be cleared through the existing owner
control without discarding or relabeling historical samples.
