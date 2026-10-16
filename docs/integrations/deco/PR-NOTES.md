# PR notes — stock Deco research and macOS bridge plan

## Change

The project needs a verified way to collect stock Deco telemetry before building
a Mac bridge. This change adds five gated playbooks, source references and a
CC handoff. It proposes a separate mesh telemetry surface with explicit
freshness and capability limits. It adds no runtime code or hardware changes.

Research session: 2026-10-16. Local discovery timestamp witness:
`2026-10-16T18:27:23Z` (13:27:23 America/Bogota), with routing rechecked later
after the owner disabled their VPN. Times identify this session, not a Deco
capture. Baseline commits are pinned in SOURCES and CC-HANDOFF.

## Findings and validation evidence

| ID | Label | Reproducer/source | Observed result and practical limit |
|---|---|---|---|
| E01 | MEASURED | `pwd`, `git status --short --branch`, `git worktree list --porcelain`, `git remote -v` in initial workspace | Empty parent repo, no commits/remotes, no attached worktrees; source checkouts created separately |
| E02 | MEASURED | Bounded directory searches plus Spotlight exact-name search | No existing improvements checkout found in searched locations; owner later confirmed none existed |
| E03 | MEASURED | `git status`, `git rev-parse HEAD`, `git ls-tree -r --name-only HEAD` in each clone | Both initially clean; sparse source checkouts at pinned baselines; no tool/dependency installation |
| E04 | MEASURED | `uname -s`, `sw_vers`, redacted `system_profiler SPHardwareDataType` | Darwin, macOS 26.6.2 build 25G83, Intel MacBookPro16,1, 16 GB RAM; serial/UUID omitted |
| E05 | MEASURED | `networksetup -listallhardwareports`, `ifconfig en0`, `route -n get default`, `netstat -rn -f inet`, `arp -an` | Active Wi-Fi; initial default via VPN. Local LAN differs from historical Deco subnet. ARP cache does not identify Decos |
| E06 | MEASURED | Same route commands after user disabled VPN; `route -n get` historical Deco address | Default now Wi-Fi; Deco candidate still routed via upstream gateway, not directly on-link. Router/AP mode and target identity unresolved |
| E07 | CLAIMED | Owner's prior project context | M5 main, M4R satellite, two E4s reported; exact inventory/firmware not verified |
| E08 | CLAIMED | S1–S3 primary documentation and community source | Stock local polling is a candidate; M4/M5 reports do not validate this M4R/E4 deployment |
| E09 | MEASURED (source inspection) | Server route/registry source at pinned RuView baseline; exact-word search for Deco/TP-Link in inspected server source and integration docs | No Deco provider entry found; existing API routes are documented in playbook 04. This is bounded source review, not an exhaustive entire-repository compatibility claim |
| E10 | MEASURED (source inspection) | improvements catalog, asset manifests, REA policies and package manifest | power-pwn targets Microsoft services; REA is optional artifact analysis. No ready-made Deco collection path established; no exploit ran |
| E11 | MEASURED | `node harness/ruview/bin/cli.js guidance --topic sensing --query 'stock TP-Link Deco M5 M4R telemetry macOS bridge'` | `ok:true`, zero matching capability records. Initial invocation with `--repo .` rejected by schema; reran without that unsupported flag |
| E12 | MEASURED | Guidance for `--topic integrations` | Partial source check because related crates/ADRs are outside sparse selection; not treated as verified. Ruflo tools unavailable; local source-backed fallback used |
| E13 | MEASURED | Tracked workflow inventory | Workflows are under `.github/workflows.disabled` at baseline; no active workflow files found. No CI-green claim is made |
| E14 | MEASURED | One unauthenticated HTTP GET to historical main address, `curl --noproxy '*' --connect-timeout 3 --max-time 5 --max-filesize 65536`, no redirects | Connection timed out after about 3 seconds, exit 28, status 000, zero response bytes. No login or device identity obtained; no conclusion about API support |
| E15 | MEASURED | `dscacheutil -q host -a name` for the two documented Deco management hostnames | Neither returned an address in this session; no hostname-derived target selected |
| E16 | MEASURED | Follow-up requested by owner: `ipconfig getpacket en0`, `route -n get default`, `arp -an`, bounded `dig +time=2 +tries=1` lookups, one unauthenticated HTTP GET to the DHCP-advertised gateway | DHCP and route agree on the current upstream gateway, but no Deco identity is established. One management-name lookup timed out, the other returned NXDOMAIN. Gateway HTTP read timed out (exit 28, zero bytes); no authentication or scan performed. App inventory remains the next source of target identity |
| E17 | MEASURED (app screenshot inspection) | Owner-supplied Photos 2/4 show main Device Info; Photo 3 shows satellite Device Info; Photos 1/5/6/7 show mesh/client views | Main M5: 1.9.5 Build 20260602 Rel. 25369. Satellite M4R: 1.8.2 Build 20251027 Rel. 36869, app reports wireless uplink to main. App also displays rates, clients and signal indicators. This supersedes E07 for these two units; revisions, region and remaining models remain unknown. Screenshots remain private; no local API/hardware capture claim |
| E18 | MEASURED | After screenshots: `ipconfig getifaddr en0`, `route -n get default`, `route -n get` screenshot-confirmed main address, `arp -an` | Mac remains on a different local subnet and routes the main address via its current upstream gateway. No new HTTP attempt or scan. A different Wi-Fi attachment/upstream router is a topology hypothesis; no evidence yet of deliberate management blocking |
| E19 | MEASURED | Owner supplied the Deco SSID. Exact-match check of `networksetup -listpreferredwirelessnetworks en0`; one `networksetup -setairportnetwork en0` attempt with that saved SSID; local route recheck | Saved entry exists, but join attempt reported failure -3900 despite process exit 0. Current address/route stayed on the upstream subnet. No password was retrieved, supplied or changed. Manual Wi-Fi selection is the next step; failure cause is not established. SSID omitted from public notes |
| E20 | MEASURED | After owner manually joined mesh Wi-Fi: `ipconfig getifaddr en0`, `ipconfig getpacket en0`, `route -n get default`, route to confirmed main unit, `arp -an` | Mac is now on the main unit's local subnet; DHCP advertises that unit as router and the on-link neighbor MAC exactly matches the main M5 app screenshot. This resolves the reachability prerequisite from E18/E19; identifiers remain private. Witness `2026-10-16T19:57:47Z` |
| E21 | MEASURED | Unauthenticated same-origin GETs using Python urllib, proxies/automatic redirects disabled, 4-second timeout, bounded response bodies | Root HTTP 200 (272 bytes), observed meta-refresh to `/webpages/index.html`; index HTTP 200 (1688 bytes). Static config, UI framework and four model/controller assets also returned HTTP 200. No downloaded JavaScript was executed |
| E22 | MEASURED (target static-source inspection) | Read `config/models.json`, `config/modules.json`, `js/app/url.js`, and declared local-login/client/router UI model sources | Main firmware UI declares session-based login plus client-list, device-list and CPU/memory routes/fields. Playbook 04 records the candidate contract. This is target-served static source evidence, not authenticated API response validation; no CSI capability is established |
| E23 | MEASURED | One HTTPS root GET with normal certificate validation; one later public-certificate-only TLS inspection with a 4-second socket timeout | Strict HTTPS failed with `CERTIFICATE_VERIFY_FAILED` (unable to get local issuer certificate). Certificate-only inspection subsequently timed out during handshake; no certificate fingerprint obtained. The latter temporarily skipped verification only to inspect the public certificate, sent no HTTP request or credentials, and changed no trust store. Browser inspection remains pending |
| E24 | MEASURED (owner-supplied screenshot) | Two desktop screenshots supplied by owner, named with local 15:02 timestamps | First shows the stock owner-password login page with Chrome's Not Secure indicator. Second shows a signed-in network-map dashboard displaying eight Deco units and twelve clients, plus main M5 information. This is evidence of the owner's UI session, not an agent-authenticated API capture or a verified certificate chain. Network names, room labels, addresses and masked password controls remain private |
| E25 | MEASURED (tool restriction) | Attempt to bind the existing in-app browser tab through the supported browser tool | Tool rejected page observation under its URL security policy, reporting an unsupported protocol. No router UI content was acquired through that tool, no credential/session material extracted, and no alternate browser/terminal route used to work around the denial. Official browser-extension docs confirm existing-session support, but managed browser policies still apply. Router automation is unconfirmed |

### Target static-source fingerprints

SHA-256 of bounded unauthenticated responses; raw HTML/JavaScript remains in
private temporary storage and is not copied into this PR. Reproduce by reading
the named static paths from the locally verified main unit without credentials.
Changing firmware may change these hashes; they are not signed attestations.

| Path under `/webpages/` | SHA-256 |
|---|---|
| `index.html` | `905387ce9ae5eb4a69294d5870ba93984a2e48983d585abd1eda76f1016d71dd` |
| `js/app/url.js` | `4f114efeb90e2ede1e40563ac1d865ca085d959dcdab258b249ca3ec07e5b969` |
| `js/su/frame.js` | `be5f3c05a9319006dff9e342706b6dc604ff115e937acfb805ea13006e6a8b62` |
| `modules/login/localLogin/models.js` | `1c6fc5fe6aecf90b0c794b4ea2d3cfcee923ecd5ebe83b904b648b13b5a2ab12` |
| `modules/login/localLogin/controllers.js` | `c27edcdeb8d008dc7e50ab07652684930cfc3d27fbafa3127c07c799907eb6ed` |
| `modules/networkMap/mapClients/models.js` | `871410325bfed86b6da9601e4faae65e133d5ea8ab74f6cf2cf26641b0d46a75` |
| `modules/networkMap/mapRouter/models.js` | `eadd8cb52a7b70161d0cdd66a4aaf7a3b6ee9a8f015b0eb1565115b1c1f75128` |

Raw network identifiers, owner account data and command transcripts are omitted.
All addresses used in future shared fixtures must be synthetic or redacted.
No authenticated Deco API query, service assessment, exploit, firmware operation
or live RuView build has been performed.

## Validation status

Documentation validation: PASS. A Python 3 standard-library check inspected all
nine documents and ten local Markdown links, verified pinned RuView source
paths against `git ls-tree`, checked documented routes against `main.rs`, and
checked playbook sections, code fences, whitespace and private-identifier/secret
patterns. Initial section omissions were corrected; final run returned zero
errors. This is structural validation plus manual content review, not a
comprehensive secret audit or verification of external site availability.

Final staged diff whitespace check: `git diff --cached --check` (see PR body for
the terminal result). Manual review covered scope, unsupported claims, private
identifiers and separation of proposed vs existing interfaces. Repository
visibility was verified as public; no raw private source or LAN transcript is
included. Only research documents are staged; improvements remains unchanged.

Runtime tests, Rust workspace build and hardware acceptance are not applicable
to this documentation-only change and have not been run. Future parser/provider
code requires the focused checks in playbooks 04/05 plus the relevant repository
gates. Sparse guidance is not a substitute for those checks.

## Open questions and next action

Local reachability and main-unit neighbor identity are established (E20/E21).
The owner has supplied a screenshot of a signed-in dashboard (E24); no credentials
were given to the agent. Static status-read candidates (E22) remain untested as
authenticated responses. Resolve the browser-policy restriction through supported
product controls/support before agent browser automation; do not change tools to
evade it. Owner-provided read-only screenshots can continue the inventory without
that blocked action. TLS trust, operating mode, revisions, region and remaining
models still require verification. A vulnerability assessment and collector
implementation remain future gated work.

## Continuation entry template

Date / operator / commit / target alias and exact firmware / action and scope /
expected vs actual / evidence ID and privacy treatment / checks passed or failed /
remaining uncertainty / next action. Update the PR body when a decision changes.
