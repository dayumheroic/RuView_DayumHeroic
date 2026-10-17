# PR notes — stock Deco research and macOS collectors



## Latest continuation: protected attachment feed verified

2026-10-17. The owner's local sign-in enabled a full real sweep and cloud
acceptance. This supersedes E84–E89's pending state; no additional collector or
publisher restart occurred. [Playbook11](11-device-node-associations.md) records
the reproducer, source semantics and remaining physical-validation gates.

| ID | Label | Reproducer/source | Actual result / limit |
|---|---|---|---|
| E90 | MEASURED protected mesh | Existing authenticated loopback snapshot observed during the new owner session; bounded normalized JSONL witness, mode0600 outside Git | Coverage4→6→8nodes; five empty-object client lists and three arrays of6/3/2 entries at first full sweep. Ten then-current global clients all uniquely attributed, zero ambiguity. Groups span different times and can contain a client absent from the later global list; group totals are not a simultaneous client count. Confirms the empty-object parser case and distinct memberships; no owner session extracted |
| E91 | MEASURED cloud acceptance | check_deployment.py --require-associations, existing private config | PASS: eight observed nodes, ten attributed clients, WebSocket782→783/update envelope,19distinct RF samples, RSSI−51/noise−89dBm,4probes; anonymous/cross-origin denial, secure cookie and publisher/viewer isolation pass. Original UI/mapped API/attachment asset protected. CSI/human_presence/pose/vitals remain false |
| E92 | MEASURED continuing source/UI | Actual authenticated Hardware tab, full-page screenshot outside Git, final normalized witness | All8node cards and aliases/ages render. A later snapshot has12clients,11attributed,1unknown,0ambiguous; an intervening two-node claim rendered ambiguous. One observed E4R→main M5 attachment change appears in local history and UI; no controlled physical movement or exact handoff time established. Seven parent edges are acyclic and all chains reach main. API reports2M5/2M4R/4E4R, not verified physical revisions. Working collection preserved |

No production code changed during this acceptance turn. Existing97focused tests
and reviewed deployment remain the software gate; no synthetic data was sent to
the live service. No router write, flashing, radio-mode switch, new recipient or
credential persistence was introduced. Next: a stock-app membership cross-check
and controlled, labelled device-roam trial. Keep those distinct from human RF
motion, localization and pose claims.


## Earlier continuation: attachment build before protected acceptance

2026-10-17. [Playbook11](11-device-node-associations.md) describes the native
node-filtered reads, strict cloud projection and shared attachment UI. The code
is deployed, but the protected attachment gate has not yet passed. Earlier
combined-list acceptance is not proof of per-node attribution.

| ID | Label | Reproducer/source | Actual result / limit |
|---|---|---|---|
| E84 | MEASURED static source | Previously pinned mapClients/networkMap/router controllers; additional pinned frame.js GET, SHA256 in playbook11 | Selector uses raw inventory MAC; IPFProxy wraps selected data in params and operation read. Non-master parent edges use previous; master previous must be ignored. No downloaded code executed |
| E85 | SYNTHETIC tests / MEASURED checks | Python unittest discovery; cloud npm test; explicit existing mesh/ws-ticket/websocket-service Node tests |60 Python,14 cloud Node and23 existing client Node tests pass. Empty-object lists, null/missing rejection, bounded same-session transient retry, diagnostic privacy, membership ambiguity/expiry and timestamp ordering covered. One shell glob and one explicit websocket test extension were wrong; corrected commands passed. Fixtures are not hardware evidence |
| E86 | MEASURED installation and protected failure | Private backups, source-byte comparison, owned native restart, owner-local sign-ins and normalized loopback snapshots | First filtered attempt stopped with generic failure while base8nodes/12clients remained connected. Diagnostic update identified filtered_schema: result object, client_list not array, with base8nodes/10clients. Topology corrected from8 to7parent edges by ignoring master previous. Subsequent empty-object/parser-witness update installed; acceptance pending. TP-Link password stays in memory; no session extraction |
| E87 | MEASURED deployment / partial acceptance | Reviewed Worker upload; check_deployment.py; actual hosted Hardware tab | Deployment5e11df51f0f84d87ab00274f70727548, etag30126ba0aec7663f285925531483d0b848cb4e78591168535840274f5c2ffd7a. Private attachment asset and both views deployed. Earlier production RF/auth/WebSocket check passed116→117 while native setup_required, so it does not establish mesh/attachment acceptance |
| E88 | SYNTHETIC local integration | Isolated literal127.0.0.1 Worker/SQLite DO | Private asset anonymous401/authenticated200, synthetic two-node/one-client ingest and parent/association round-trip pass. Local fixture never published to production |
| E89 | MEASURED hosted UI / source comparison | Authenticated actual Hardware tab; screenshot outside Git; installed-source byte comparison | New attachment view renders unavailable0/0 while native setup_required, with no fabricated device assignments. Native collector/service and private publisher match reviewed source. Local synthetic dev server stopped; native app/publisher remain running. Code3542180 pushed to draft PR34, acceptance still pending |

Source fields are rebuilt through allowlists. The cloud receives aliases,
observation times/counts and bounded attachment records/events; local diagnostics
and schema types/counts are dropped by the publisher. Read body cap64KiB; two
extra serial status reads per cycle, no faster base interval or concurrent owner
session access. No router writes, flashing, monitor mode or remote control route.


## Latest continuation: existing RuView UI and measured scalar picture

2026-10-17. The owner requested actual RuView UI deployment and inspection of
its sensing inputs. [Playbook10](10-ruview-ui-bridge-mode.md) records the adapted
UI, source mapping, experimental calculation, reproducer and limits. This
supersedes the original-UI deployment gap in the previous continuation.

| ID | Label | Reproducer/source | Actual result / limit |
|---|---|---|---|
| E77 | MEASURED source review and integration | SensingUpdate/NodeInfo/FeatureInfo/ClassificationInfo in sensing-server main.rs; existing UI shell/CSS/TabManager/SensingTab/GaussianSplatRenderer/PoseRenderer | Adapted original UI at authenticated /ruview/. Mean RSSI is supported; CSI variance/bands, subcarrier arrays, receiver positions, spatial field, person/pose/vital outputs are explicitly unavailable. New mapped schema is separate from Rust sensing_update. Stock backend bootstrap/training/pose-fusion/synthetic Observatory are not deployed |
| E78 | SYNTHETIC mapping tests | test_sensing.mjs | Five cases cover units/cadence, controlled scalar step, noisy baseline, stale/synthetic denial, duplicates/gaps/current-sample mismatch. Initial bimodal fixture exposed zero-MAD spread; percentile guard added and case passes. Derived link_change never asserts human presence. Effective sample rate differs from median cadence; irregular samples have null Nyquist |
| E79 | MEASURED isolated local integration | Reviewed local Worker/DO via literal127.0.0.1; actual existing bridge snapshot, then an explicitly local unavailable-frame collection reset | New UI/assets/mapped API deny anonymous access; authenticated routes200. Real RSSI projects correctly; pose and CSI variance stay null. Publisher collection change clears prior history/labels. Test data never published to production; native app untouched |
| E80 | MEASURED deployment and live acceptance | Cloudflare reviewed bundle upload; check_deployment.py using private config | Final deployment b438328f980d41cf9ccf3e868ebff27d, etag69079906820bbd80822bdc0ce3af2f10f7751c780d7f9ea50b4d50430d9aa429, migrationv1. Initial revision14caf2d37b524f7ca05600e2b374c4a1 produced one WebSocket403 after invitation refresh; later unchanged-code check passed sequence838→839 and a separate101 upgrade. Recovery is consistent with documented mixed-version deployment propagation, not a proven cause. Final revision acceptance passes sequence1003→1004, update envelope,19distinct RF samples,8nodes/12clients,4probes, RSSI−50dBm/noise−89dBm; mapped sensing live/stable_link with all person/CSI/pose/vital capabilities false. No auth bypass or retry loop |
| E81 | MEASURED UI rendering | Actual private hosted page; Dashboard→Hardware→Live Demo→Sensing; desktop,768×1024 and390×844 viewport checks | Live real RF/noise/time traces,8nodes/12clients, raw node levels, input matrix and nullable mapped JSON render. Empty pose renderer correctly has no invented body. Responsive panels stack; viewport restored and page left open. Private screenshots outside Git. No actual iPad/Safari/cellular or motion accuracy claim |
| E82 | MEASURED bounded faster scalar trial | Existing packaged mac-radio --samples 45 --interval 1; owner-only JSONL witness |45/45 available over44.61seconds, median timestamp interval1second, RSSI−48..−47dBm, standard deviation0.442dB. No movement labels/ground truth. Proves helper output cadence, not independent RF refresh, CSI or human tracking. Installed5second RF acquisition and protected router polling unchanged |
| E83 | MEASURED verification and recovery | Focused Python/cloud/UI client tests; type/build/dry-run/audit; private installed bridge snapshots |49 Python,10 cloud Node and23 existing mesh/WebSocket Node tests pass. Build/type generation, dry run and audit pass (zero reported vulnerabilities). Mac app was closed overnight; reopened RF and owner-local login restored8nodes/12clients. Publisher resumed. Same owner invitation refreshed for8hours without a new recipient/role. No password saved, router writes, firmware changes, radio-mode change or privileged capture. Native Rust/CI and held-out movement acceptance remain open |

Current code includes a shared scalar mapper, private original-UI asset bundle,
same-origin live client, input matrix and experimental change indicator. Privacy
and invitation boundaries remain as in the previous cloud slice. Three.js is
bundled at pinned r128 compatibility; hosted font requests removed and MIT
notices provided. Current UI allows inline CSS for existing component styles;
scripts remain same-origin only. Private configuration/raw captures stay outside
Git, and the companion / remains available independently.

## Latest continuation: deployed private companion and live experiments

The owner authorized cloud deployment and chose private application
authentication while Access remains unavailable. Code under `tools/deco_cloud`
and the outbound publisher now implement a real stream from the existing native
bridge. The cloud page is a companion telemetry dashboard. The original RuView
Sensing/Live Demo/Observatory UI and Rust sensing backend are not deployed or
connected by this slice. Reusing them with an explicit supported telemetry mode
is the next integration gate; no mesh-to-pose frames are fabricated.

| ID | Label | Reproducer/source | Actual result / limit |
|---|---|---|---|
| E70 | MEASURED source review / unit vectors | Apple CoreWLAN primary docs; pinned community API models; `test_research_feed.py`, `test_contract.mjs` | RSSI/noise already dBm; exact power conversion and SNR estimate implemented. Raw node quality remains ordinal with no validated inverse; client RSSI absent in observed bridge records. Literal string search of two previously downloaded firmware images found no new clear signal-field names, but compressed content was not decoded; this is not an absence proof |
| E71 | MEASURED live experiment | `research_feed.py --icmp`, cached ARP targets on current subnet, owner-verified gateway identity | Four targets at most; two ICMP requests each per batch, at least30seconds between completed batches. Three targets replied in observed batches; one timed out. Separate probe timestamps/aliases, no range sweep. RTT/loss are network timing, not radar, distance, occupancy or RF phase. No extra protected router reads |
| E72 | MEASURED interface discovery | Bounded eight-second mDNS service-type discovery; private witness outside Git | Advertised AirPlay/RAOP, companion-link, HomeKit, Matter, meshcop, SMB, Spotify and supporting service types. Advertising does not prove reachable measurement APIs or sensing capability. No authentication, capture, device control or client app installation |
| E73 | SYNTHETIC boundary tests / MEASURED build | Python unittest discovery; Node contract and mesh-client tests; npm check/build/audit; Wrangler dry run and isolated local DO |49 Python +5 cloud Node +10 existing mesh Node tests pass. Type/binding generation, bundle, dry run and audit pass, zero reported vulnerabilities. Local DO/auth round-trip passed with clearly isolated fixtures. Initial mesh-test command used a nonexistent test path; corrected to tools/deco_bridge/test_mesh_client.mjs and passed. No Rust/CI validation claimed |
| E74 | MEASURED cloud acceptance | `check_deployment.py` using owner-only config; deployed Worker/DO revision `984223f3334a4cab898a4dab10dfb358` | Anonymous API401/root303, cross-origin denial, Secure/HttpOnly/SameSite cookie, publisher/viewer isolation and advancing real WebSocket messages pass. Latest check sequence58→59, delta update envelope,8 nodes/11 clients, RSSI−49dBm/noise−91dBm,4 probes. Complex CSI/presence/pose/vitals all false. Deployment API etag d0f9e3b67af8b974e9edb0813ab53f01af07d1cc4aa51262d40ff18a19406884. Account IDs/emails/URL/credentials remain private |
| E75 | MEASURED macOS installation | Owner-scoped LaunchAgent plus aggregate publisher log and installed-source comparison | Publisher runs with existing private app Python runtime, continues publishing; native authenticated bridge remains running unchanged. Checkout-venv launch initially stalled without startup output; private-runtime selection resolved it, cause not established. HTTPS initially lacked Python's default CA bundle; system CA bundle now verifies chain and hostname, no TLS bypass. Brief publisher-only RSS observation about21MiB is not full-app resource acceptance |
| E76 | MEASURED browser rendering / source review | Actual authenticated cloud UI in in-app browser, desktop and768×1024/390×844 viewports; existing ui source | Live RF/chart,8nodes/11clients and probe data render; smaller viewports stack panels, browser size restored. Private screenshots stay outside Git. This is not actual Safari/cellular testing. RuView already supplies Sensing, Live Demo and Observatory; Observatory constructs DemoDataGenerator and live paths require sensing schema. Existing original UI integration remains open. No controlled Still/Walking trials or held-out motion evaluation ran |

Implementation/reproduction and credential lifecycle:
[cloud README](../../../tools/deco_cloud/README.md),
[live experiment playbook](09-live-link-experiments.md).
No router configuration, firmware, radio mode or privileged capture changed.
The working Mac app must remain awake/home/running for its protected data.

## Earlier continuation: hardware success and remote-feed design

Subsequent owner request explores existing clients and handshake metadata.
See [playbook08](08-device-metadata-and-feedback.md) and E63–E67 below. No
running-app restart, radio-mode change or new protected form was requested.

E68–E69 continue within the owner's current-Mac/iPad constraint; the second
Mac is Wi-Fi only. Defer dedicated receiver trials and preserve remote access.

| ID | Label | Reproducer/source | Actual result / limit |
|---|---|---|---|
| E61 | MEASURED | Owner's 21:29:52 local screenshot, then authenticated local `GET /v1/snapshot` on the running installed app; source observation `2026-10-17T02:51:10.932121+00:00` | Owner screenshot shows 8 nodes/11 clients. Later HTTP200 API snapshot is `connected`, mesh `live_unverified`, 8 nodes/12 clients, about27 seconds old. Normalized witness saved mode0600 outside Git; no raw protected payload, password or browser session extracted. Confirms protected mesh collection; raw-rate units, complete semantics, long-run reliability and CSI/human motion remain unverified. Different-time client counts are not evidence of a movement event |
| E62 | MEASURED source review / CLAIMED proposed design | Read `State.mesh_loop`, `State.radio_loop`, `ui/mesh.mjs`, `mesh-client.mjs` and current Cloudflare primary documentation linked in playbook07 | Existing acquisition waits30seconds after mesh batches and5seconds after radio reads; UI fetches every2.5seconds. Proposed outbound publisher → Worker/DO → WebSocket dashboard, protected by Access invite allowlist. No stock webhook, cloud deployment or new stream endpoint verified/implemented. Cloud account, hostname, initial owner email and acceptance tests remain pending. No running app restart, polling increase, cloud resource creation or router changes |
| E63 | MEASURED | Running loopback API plus bounded90.4second local observation every2seconds; normalized source fields only saved mode0600 outside Git | HTTP200/connected; eight node signal objects, both bands numeric; twelve clients with zero signal objects. Twenty distinct local snapshots, three mesh observation times. Band2_4 values0/1/2/3; band5 values0/1/2. RF RSSI -49..-48dBm. Scale/link semantics unknown; no labelled motion trial. No extra router reads or login. Source timestamp gaps must not be treated as an exact30second cadence |
| E64 | MEASURED source review | Pinned improvements checkout/tree, REA packet-captures/pcap-analysis/web-network-captures docs and Aliens_eye README | REA saved-capture analysis is a plausible match to remembered metadata tooling; does not acquire traffic. Documented macOS provider limits. No dedicated CSI receiver identified in bounded inventory/targeted review; no exhaustive content-search claim. No vendored tool installed/executed; improvements unchanged |
| E65 | MEASURED | tcpdump version; PATH tool lookup; libpcap inactive pcap_create/en0 → pcap_can_set_rfmon → pcap_close | tcpdump4.99.1/libpcap1.10.1. tshark/capinfos/dumpcap absent from PATH. Capability query returned -8 permission-denied. No activation, mode/channel setter, privileged retry or capture; compatibility remains unknown |
| E66 | MEASURED source review / CLAIMED hardware feasibility | Existing tools/bfi source, README, OPTIMIZATION and proposed ADR365; original Wi-BFI/BeamSense papers linked in playbook08 | Existing offline decoder/independent-comparison/quality tools can support a future trial. Prior repository experiments used different AP/receiver hardware and are not this Deco mesh's evidence. Repeated feedback is distinct from login handshake and full CSI. Sustained readable feedback, capture format and motion accuracy remain unverified here |
| E67 | MEASURED static source | Two unauthenticated same-socket leaf-pinned GETs of declared mapRouter/mapClients models;6second socket timeout,512KiB cap | Both HTTP200. Router model1816bytes SHA256 eadd8cb52a7b70161d0cdd66a4aaf7a3b6ee9a8f015b0eb1565115b1c1f75128; client model896bytes SHA256 871410325bfed86b6da9601e4faae65e133d5ea8ab74f6cf2cf26641b0d46a75. No new signal-scale semantics found. Private static artifacts retained; downloaded JS not executed, no credentials used |
| E68 | CLAIMED owner hardware / explicit research constraint | Owner reply: second Mac Wi-Fi only; keep research on current Mac and iPad | Availability question resolved. Defer dedicated monitor-mode receiver trial; retain current associated-link/bridge connection. No purchase, wired setup, second-host operation or privilege retry inferred |
| E69 | MEASURED static-source review | Seven bounded unauthenticated pinned static GETs; module registry/router model capped128KiB, remaining declared controllers/view capped256KiB;6second socket timeout; artifact hashes in playbook08 | All HTTP200. Client controller uses selected device_mac filter and connection_type labels. Router list2Tree uses previous for parents. No dBm mapping or continuous RF stream found in inspected code. Generic model/band support is not measured capability of this mesh. No code executed, credential use, protected form call, polling change or app restart |

See [continuous feed and private cloud](07-continuous-feed-and-private-cloud.md).
Earlier pending-capture statements below are historical and superseded by E61;
earlier unit/sensing/reliability limits still apply.

## Change

The project needs a verified way to collect stock Deco telemetry before building
a Mac bridge. This change adds six gated playbooks, source references, a CC
handoff, a bounded Python research collector and a native Swift current-link RF
reader. It proposes a separate mesh telemetry surface with explicit freshness
and capability limits. No router configuration or firmware changes were made.

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
| E26 | MEASURED (permission change and live UI) | Owner explicitly reported adding the router origin to allowed sites and supplied a settings screenshot; then supported Chrome-tab inventory and read-only page binding | Chrome access succeeded after this supported permission-state change. Signed-in Network Map displayed eight units, twelve clients and a node hierarchy. No browser security warning was dismissed by the agent and no settings were changed by the agent |
| E27 | MEASURED (live UI) | Network Map → Clients, then open the per-node selector and select main | Client grid displayed Type, Information, Real-time Rate and Connection columns. Paired rates were labelled KB/s, with non-zero samples. Connection displayed Wireless(5G) or a dash. Selector lists eight nodes and updates its selected label; refreshed row membership was not verified. Names/addresses/room labels omitted |
| E28 | MEASURED (live UI) | Advanced → Status | Internet reports Online / Dynamic IP. Main WAN is on the former upstream subnet with the old gateway; main LAN is on the Deco subnet. This explains the prior attachment/routing issue. Radio enable/channel fields and guest/IoT enable flags are visible. No dedicated operating-mode value or NAT behavior was tested |
| E29 | MEASURED (live UI inventory) | Advanced → System → Firmware Upgrade; read the loaded table only; return to Network Map | Two M5(3.2) on 1.9.5 Build 20260602 Rel. 25369; two M4R(2.0) on 1.8.2 Build 20251027 Rel. 36869; four E4R(4.0) on 1.1.2 Build 20250226 Rel. 35508. All eight rows observed. Initial table was empty before asynchronous loading; the loaded table was subsequently read. No Check for Upgrades, Browse, Upgrade, reboot or configuration control was activated |

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
The agent has now observed signed-in UI values through normal status-page
navigation. No standalone/custom authenticated API request, session extraction,
service assessment, exploit, firmware operation or live RuView build has been
performed. The owner's browser session supplied authentication without sharing
credentials with the agent.

## Further research and implementation evidence

Continuation on 2026-10-16 local (native sample witness at
2026-10-17T00:11:49Z–00:11:51Z). Commands use private target/pin aliases;
actual addresses, certificate and source/log captures remain outside Git.

| ID | Label | Reproducer/source | Observed result and practical limit |
|---|---|---|---|
| E30 | MEASURED | Public leaf-certificate retrieval, 8 s timeout; DER SHA256 and public certificate fields | Retrieval succeeded, superseding earlier timeout. Self-signed local Deco hostname; RSA2048. Pin recorded privately. Initial pin needs comparison with owner's trusted browser; not public-CA verification |
| E31 | MEASURED | Main TCP 22/23, one connect/port, timeout 2 s | Both refused from client LAN; no login/shell attempt. Does not rule out internal/backhaul access |
| E32 | MEASURED source inspection | Pinned SDK and HA sources, playbook 03 | Protocol agrees across implementations. SDK Python 3.14 minimum, mutators, trust-all TLS and session-URL logging make whole-package reuse unsuitable. Neither upstream package executed |
| E33 | CLAIMED with source review | Vendor/JVN advisories, CCS2024 paper, signature-bypass research; dispositions in playbook 06 | No exact applicable exploit confirmed. M5v1, historical M4 JP range and newer XE models do not establish owner exposure. Firmware-upload methods excluded |
| E34 | MEASURED | Seven stock-log-identified satellite addresses × TCP 22/23/80/443; concurrency 2, timeout 2 s, 28 connections | Seven TCP 80 open; three TCP 443 open/four timeout;22/23 refuse or time out. No auth, payload or UDP sweep. Private per-address results retained; per-address model mapping unverified |
| E35 | MEASURED UI and source | Advanced→System→System Log; sanitized visible-text checks; public sysLog model/controller | Association/disassociation, DHCP and internal root SSH events visible; no CSI mention in inspected page. Source revealed automatic feedback_log build on launch/filter. No explicit Save/Clear/export or setting action; callbacks excluded from collector |
| E36 | MEASURED offline artifact | Official E4(US)v4 1.1.2 Build20250226 Rel.35508 ZIP; zip/hash/magic/string inspection | Image: 3,150,228 bytes, clear MT7628/MT7663 strings. No ELF/SquashFS/UBI header found by bounded scan; filesystem not extracted. Region match unverified. Hashes in SOURCES; no binary execution or image modification |
| E37 | SYNTHETIC tests + MEASURED probe | `python -m unittest discover -s tools/deco_bridge -v`; `probe --host <main> --pin <private pin>` | 16 tests pass: full synthetic firmware login/read, crypto, endpoint denial, pin rejection, response limits, private output and unknown fields. Live probe reports 512-/1024-bit API RSA without credential attempt. Protected telemetry unvalidated |
| E38 | MEASURED | `swiftc tools/deco_bridge/mac_radio.swift`; native 3-sample run, CLI boundary/schema checks | Swift 6.3.3 Intel build passes. Current-link RSSI/noise/channel/rate returned at 1 s polling. Seven invalid-argument cases exit 2 without stdout; two more live samples pass schema/no-identifier checks. No scan/monitor switch/location prompt; no independent radio cadence claim |
| E39 | MEASURED source inspection / CLAIMED external capability | RuView BFI and mac_wifi/scanner sources; OpenWrt definitions; CSI-Bench §3.3 | BFI capture untested on Deco and not full CSI. Existing Mac scanner has different schema. M5 chip family has vendor-enabled CSI precedent, not verified retail export |
| E40 | MEASURED | Isolated binary-wheel installation; `pip check`; synthetic replay; private launcher `zsh -n` | cryptography 48.0.1/cffi 2.1.1/pycparser 3.11 install/check pass; 16 tests pass in venv. Replay marked synthetic. Indexed 50.0.2 could not be installed from configured registry; available 48.0.1 tested, no latest claim. Launcher syntax passes; protected execution pending |
| E41 | MEASURED offline artifact | Official M5v3.20 support page,1.9.5 Build20260602 Rel.25369 multi-model package; zip/hash/magic inspection | Image: 17,107,872 bytes; package names SP4/RSA2048. No fwup-ptn/UBI/SquashFS/ELF marker found; packaged filesystem remains opaque, not audited. Build matches UI; owner region remains unknown. No binary executed, decrypted, modified or installed |
| E42 | MEASURED | `/usr/bin/time -l mac-radio --samples 5 --interval 1`; pinned handshake followed by local public-key-only encryption of a synthetic string | Five available native samples, 4.04 s elapsed, 0.01 s user/0.00 s system, 4,833,280-byte peak process RSS. Short run excludes service/daemon accounting and 15-minute steady-state acceptance. Legacy 512-bit public-key encryption succeeds (64-byte ciphertext), no protected request or credential attempt |
| E43 | MEASURED structural/privacy review | Full staged-file scan, Markdown local-link/fence check, `git diff --cached --check`, manual review |16 staged text files,11 Markdown documents,18 local links; zero broken links/fences, private-marker matches, runtime artifacts or whitespace errors. Venv/cache ignored. This is a bounded marker check plus manual review, not a comprehensive secret scanner |

## Browser telemetry and performance continuation

| ID | Label | Reproducer/source | Observed result and practical limit |
|---|---|---|---|
| E44 | MEASURED browser observation | Existing signed-in Chrome→Clients; DOM-backed extraction of rate pairs/connection labels at2026-10-17T01:13:19.282Z | Ten rows, three nonzero, five Wireless(5G)/five unknown. Identifier-free private JSON mode0600 saved outside Git. Normal browser session supports further research without standalone credential entry; not a protected API fixture or unattended collector |
| E45 | MEASURED short baseline | `ping -c 20 -i 1 <verified main>` from current Mac Wi-Fi |20/20 replies,0% loss; min/avg/max/stddev4.258/34.655/210.050/47.912ms. Uncontrolled ICMP variation, not a throughput test or causal diagnosis |
| E46 | CLAIMED vendor specs / proposed experiments | Official M5/M4/E4v4 specifications, node-count/backhaul/connection-preference/QoS guidance; PERFORMANCE-HANDOFF | Separate report requested for another Codex session. Eight nodes vs general six-node wireless guidance and E4 Fast Ethernet are test priorities, not proven causes. No tuning, node removal, mode change, purchase or cross-session message performed |

Current validation: E37/E38/E40/E42/E43 are terminal passes. Full staged review
covers whitespace, document links, unsupported claims and private identifiers.
No private captures, binaries, venv or session state belong in this PR.
Rust workspace/archive pipeline are unchanged and were not built; cargo is not
installed. No active CI exists at the baseline. Authenticated mesh acceptance,
resource budgets, sleep/wake and the complete application remain unfinished.
The standalone collector still needs one owner-authenticated capture, followed
by sanitized field review and UI comparison. E44 demonstrates that normal signed-in
browser observation can continue independently; inspect its outputs directly. No browser session
extraction, applicable exploit or stock CSI stream is established.

## Working bridge preview — 2026-10-16 local / 2026-10-17 UTC

Continuation base: `81daab334db3f86a6094749461dc542111db4cd4`.
Implementation commit is the PR head containing this entry; the PR continuation
comment records its exact hash. Target remains the main M5 hardware 3.2,
firmware 1.9.5 Build20260602 Rel.25369, and the current Intel macOS 26.6.2 host.
The earlier “full application/consumer unfinished” statement above is superseded
for the preview slice only; release and protected-mesh acceptance remain open.

| ID | Label | Reproducer/source | Expected / actual / limit |
|---|---|---|---|
| E47 | MEASURED | Repeat pinned CLI `probe`; existing Chrome Clients DOM at2026-10-17T01:41:48.980Z | Handshake again returns512/1024-bit API RSA with no credential attempt. Browser again has10 rate-bearing rows with displayed KB/s. No identities exported; this remains browser evidence, not authenticated API payload validation |
| E48 | SYNTHETIC + local HTTP tests | `tools/deco_bridge/.venv/bin/python -m unittest discover -s tools/deco_bridge -v`; `node --test tools/deco_bridge/test_mesh_client.mjs` |31 Python and6 Node tests pass. Added real loopback HTTP auth/Host/Origin/CORS, fixed assets/route rejection, bounded JSON, pin-confirmation gate, one auth attempt, fixed batch reads, pause, missing/empty, stale/error/clock/sleep transitions, schema/key privacy and client failure tests. Firmware responses remain synthetic. No real sleep experiment |
| E49 | MEASURED installed service | `install_macos.py --host <main> --pin <private pin> --ruview-origin <explicit loopback UI>`; open native app; header-authenticated local `GET /v1/snapshot` | Swift app/helper compile; isolated pinned runtime installs; `pip check` passes. Installed assets byte-match source. HTTP200, CoreWLAN RSSI−48dBm/noise−89dBm/channel44, link rate866Mbps initially and780Mbps in a later sample. Mesh `disconnected`, phase `setup_required`, clients null, sign-in false. No protected hardware acceptance or throughput claim |
| E50 | MEASURED RuView page | Serve actual `ui/mesh.html` on explicit loopback origin, connect through the page to a separate test service using a fixture bridge key and real CoreWLAN helper | Page displays live-unverified radio and unknown Deco counts. Cross-origin request succeeds under exact CORS; key input clears, setup hides. Stop test service: UI clears live values, shows disconnected and restores bridge setup. No console error/warn entries in inspected browser log. Screenshot saved privately outside Git. This is the real page, not a mock-data dashboard; native-window visual acceptance and Rust-hosted asset serving remain untested |
| E51 | MEASURED lifetime and startup | Native launch, parent PID watch; terminate the native lifetime owner and check service port for up to3seconds | Service port closes within3seconds; restart succeeds. No login attempt was active. Initial test exposed HTTPServer reverse-DNS startup delay; overridden with literal-loopback TCP binding, focused tests then finish in2.826seconds. No OS resolver setting changed |

Implemented: `tools/deco_bridge/bridge_service.py`, `MacApp.swift`,
`install_macos.py`, focused tests and `APP.md`; `ui/mesh.html`, CSS, ES modules
and the navigation link. The private app/config/runtime are outside Git.
Host/Origin and per-install bearer auth protect the API; data are separated by
capability and freshness. RF starts without credentials; Deco has a local
password form plus explicit pin-comparison gate. The service makes only the
four pre-existing allowlisted reads after login, with no auth retry, arbitrary
endpoint, cloud export, firmware or configuration path. Pause cancels subsequent
reads; an in-flight operation can finish. No raw captures are retained by the
service, and no browser credential/session extraction was used.

Remaining gates: first explicit owner-authenticated standalone read, schema and
unit comparison, exact-firmware sanitized fixture, native-window visual test,
real sleep/wake, long-run full-app resources including WebKit processes,
fresh-profile removal/upgrade, arm64, signing/notarization and optional Keychain.
One short process snapshot showed about49MiB native-host RSS and17MiB Python RSS;
it excludes WebKit subprocesses and is not a steady-state budget pass.
Core Rust sensing and archive pipelines are unchanged/not built; cargo and active
CI remain unavailable. No raw stock CSI, exploit applicability or human-sensing
capability is established. `improvements` stays unchanged.

Validation and secret/link review for this continuation are recorded in the
PR comment with the final commit. RF hardware/API/UI checks do not close the
separate protected Deco gate. Next action is the app's local owner sign-in,
then inspect results directly and adapt only to witnessed schema fields.

## Recovery defect — 2026-10-16 local / 2026-10-17 UTC

Continuation base `3292664884ba6a83c2b585cfcf86df7098269522`. The owner
reported a failed performance read and no restart/reconnect control. Exact
target remains main M5 hardware3.2 / 1.9.5 Build20260602 Rel.25369.

| ID | Label | Reproducer/source | Expected / actual / limit |
|---|---|---|---|
| E52 | MEASURED owner screenshot + local API | Existing installed app, authenticated loopback snapshot | `failed`, `failure_stage=read_performance`, sign-in attempted, no normalized node/client snapshot. Code reaches this stage only after login and device/client request returns pass. Normalization had not run; protected schema/units and the performance failure's underlying cause remain unknown. Failure summary saved owner-only outside Git; no password/session material inspected |
| E53 | SYNTHETIC / local regression checks | Python unittest discovery and Node mesh-client tests |36 Python +7 Node tests pass. Required device/client reads succeed even when the unused forms would throw. Explicit reset makes no router/auth calls, preserves RF, requires cooldown, rejects active reads/healthy collection, and allows a subsequent owner-initiated attempt. HTTP reset still requires bridge auth. Live CLI four-form research flow unchanged |
| E54 | SYNTHETIC failure UI + MEASURED UI action | Separate loopback test service injected old performance-failure state, real current-link RF, and a fake session factory that cannot contact the router | Reconnect Deco visibly enabled; clicking it restores the password form while RF remains available. No owner credential entered and no router request. Screenshot private. Installed app service/assets updated and app reopened at sign-in; new protected-hardware retry still pending |

The app now polls only the two forms used by its normalized contract. No
secondary performance/mode call can gate that snapshot. Recovery is explicit:
failed/paused → worker finished +30seconds since sign-in → local reset → setup.
No automatic auth retry or saved password. This supersedes earlier app-level
“restart after one attempt per run” instructions; CLI behavior is unchanged.
The user does not need to find a hidden app restart action to recover.

### Resume after desktop restart

| ID | Label | Reproducer/source | Expected / actual / limit |
|---|---|---|---|
| E55 | MEASURED | Installed app snapshot after desktop restart; separate two-form pinned unauthenticated probe | App had a newer authentication-stage failure, with Reconnect enabled and RF available. Repeat probe passes with512/1024-bit API keys and no credential attempt. The older build retained no failure reason, so neither wrong password nor a transport/protocol cause is established |
| E56 | SYNTHETIC diagnostics regression | Focused Python/Node checks |38 Python +7 Node tests pass. Exact collector-owned errors map to fixed reason categories; unknown exception text is never exposed, and reset clears diagnostics. No owner login is retried automatically. These checks do not validate the next real protected response |

The resumed update adds safe reason categories to make another authentication
failure diagnosable. Existing stage-only evidence cannot be reconstructed into
a detailed error. No credentials/session memory were inspected or recovered.

### Intermittent read continuation

| ID | Label | Reproducer/source | Expected / actual / limit |
|---|---|---|---|
| E57 | CLAIMED success / MEASURED later failure | Owner's report and subsequent screenshot; authenticated local snapshot | Owner reports a brief device list with data, without a saved successful screenshot. Later snapshot shows read_devices + transport_or_decode, after login returned successfully. No complete schema/count fixture is available from that earlier success, and the old combined category does not distinguish timeout/TLS/HTTP/JSON |
| E58 | SYNTHETIC transport/recovery tests | Focused Python unittest and Node mesh-client tests |45 Python +10 Node tests pass. New transport categories distinguish timeout/JSON without upstream text; timeout input is bounded1..30. Each transient read gets at most one delayed retry in the same session with one login total. Explicit router rejection never retries; pause cancels retry. Prior successful records stay Stale and missing lists remain unknown. Hardware recovery under this policy is still pending |
| E59 | MEASURED pinned source inspection | Previously reviewed HA source: const.py, api.py | Its timeout default is30seconds and timeout retry default1. App timeout changed from6 to30seconds; CLI retains6. This is a design reference, not proof that6seconds caused the owner's failures. No third-party package was executed |

No extra owner login or network sweep is performed by the new retry mechanism.
Only the same fixed idempotent status read is retried after30seconds; after a
second failure collection stops. Updated UI displays retained records as last
observed/Stale rather than erasing them or presenting them as fresh. Reset and
app exit still discard the in-memory session; credentials are not persisted.

| ID | Label | Reproducer/source | Expected / actual / limit |
|---|---|---|---|
| E60 | SYNTHETIC mesh UI + MEASURED local deployment | Clearly labelled isolated fixture, actual UI assets and real current-link RF; installed-service byte comparison | Stale badge, last-observed counts/table and capture time render correctly. Pause removes the fixture records and enables Reconnect; no router requests or owner credentials. Private screenshots saved. Installed service/assets match reviewed source and return HTTP200 with RF available; final state setup_required. A bounded2-minute local API observation window captured no new successful mesh snapshot, so new-policy hardware acceptance remains pending |

## Initial documentation-phase validation (historical)

Performance continuation validation: four staged documents, twelve Markdown
documents inspected, nineteen local links; no broken links/fences, private-marker
matches or whitespace errors. Runtime code was unchanged, so its passing checks
were not repeated for this report-only continuation. Browser returned to Network Map.

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

Signed-in stock UI validation ran as E26–E29. Runtime tests, Rust workspace
build and bridge hardware acceptance are not applicable to this documentation-only
change and have not been run. Future parser/provider
code requires the focused checks in playbooks 04/05 plus the relevant repository
gates. Sparse guidance is not a substitute for those checks.

## Original UI-phase open questions (superseded by E30–E40)

Local reachability, main identity, stock UI status/client fields and all eight
model/revision/firmware tuples are established (E20–E29). The owner resolved the
browser origin permission through supported controls, allowing read-only Chrome
inspection. Standalone response capture, rate scale, per-node filter membership,
complete link types, region, dedicated operating mode and collector TLS trust
remain open. The next collection gate is a bounded, permission-cleared response
fixture and reviewed local auth/transport design; browser cookies/keys are not
to be extracted. Vulnerability assessment and implementation remain future work.

## Continuation entry template

Date / operator / commit / target alias and exact firmware / action and scope /
expected vs actual / evidence ID and privacy treatment / checks passed or failed /
remaining uncertainty / next action. Update the PR body when a decision changes.
