# 02 — Authorized network assessment

## Desired state and effect

A reproducible exposure register distinguishes reachable services, relevant
vulnerabilities and useful stock telemetry interfaces. Finding an open port
does not establish a vulnerability or a CSI export path.

## Prerequisites and scope

The owner authorizes assessment of their own mesh. Start with playbook 01.
Create an explicit list of verified Deco IPs, model/revision/firmware tuples,
network interfaces, allowed techniques and a maintenance window before active
tests. Do not treat a discovered subnet, upstream ISP router, VPN endpoint,
neighbor network, client device or TP-Link cloud account as an implicit target.

| Target alias | Address verified privately | Ownership/identity evidence | Technique/window | State |
|---|---|---|---|---|
| main-01 | Pending | App/label pending | Status-page read first | Not ready for service assessment |
| satellite set | Pending | App/labels pending | Inventory first | Not ready |

## Actions

1. Record local routes, app inventory and already visible services without
   running imported tooling. Preserve discovery separately from assessment.
2. Once target identities are recorded, perform a bounded TCP connect check
   on the known management ports only (initial budget: one host at a time,
   at most two concurrent connections, 3-second connect timeout). Add ports
   only with a documented reason. Avoid subnet sweeps, UDP broadcast probes
   and automatic script packs in the first pass.
3. For each response record address alias, port, transport, HTTP/TLS behavior,
   redirect destination, auth requirement and time. Read bounded headers or a
   login page; do not follow redirects into an unverified host/cloud service.
4. Match the exact model, region, revision and firmware to current TP-Link
   security advisories and the original advisory/research publication. Use
   primary sources. Record affected and fixed versions plus uncertainty; a
   generic banner or similarly named model is insufficient.
5. Prefer read-only, non-destructive checks that distinguish vulnerable from
   unaffected behavior. Read any proposed proof of concept, dependencies,
   network destinations and cleanup behavior before execution. Record the
   exact commit/hash and expected result. Tool presence grants no authority.
6. A test requiring execution on a router, privilege changes, credential
   extraction, interception or disruption needs a separate, concrete plan with
   exact target, side effects, stop conditions and recovery. Neither this
   playbook nor a CC handoff automatically authorizes those actions. Do not
   use a vulnerability as the production telemetry dependency.

## Finding record

| Field | Required content |
|---|---|
| ID and state | Candidate / confirmed / not affected / inconclusive |
| Target tuple | Alias, model, HW/region, full firmware, mode |
| Exposure | Service, port, authentication and reachable interface |
| Source | Vendor/original advisory URL, retrieval date, affected range |
| Reproducer | Bounded command/request, pinned tool, prerequisites |
| Observation | Expected vs actual; sanitized evidence ID and time |
| Impact | What was demonstrated; avoid extrapolating access |
| Disposition | Mitigation recommendation, retest and integration relevance |

No vulnerability is confirmed in this session. No exploit tooling has run.
Do not publish sensitive exposure details in a public PR; use the repository's
private security reporting path for actionable vulnerability details.

## Completion and recovery

Complete when every scoped service has an evidence-backed disposition and
relevant advisories are matched or explicitly marked unresolved. Stop on
disconnects, lockouts or degraded service. Record the last operation and ask
the owner to verify network health; no automatic reboot/reset/firmware change.
Retest after an owner-approved remediation as a separate activity.
