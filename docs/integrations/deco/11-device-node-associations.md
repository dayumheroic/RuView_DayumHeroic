# Device-to-Deco attachment observations

Continuation2026-10-17. The owner requests device-to-node tracking through the
Deco login. The code and hosted UI are implemented; protected node-filtered
hardware acceptance remains pending after a real filtered response failed the initial array-only schema check. A reviewed parser update is installed for a fresh local sign-in.
Do not infer success from a deployed page, unit fixtures or the old combined list.

## Desired state and effect

Show which Deco last reported each client, when it was observed, reported parent
links and observed attachment changes. Preserve unknown/conflicting membership
and source timestamps. This is device attachment evidence, not RF tracking of
people or a precise room location.

## Source and request boundary

The previously inspected stock client model/controller uses the existing
`admin/client?form=client_list` read form with `params.device_mac` set to the
selected node. `default` returns the combined list. The router controller builds
its node tree from `previous`. See E69 and playbook08 for pinned artifact hashes.
Those source semantics support this implementation; exact live membership still
needs acceptance on the owner's firmware.

`Session.read_node_clients` fixes the form and `operation:read`, accepts only a
MAC from the current bounded device inventory, and reuses the existing in-memory
owner session. No arbitrary target/form/operation is accepted. No new login per
node and no parallel access to the session's signing state.

The native app enables this feature through private `associations_enabled:true`.
The original two device/global-client reads remain. After publishing that base
snapshot, at most two additional node-filter reads run serially in each cycle.
Eight nodes need at least four cycles; the next cycle waits30seconds after work
completes. This explicitly increases status reads from two to at most four per
cycle, without a subnet scan, faster base-loop setting or router writes.

A classified transient optional failure has one delayed retry, on the same node/session in the next normal cycle. Other failures, or another transient failure, stop further association reads for that collection session while base telemetry continues. Reconnect/new local session
resets the tracker; there is no automatic owner-password retry. Core read failure
and its existing bounded retry policy remain separate.

## Data and uncertainty

- Preserve HMAC aliases using the same per-collector salt as node/client records.
  MACs, IPs, names and passwords are excluded from cloud exports. Model labels
  have a fixed M5/M4/M4R/E4/E4R allowlist; role and parent references remain typed.
- Each node-filter result gets its own original observation timestamp and client
  membership list locally. The cloud receives only group counts/times, bounded
  alias relationships and events, never a raw protected response.
- Last-observed claims expire after five minutes. Multiple positive node claims
  remain ambiguous with no chosen node; an ignored filter cannot silently create
  roaming. A missing claim remains unknown. Combined-list absence or a timeout
  is not a confirmed departure.
- Attachment changes require different uniquely observed nodes and increasing
  observation times. Older results cannot reverse event history. Events describe
  observations between two times, not the exact handoff instant or physical path.
  The local history is bounded; at most32 events within15minutes are exported.
- Aliases reset with a new collector session. Old publisher collections cannot
  establish continuity across those resets. The updated publisher was restarted
  when installing this slice. Pending/conflicting/stale results are explicit.
- `previous` supplies reported parent links only if it references another current
  node, and only for non-master records, matching the stock tree builder. It does not supply measured coordinates, link direction or room geometry.

## Implementation and viewer

`AssociationTracker`/normalizer → native snapshot → strict publisher projection
→ cloud association validator → existing authenticated WebSocket → shared
attachment renderer. The ingest body bound is now64KiB to accommodate bounded
association metadata, still with finite inventories and no arbitrary raw fields.

RuView Hardware and the companion page show node cards, parent labels, a client
attachment table, per-result ages, sweep coverage and recent observed changes.
They use aliases, model and main-node role; they do not upload household names.
The new renderer asset is authenticated and dynamically imported only on the
signed-in companion, leaving the shared login script independent of it.

## Validation and installation evidence

E84 onward in [PR notes](PR-NOTES.md) records focused tests and deployment.
Synthetic tests exercise fixed filters, empty-object/missing/null distinctions, bounded same-session transient retry, diagnostic privacy, identity/parent privacy, unique versus
ambiguous claims, expiry, optional failure without breaking base collection,
timestamp ordering, strict cloud references and UI stale states. They do not
validate the owner's actual filtered response.

The installed native scripts/publisher were backed up privately before update.
Only the owned native process and publisher were restarted. Trust pin, local
key, target and router settings were retained. The timing guard was installed
while the app was still at setup_required, without interrupting an authenticated
session. Each app reload requires the owner to enter the TP-Link password locally; it is neither
saved nor recoverable from the old process. The first owner sign-in restored eight nodes/twelve clients but stopped the optional read. A diagnostic-only update and a further owner sign-in identified a result object without an array-valued client_list; base collection remained connected with eight nodes/ten clients. A second update accepts an explicitly empty object as an empty report and records local-only schema types/counts. That installed update still needs a real full sweep; null, missing and populated objects remain rejected. No raw response or arbitrary server text is exported.

Hardware gate: sign in locally, observe a full eight-node sweep, confirm a
non-overlapping membership partition or explicitly document ambiguity/unsupported
filters, then run:

```sh
python3 tools/deco_cloud/check_deployment.py --config "$HOME/Library/Application Support/RuViewDecoBridge/cloud.private.json" --require-associations
```

Keep raw observation witnesses owner-only outside Git. Compare one selected
client/node against the stock app when available. A controlled device roam and
repeated held-out movement trials are further tests, not completed claims.

## Recovery

Disable associations in private config and restart the native app if a firmware
does not support the filter. Restore reviewed native/publisher copies from the
private update backup if necessary; preserve trust/key fields. This requires a
new explicit local owner sign-in. The cloud UI can roll back independently.
No firmware, network configuration, driver or radio-mode change is required.

### Additional static protocol witness

An unauthenticated same-socket leaf-pinned GET of the declared `js/su/frame.js` returned HTTP200,338987bytes, SHA256 `be5f3c05a9319006dff9e342706b6dc604ff115e937acfb805ea13006e6a8b62`. The stock IPFProxy load path wraps selected data in params and adds operation read. This matches the implemented request. The previously pinned networkMap controller uses each raw inventory MAC as selector value. No downloaded code was executed or authenticated browser session accessed.
