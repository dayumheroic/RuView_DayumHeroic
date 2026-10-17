# RuView UI bridge mode

Implemented and deployed 2026-10-17. This continues the private cloud companion;
it does not deploy the native Rust sensing server or claim human tracking.

## Desired state and intended effect

Use the existing RuView interface to inspect actual bridge inputs and understand
what the sensing/tracking pipeline still needs. Provide a measured signal picture
and a falsifiable link-change experiment, with no simulated body or inferred
room positions. Preserve the owner's current Mac/iPad network connection.

## Implemented path

The private `/ruview/` route reuses `ui/index.html`'s shell/navigation, `style.css`,
`TabManager`, `SensingTab`, `GaussianSplatRenderer` and `PoseRenderer`. A dedicated
cloud bootstrap selects bridge mode. The ordinary local/backend UI keeps its
default service and renderer behavior. This is an adapted subset, not a copy of
all stock UI functions: Dashboard, Hardware, Live Demo and Sensing are available.
Native training/control panels, Pose Fusion and the synthetic 3D Observatory
are not deployed by this slice.

The bridge-mode service subscribes to the existing private `/api/live` WebSocket
and resynchronizes through `/api/snapshot`, with fallback/backoff. Both the
browser and authenticated `/api/ruview/snapshot` use the same pure mapping in
`ui/services/deco-sensing.mjs`. The mapping has its own schema; it does not forge
Rust `sensing_update` messages. No local key or router password reaches the UI.

All new UI assets and mapped API routes require the existing viewer login. The
owner invitation was refreshed for the same owner/role and eight-hour duration.
No new recipient was added. Three.js is pinned to the original renderer's r128
API and bundled locally. External font loading is removed from the hosted build;
open-source license notices are served inside the authenticated UI. Scripts
remain same-origin only. This UI allows inline CSS for the reused components'
style attributes; this does not relax the companion page's CSP or auth checks.

## What the data means

The source contract is `SensingUpdate`, `NodeInfo`, `FeatureInfo` and
`ClassificationInfo` in `v2/crates/wifi-densepose-sensing-server/src/main.rs`.
The original renderer consumes feature/classification/spatial outputs. Those
outputs require acquisition/processing; merely matching JSON field names is
not evidence of equivalent measurements.

| Expected input | Available mapping | Interpretation |
|---|---|---|
| `features.mean_rssi` | Mean of fresh distinct CoreWLAN samples | dBm mean, not mean watts |
| `features.variance` | Null; separate `scalar.rssi_variance_db2` | Temporal RSSI variance differs from CSI amplitude variance |
| Motion/breathing band power, dominant frequency | Null | Current sparse scalar stream cannot recover the expected CSI bands |
| `nodes[].amplitude`, subcarrier count | No CSI nodes | Raw Deco quality categories are not subcarrier arrays |
| Receiver positions and `signal_field` | Null | No measured room field, coordinates or localization |
| Presence, people, pose, vitals | Null/unavailable | Unknown does not mean absent or zero people |
| Mesh/client records, ICMP | Separate measurements | Own observation times and unverified traffic units; RTT is not RF radar |

The Sensing renderer plots real RSSI/noise history: X is observation time, Y is
received power in dBm, Z separates the two traces. These axes are not physical
room coordinates. No room/body/router placeholders are created in this mode.
The Live Demo uses the existing empty pose renderer alongside inspectable mapped
JSON. Dashboard supplies the input matrix; Hardware exposes actual raw levels.

## Derived link-change experiment

Keep only distinct, fresh RF samples within two minutes; discard history before
a gap over15seconds. Publisher collection changes also clear stored history
and annotations. A current sample missing from resynchronization cannot reuse
an old baseline. Stale/disconnected sources clear the current signal picture.

After at least eight baseline and three recent samples, compare recent median
RSSI against the baseline median. The experimental threshold is the greater of
3dB and three times a robust spread. Spread uses both1.4826×MAD and the
10th–90th percentile range/2.563. A quantized bimodal fixture exposed zero-MAD
underestimation; the percentile guard prevents that case from being treated as
quiet. This is an engineering heuristic, not a trained or calibrated human
detector. Output is `collecting`, `stable_link`, `link_change` or `unavailable`;
presence and pose stay unknown in every case.

Report effective samples/elapsed time separately from median inter-sample
interval. An approximate Nyquist value is supplied only for sufficiently regular
intervals; irregular/gapped data gets null. No interpolation creates extra
samples. Traffic, interference, orientation, hidden roaming and movement can
all affect this link. There is no per-client RSSI or multiple spatial receivers
in the current stream.

## Actual trials and validation

See E77 onward in [PR notes](PR-NOTES.md) for deployment IDs and results.
The native bridge was closed overnight; reopening it restored RF, and explicit
owner sign-in restored eight nodes/twelve client records. Existing polling and
publisher installation were preserved.

A separate bounded `mac-radio --samples 45 --interval 1` trial returned45/45
available real readings over44.61seconds, timestamp median1second, RSSI−48..−47dBm
and standard deviation0.442dB. The witness is owner-only outside Git. This proves
the helper can emit faster scalar readings in this trial; it does not prove
independent one-second hardware updates, movement sensitivity or CSI. No labelled
movement ground truth existed. It did not change the installed bridge's5second
RF cadence or protected router polling.

Controlled still/walking/device-moved trials and held-out evaluation remain the
next sensing gate. Use [playbook09](09-live-link-experiments.md); preserve labels,
source gaps and confounders. Do not label current passive observations as a
motion-accuracy experiment. Actual Safari/cellular and long-run reliability
remain separate acceptance work.

## Reproduction and recovery

Run the cloud package's tests, check and build; `build-ui.mjs` generates ignored
assets from reviewed source and pinned dependencies. `check_deployment.py` now
checks private UI routes and mapped unknowns as well as real WebSocket updates.
The native bridge and publisher operate independently of UI updates. A failed UI
revision can roll back without restarting Deco auth. Use the companion `/` page
to inspect source freshness and labels. No router flashing/settings changes,
monitor mode, root privileges or cloud-to-router commands are required.
