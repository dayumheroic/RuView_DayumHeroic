# Private network telemetry observatory

This is a companion to RuView, not the original RuView tracking UI or Rust
sensing server. It displays actual Mac CoreWLAN readings, stock Deco records
and optional low-rate ICMP measurements. It does not generate sensing frames,
person tracks, positions or skeletons. The existing RuView Sensing, Live Demo
and Observatory interfaces still need an explicit adapter/deployment decision;
see [the experiment playbook](../../docs/integrations/deco/09-live-link-experiments.md).

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
It does not log in to Deco, create motion labels or prove motion accuracy.

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

No raw MACs, IPs, SSIDs, names, pins, local keys or arbitrary upstream fields
are exported. Session aliases and timing still describe private household
activity. The cloud stores latest state and at most 180 RF samples within a
15-minute display window; expiry alarms prune inactive data. This is a bounded
application window, not a forensic deletion guarantee about platform backups.
Worker observability/logpush are disabled. WebSocket subscribers are capped.

Tests validate protocol boundaries and measured delivery. Actual Safari/cellular,
long-run sleep/wake, full-app resource acceptance, and held-out motion detection
remain open. The full Rust sensing/CSI/pose backend is not deployed here.
