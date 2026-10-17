# Continuous feed and private Cloudflare access

Status: **CLAIMED / proposed design**, 2026-10-16. No cloud deployment or new
stream endpoint is implemented by this document. The working collector remains
unchanged. E61 records real hardware success; E62 records this source review and
design in [PR notes](PR-NOTES.md).

## Desired state and effect

The owner and explicitly invited users can open the RuView mesh dashboard on
a phone/iPad away from home, receive new observations, and see collection gaps.
Keep Deco authentication local. Remote viewers receive observations without
router operations or local sign-in access.

Human-movement tracking remains a separate, unresolved objective. No stock Deco
complex-CSI export or validated human-motion detector has been established.
Changing delivery protocols cannot supply a missing measurement source.

## Current acquisition versus delivery

| Layer | Current source behavior | Limit |
|---|---|---|
| Deco | Serial device/client reads; wait 30 seconds after a successful batch | Read time and transient retry add delay; no verified stock push/webhook subscription |
| Mac radio | CoreWLAN helper; wait 5 seconds after each invocation | Scalar measurements from one associated link, not CSI |
| Local dashboard | Fetch snapshot every 2.5 seconds | Faster refresh does not create new observations |
| Mesh normalization | Session aliases, online field, raw traffic rates | Current export lacks verified per-client node-association transitions; rate units remain unverified |

The existing API already serves repeating observations while signed in. Propose
WebSocket subscriptions for live dashboards, retaining a latest-snapshot API
for reconnect. SSE is a possible one-way alternative. Bridge-generated webhooks
could serve later notifications; no router webhook has been verified. Do not
tighten router polling just to animate the UI after intermittent read failures.

## Recommended deployment

```text
Stock Deco -- pinned local reads --> Mac collector <-- CoreWLAN
                                         |
                               allowlisted export
                                         |
                               outbound HTTPS publisher
                                         v
                       Cloudflare Worker + Durable Object
                           | latest state + WebSocket fanout
                           v
                       RuView mesh web dashboard
                           ^
                           | Cloudflare Access login
                       Owner / invited phone or iPad
```

Workers Static Assets can host a reviewed frontend build; a Worker and Durable
Object can handle ingestion and subscribers. This is a proposed mesh-dashboard
hosting boundary. The existing Rust sensing server is not a drop-in Worker;
future sensing computation needs an appropriate home/container host and its
own validated output contract. Never wrap mesh counters as CSI/sensing frames.

The Mac must remain home, awake, running and connected. Closing the current app
stops its service. An always-on collector/login-item lifecycle is separate work.
Cloud hosting does not give the collector access to the home LAN when the Mac
leaves. When collection stops, the cloud dashboard must show stale/offline data.

Cloudflare Tunnel plus Access is an alternative for a home-hosted app using
outbound connections without inbound port forwarding. That does not move the
app computation into Cloudflare. **Do not tunnel the current bridge port or
router UI directly:** the bridge includes auth/control routes and a bootstrap
key. A tunnel solution needs a separate read-only gateway and reviewed auth.

## Contract to implement

- Rebuild a strict export allowlist. Never upload `/v1/snapshot` wholesale:
  it includes target/pin metadata. Exclude router password, session material,
  bridge key, certificate pin, LAN addresses, MACs and arbitrary upstream fields.
  Session aliases still describe private household activity.
- Keep the local bridge key on the Mac. Issue a separate scoped, revocable
  publisher credential for bounded ingest only. Viewers never receive it.
  No cloud-to-router command channel; remote views are read-only.
- Protect frontend and all viewer API/WebSocket routes with Cloudflare Access,
  initially allowing only the owner's chosen email, then individual invitees.
  One-time PIN or an approved identity provider supplies login. Verify JWT
  signature, issuer, audience and expiry at the backend, not an email header.
  Disable or equivalently protect direct/preview hostnames and asset bypasses.
- Authenticate publisher routes separately; validate schema, body size, finite
  numeric ranges, scope and rate. No credentials in URLs or logs.
- Envelope: version, home-feed ID, random collection ID, sequence, publication
  time, original observation time, source, source state, capabilities and
  allowlisted measurement. Keep RF and mesh observation times separate.
- Publish on new source timestamps and lifecycle changes. Heartbeats are
  separate; they must never refresh measurement timestamps. Repeated API
  snapshots are not new measurements. Preserve sequence gaps and session
  boundaries; aliases do not identify a device across collector restarts.
- Use bounded latest-state queues, reconnect backoff and full resynchronization.
  Slow clients cannot stall collection or cause unbounded buffering. Initially
  retain latest state plus a bounded display window, with no indefinite history.
  Review any durable retention/deletion period before enabling it.
- Compute freshness from observation age and publisher last-contact time.
  Replay/reconnect must not turn old readings live. Expire/revalidate long-lived
  subscriptions and disconnect revoked viewers; handshake protection alone does
  not provide immediate revocation of an already open connection.
- Add a same-origin cloud read/subscription client. The current `MeshClient`
  deliberately supports loopback only. Preserve local Host/Origin checks;
  never embed a local bridge key in hosted JavaScript. Keep local owner sign-in.

## Build gates and validation

1. Confirm owner Cloudflare account, hostname and initial owner email. Inspect
   existing resources read-only. No Cloudflare account connector or installed
   `cloudflared`/`wrangler` executable was available in this terminal check.
   Hostname/email were requested; do not infer them from unrelated browser tabs.
2. Implement/test allowlisted export, source timestamps, sequence/collection
   IDs, bounded reconnect and subscriptions using labelled synthetic fixtures.
   Preserve the currently working authenticated Mac session.
3. Prepare Worker/DO/frontend and Access policy in the chosen account. Review
   current pricing/limits before deployment; no implicit plan purchase/upgrade.
4. Test anonymous and uninvited denial, wrong audience, expired tokens,
   publisher/viewer role isolation, oversized/malformed input, direct/preview
   hosts and revoked invites. Confirm no local controls/secrets are exposed.
5. Test real collection on the phone over cellular, observation timestamps,
   gaps, reconnect, pause/exit, home Internet loss, Mac sleep/wake and slow
   clients. Measure acquisition-to-display delay before claiming performance.
6. Record exact deployment revision, aggregate evidence and limits in PR notes.
   Keep account IDs, emails, credentials and raw household data private.

Human-motion acceptance requires a suitable verified source, labelled ground
truth and held-out detection evaluation. Compatible additional sensing hardware
may be needed; this is unresolved under the stock/no-flash constraint. A later
verified node association can indicate a device's attachment with roaming lag;
it cannot prove a person's room or movement.

## Recovery

Disable publisher and revoke its ingest credential to stop export. Remove cloud
routes/Access application when retiring deployment; delete observations per the
reviewed retention policy. Roll back a failed cloud revision independently of
the local bridge. Never alter router firmware/settings for cloud recovery.

## Primary sources reviewed

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
  — frontend files alongside Worker logic.
- [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
  — connection coordination and hibernation; no cost claim made.
- [Access application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)
  and [JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
  — identity boundary and backend checks.
- [One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
  — login for approved email addresses.
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
  — outbound connection model for the home-hosted alternative.

These platform capabilities are documented, not measured in an app deployment.
No Cloudflare resource, DNS or access policy was changed.
