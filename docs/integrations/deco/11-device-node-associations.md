# Device-to-Deco attachment observations

Continuation2026-10-17. Protected node-filtered collection and cloud acceptance
now pass on the owner's mesh. All eight Decos responded; the acceptance snapshot
uniquely attributed ten current client records. Continuing snapshots retain
unknown/conflicting claims and recorded one observed attachment change. This
supersedes the initial schema-failure/pending-sign-in state in E84–E89.

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
Those source semantics support this implementation. E90–E92 record actual filtered
responses, cloud acceptance and UI rendering on the owner's firmware.

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

A classified transient optional failure has one delayed retry, on the same
node/session in the next normal cycle. Other failures, or another transient
failure, stop further association reads for that collection session while base
telemetry continues. Reconnect/new local session
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
  node, and only for non-master records, matching the stock tree builder. It does
  not supply measured coordinates, link direction or room geometry.

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

E84–E92 in [PR notes](PR-NOTES.md) record installation, failures, tests,
deployment and protected acceptance. Synthetic tests cover filters, empty-object
versus missing/null distinctions, bounded same-session retry, diagnostic privacy,
ambiguity, expiry and timestamp ordering. Hardware results below are separate.

The installed scripts and publisher were privately backed up and byte-checked.
Owned-process reloads required local owner password entry because the session is
memory-only. Trust pin, local key, target and router settings were preserved.
The first array-only parser stopped optional reads while base collection worked.
A diagnostic update identified a schema mismatch. The final parser accepts only
an explicitly empty object as an empty report; null, missing and populated
objects remain rejected. Live type/count witnesses now confirm that empty nodes
return an object with zero entries and populated nodes return client arrays.
These bounded witnesses stay local; no raw response/server text is exported.

A full eight-node sweep produced group sizes0/6/0/0/0/3/2/0. The same-time global
list contained ten current clients, all uniquely attributed; one filtered group
also retained a client absent from that later global list. Group results have
different timestamps, so their sum is not a simultaneous whole-network count.
Continuing snapshots varied: twelve current clients, eleven uniquely attributed,
one unknown, no ambiguity in one later witness. A transient two-node claim was
shown as ambiguous rather than selecting a node. No absence/departure inference.

Production acceptance passed with eight observed nodes, ten attributed clients,
secure authentication/isolation checks, advancing WebSocket782→783, live scalar
RSSI−51dBm/noise−89dBm and all person/CSI/pose/vital capabilities false:

```sh
python3 tools/deco_cloud/check_deployment.py --config "$HOME/Library/Application Support/RuViewDecoBridge/cloud.private.json" --require-associations
```

The authenticated Hardware view renders all eight node cards, parent labels,
attachments, unknown/conflict states and one observed attachment change from an
E4R to the main M5 between two source observations. That is a natural API
observation, not a controlled roam or proof that a device/person physically
moved. Seven parent edges were acyclic and all chains reached the main node.
Reported model labels were2M5/2M4R/4E4R; physical revisions remain unverified.
Private normalized JSONL and browser screenshot witnesses are mode0600 outside
Git. Preserve the working session; no further collector restart is needed.

Remaining acceptance: match a chosen attachment to the stock app, run a
controlled device roam with ground-truth times, and assess detection latency and
false changes over held-out trials. Exact room/person location remains unknown.

## Recovery

Disable associations in private config and restart the native app if a firmware
does not support the filter. Restore reviewed native/publisher copies from the
private update backup if necessary; preserve trust/key fields. This requires a
new explicit local owner sign-in. The cloud UI can roll back independently.
No firmware, network configuration, driver or radio-mode change is required.

### Additional static protocol witness

An unauthenticated same-socket leaf-pinned GET of the declared `js/su/frame.js` returned HTTP200,338987bytes, SHA256 `be5f3c05a9319006dff9e342706b6dc604ff115e937acfb805ea13006e6a8b62`. The stock IPFProxy load path wraps selected data in params and adds operation read. This matches the implemented request. The previously pinned networkMap controller uses each raw inventory MAC as selector value. No downloaded code was executed or authenticated browser session accessed.
