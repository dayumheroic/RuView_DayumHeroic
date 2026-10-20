# Private room map and Deco anchors

Continuation2026-10-17. The owner supplied room photos, approximate annotated
segments and router placements. The feature adds an owner-authored schematic to
the existing private RuView deployment. It does not infer walls, RF ranges,
human location or room geometry from mesh measurements.

## State and effect

The Floor Plan tab contains floor switching, room boxes, approximate router
anchors, last-reported device counts, a room-labelled attachment table and
retained attachment-change observations. Source freshness, unknown/conflicting
assignments and collection resets remain explicit. Room boxes use schematic
units, not measured building coordinates. Photo segment annotations remain
reference notes rather than a claim of complete wall polygons or room areas.

The current private draft has two floors/eight router-associated zones. Some
adjacency is owner-described; remaining room connections, stairs, footprint
alignment and scale are provisional. One office/balcony is grouped as a single
anchor zone. Those drawing choices are configuration, not sensor discoveries.
Private names, images, geometry, room-to-router mappings and source photo paths
must remain outside Git. The shipped renderer and fixtures are generic.

## Source binding and privacy

The native collector matches owner-configured nickname/custom-nickname strings
locally, including strict base64 UTF-8 decoding for firmware display names. It
exports only an opaque room key alongside the existing node HMAC alias. Missing,
conflicting or duplicated matches stay unassigned. There is no fuzzy matching,
model/topology-based room guessing, MAC export or new router form.

The private room-binding config preserves deliberately mismatched room/router
names. Opaque room keys survive collector restarts; device/node session aliases
still reset under the existing policy. No cross-session client history is
established. A restart of the collector/publisher loads the reviewed feature;
it requires a local owner sign-in because the router password is memory-only.

The publisher and cloud validate/rebuild room_id. Owner-authored room labels and
notes live in a separate authenticated configuration document; they are not raw
router names forwarded by telemetry. Photos stay on the Mac and are not served
or uploaded. The existing approved viewer population can read this private map.
Only the owner can edit it. No new viewer or credential scope is created.

## Private storage and editing

- GET /api/floorplan: authenticated plan/revision and editing capability.
- PUT /api/floorplan: owner plus exact same Origin; bounded32KiB JSON, strict
  schema and expected_version. Concurrent/stale saves return409.
- POST /api/floorplan/undo: same owner/origin boundary and expected revision;
  restore the prior saved plan through the same validator.
- SQLite current/previous plan is persistent configuration, separate from the
  fifteen-minute telemetry/history retention. It is not removed by telemetry
  alarms or collection resets. Only one prior plan is retained for undo.

Owner controls support room/anchor dragging, numeric schematic bounds, labels,
placement notes, save/cancel, undo and local JSON download. Other viewers have
read-only access; hiding controls is backed by API authorization. Stored text
uses textContent/SVG text nodes; arbitrary fields/image data are discarded.
Inventories, text, coordinates, references and request size are bounded. No
remote router-control path or general file upload is introduced.

## Validation and evidence

E93–E99 in [PR notes](PR-NOTES.md) records the current results. Focused synthetic tests
cover geometry/privacy, room references, explicit mapping, missing/duplicate
bindings, stale/expired/conflicting claims and source event timestamps. Local
Worker/SQLite integration separately checks anonymous/viewer/cross-origin denial,
revision conflicts, save and undo. A browser edit persisted and undo restored the
fixture. The local fixture never entered production.

The real collector had already stopped on a device-read network timeout before
this update. Private backups preserved its config/scripts, target, pin and key.
Reviewed native/publisher updates were installed, and the owner signed in once.
All eight actual inventory records matched distinct configured room keys on the
first batch. A complete association sweep/cloud/UI gate passed: eight unique room bindings,
eight observed node filters and ten attributed records among eleven then-current
clients. The actual Floor Plan tab renders both floors with source ages and
pending/unknown/conflicting states. The saved plan is revision2, newer than the
initial revision1 seed; retain the cloud plan rather than reseeding over edits.
Existing RF cadence, protected base polling and optional node-filter bounds are
unchanged. No flashing, router configuration, monitor mode or privileged capture.

Reproduce against the private deployment after a complete protected sweep:

```sh
python3 tools/deco_cloud/check_deployment.py --config "$HOME/Library/Application Support/RuViewDecoBridge/cloud.private.json" --require-associations --require-floorplan
```

## Recovery and next gates

Save a local layout JSON before major edits. Undo can restore the preceding save;
revision checks prevent silent concurrent overwrite. To revert collection code,
use the private native/publisher backup and preserve target/pin/key; reloading
requires an explicit local owner login. Cloud renderer rollback is independent;
the added SQLite table does not modify the prior telemetry schema.

Next: confirm remaining room/door/stair relationships and scale, refine drawing
geometry, cross-check a selected device against the stock Deco UI, then run a
labelled device-roam trial. Device room association is approximate and can lag
physical movement or cross walls. No human-motion/pose accuracy is established.
