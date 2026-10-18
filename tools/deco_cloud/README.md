# Private network telemetry observatory

The companion displays actual Mac CoreWLAN readings, stock Deco records and
optional low-rate ICMP measurements. `/ruview/` now deploys an adapted bridge
mode of the existing RuView UI, reusing its shell, CSS, tabs, sensing renderer
and empty pose renderer. Its input map and live JSON distinguish available
measurements from missing CSI/pose data. It does not run the native Rust sensing
server, generate person tracks or deploy the synthetic 3D Observatory. See
[UI integration](../../docs/integrations/deco/10-ruview-ui-bridge-mode.md).

## Data path

The authenticated native app keeps its existing acquisition schedule and owner
login. `../deco_bridge/research_feed.py` reads its loopback snapshot, reconstructs
an allowlisted export and publishes outbound over verified HTTPS. A Worker
authenticates ingestion; one SQLite Durable Object keeps latest state and a
bounded RF window. Authenticated browser viewers receive an initial snapshot
and subsequent WebSocket updates. There is no inbound router tunnel or remote
bridge-control API.

Publication waits five seconds after each iteration; probe/request duration and
backoff can lengthen that interval. A heartbeat is not a new observation.
CoreWLAN and mesh retain separate source timestamps. Mesh acquisition remains
30 seconds after each completed batch. No stock push/webhook was established.

## Build and checks

Use the pinned development dependencies in this directory:

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run build
npx wrangler deploy --dry-run
npm audit --omit=optional
```

The build also generates ignored UI assets from existing repository components;
install the pinned Three.js dependency even though deployment uses its bundle.
`check` generates ignored binding types and runs TypeScript over the Worker
and contract. A dry run is not deployment. The checked-in Wrangler migration
creates the `HomeFeed` SQLite Durable Object on first deployment.

For isolated local testing, provide ignored `.dev.vars` with `PUBLISHER_HASH`
(SHA256 of a random 32-byte publisher token) and `VIEWERS` (JSON array of
`{hash,role,expires}`; expiry is epoch milliseconds, role owner/viewer). Keep
raw tokens in owner-only configuration outside Git. `npm run dev` binds only
127.0.0.1:8787. The publisher requires explicit `--local-test` for that origin;
production publishing requires the configured RuView workers.dev HTTPS origin.
No insecure fallback or redirect is followed.

## Deployment and credentials

The owner authorized deployment to their connected Cloudflare account. The
reviewed bundled Worker was uploaded with `FEEDS`, `PUBLISHER_HASH` and `VIEWERS`
bindings. The last two are secret bindings containing hashes only. Direct
workers.dev access has the same application authentication; preview URLs are
disabled. No Cloudflare Access policy, billing plan or DNS zone was created.

Access was unavailable in this account, and the owner selected private app
authentication. Invitations are high-entropy bearer capabilities, not verified
email identities. Keep each intended recipient's invitation private. Login
accepts it via same-origin POST and issues a Secure, HttpOnly, SameSite=Strict
host cookie for at most eight hours and never beyond invitation expiry. The
optional `#invite=` fragment is removed before submission; never put credentials
in query strings, PRs or screenshots. The initial deployment has one owner
invitation. There is no invite-management UI or email delivery yet.

To revoke, remove the corresponding hash from `VIEWERS` and redeploy. Existing
subscriptions are checked on broadcasts; deployment propagation and the next
broadcast introduce delay. Publisher rotation requires updating both its
private token and `PUBLISHER_HASH`. Viewers cannot publish. Only an owner can
annotate experimental conditions; annotations are not detections.

Production acceptance, using the existing private configuration:

```sh
python3 check_deployment.py --config "$HOME/Library/Application Support/RuViewDecoBridge/cloud.private.json"
```

This checks anonymous denial, same-origin rules, cookie attributes, separated
publisher/viewer authority, export privacy and advancing real WebSocket frames.
It also checks authentication for `/ruview/`, its assets and
`/api/ruview/snapshot`, preserving unknown CSI/pose outputs. It does not log in
to Deco, create motion labels or prove motion accuracy.

## Mac publisher operation

`../deco_bridge/install_publisher.py install` installs only the current user's
`com.ruview.deco.publisher` LaunchAgent. It requires existing private
`config.json` and `cloud.private.json` in the app's Application Support folder,
refuses overwrites and uses the existing app Python runtime when available.
The private cloud configuration contains `origin`, `publisher_token` and, for
optional ICMP, an owner-verified canonical `gateway_mac`. The deployment checker
also uses the private `owner_invitation`; no router password is saved.

`start` bootstraps the reviewed registration; `stop` unloads it. To remove,
stop it, then remove only its plist, installed `cloud_publisher.py` and publisher
logs after checking ownership. Do not remove the native bridge config/runtime.
Revoke publisher/viewer hashes separately to retire cloud access. Stopping the
publisher does not stop the native app or delete the Worker.

The Mac must be awake, on the home network and running the native app. launchd
restarts the publisher, not the Deco login session. Missing local service causes
bounded publication retries; it never recovers or retries an owner password.
Status logs contain aggregate counters, with stdout capped around 1 MiB.

## Privacy, retention and limits

The optional device-to-node feature adds node-filtered observations and bounded
attachment changes to RuView Hardware and the companion. See
[association source, cadence and validation](../../docs/integrations/deco/11-device-node-associations.md).
Ingest is capped at64KiB. Unknown/conflicting/stale memberships stay explicit;
this feature does not establish human motion or RF measurements at each Deco.

No raw MACs, IPs, SSIDs, names, pins, local keys or arbitrary upstream fields
are exported. Session aliases and timing still describe private household
activity. The cloud stores latest state and at most 180 RF samples within a
15-minute display window; expiry alarms prune inactive data. This is a bounded
application window, not a forensic deletion guarantee about platform backups.
Worker observability/logpush are disabled. WebSocket subscribers are capped.

Tests validate protocol boundaries and measured delivery. Actual Safari/cellular,
long-run sleep/wake, full-app resource acceptance, and held-out motion detection
remain open. The full Rust sensing/CSI/pose backend is not deployed here.

## Owner-authored room map

The private RuView Floor Plan tab displays a schematic configuration from
GET /api/floorplan. Owner-only same-origin saves use expected_version and strict
validation; stale revisions return409. Undo retains one previous plan. Layout
configuration persists separately from telemetry TTL and is never RF-inferred.
The native collector exports only an opaque room key matched using local private
room_bindings. Private labels/notes are intentionally stored as authenticated
owner configuration; photos/raw router names do not pass through telemetry.
Keep seed JSON, source images and name bindings outside Git. See
[playbook12](../../docs/integrations/deco/12-private-room-map.md).

## RF Field and movement trial

The RF Field tab opens by default in `/ruview/`. It renders known owner-placed
router anchors as an adjustable isotropic coverage model in schematic units,
with floor overlap tiles, orbit/zoom, per-floor filtering and explicit
uncalibrated assumptions. Real node-quality changes and reported attachment
transitions have separate source-timestamped highlights. Mac RSSI stays a
single unlocated link; it does not set every sphere's radius. No synthetic
people, paths, CSI or measured spatial field are emitted.

Owner-only still/walking buttons use the existing label API and compare distinct
retained RSSI samples after the trial start. The UI shows sample count/span,
median, MAD, variance and a received-power ratio only when both windows have
enough observations. Labels describe actual owner actions; movement detection,
size and localization remain unvalidated. See
[playbook13](../../docs/integrations/deco/13-rf-field-and-movement-calibration.md).
