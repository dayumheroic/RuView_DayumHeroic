# 06 — Raw telemetry avenues and falsifiable gates

## Desired state and effect

Find the richest reproducible data path available on the owner's unchanged
mesh, then expose its actual capability through a lightweight Mac collector.
This is an avenue register, not a claim that every undocumented interface has
been exhausted. No stock complex-CSI export has been verified.

## Prerequisites and evidence

Use the exact eight-node inventory in playbook 01. The current phase permits
bounded discovery, source review and owner-authenticated status reads. Keep
addresses, certificates, logs, captures and names private. A firmware package
is an offline research input, never an instruction to install it. Record each
test in [PR notes](PR-NOTES.md), including negative results and side effects.

## Actions and avenue register

| Avenue | Current evidence and achievable data | Next gate / disposition |
|---|---|---|
| Main-node local web API | **MEASURED:** E61 protected normalized snapshot contains eight nodes/twelve client records. Public `auth`/`keys` forms answer with 512-/1024-bit API RSA keys | Device/client bridge path works; raw-rate units, full semantics and long-run reliability remain open. No raw protected payload fixture saved by service. API RSA keys are distinct from HTTPS and mesh SSH keys |
| Per-node web interfaces | **MEASURED:** seven log-identified satellite addresses accept TCP 80; three accept443, four time out on443. No TLS login attempted to satellites | Authenticate centrally first. Do not send the owner password over satellite HTTP. Map addresses to exact models through verified device_list before model-specific claims |
| Extended radio/client fields | **MEASURED E63:** all eight normalized node records contain two numeric signal bands, observed values0..3; twelve clients have no signal objects. **CLAIMED:** additional signal/traffic forms appear in community sources | Existing node scale/link direction unknown. Optional forms not newly requested. Verify source/UI semantics before calling fields RSSI or client measurements. See playbook08 |
| Stock logs | **MEASURED:** UI contains association/disassociation, DHCP and internal root SSH authentication events | Useful event stream candidate, no CSI in the inspected visible page. Review preparation side effects before automation; excluded from collector |
| App/internal telemetry | **CLAIMED:** BE65-derived catalogue documents `/admin/telemetry_collect` category reads and encoded diagnostic blobs | Promising, unverified on M5/M4R/E4R. Obtain matching callback/source evidence and decode contract before sending requests. Do not enable telemetry-control writes or start diagnostic daemons |
| SSH/telnet / mesh management | **MEASURED:** main refuses TCP 22/23; satellite22/23 refuse or time out. Logs show mesh nodes authenticating to Dropbear internally | Internal access can differ from client-LAN access. No password/key guessing, backhaul impersonation or injection run. Root access alone would not prove the driver exports CSI |
| Model-specific vulnerabilities | Reviewed vendor/JVN advisories and original mesh-security paper; see disposition below | No applicable live exploit confirmed. Match model, revision, region, firmware and exposed handler before attempting a minimally invasive witness |
| Offline stock firmware / GPL | **MEASURED:** official E4v4 and M5v3.20 packages with matching displayed builds downloaded/hashed. E4 clear strings name MT7628/MT7663; M5 SP4/RSA2048 package remains opaque. OpenWrt maps M5v3 to IPQ4019 and M4Rv1/v2 to QCA9563/QCA9888 | Owner region unverified; no filesystem extracted, binary executed, image patched or hardware changed. Need matching source/package unpacking before inferring driver hooks |
| Vendor CSI / driver hooks | **CLAIMED:** CSI-Bench includes IPQ4019/IPQ4018, but explicitly used vendor-enabled firmware/drivers and proprietary capture utilities | Chip family capability is plausible; stock Deco export is unproven. Identify an already enabled handler/utility in matching stock image. No driver/module load or firmware change in this phase |
| Passive beamforming feedback (BFI) | RuView already contains bounded VHT/HE offline decoders and Linux capture tooling. BFI is quantized steering feedback, not full CSI | Potential no-router-flash route. Need a verified own-AP capture, supported format, independent decoder comparison and sustained coverage. No monitor-mode switch or capture on the Mac's sole Wi-Fi interface was attempted |
| Mac current-link RF metadata | **MEASURED:** native CoreWLAN helper emits RSSI, noise, channel and transmit rate on this Mac at one-second polling intervals | Working coarse RF route; separate `ruview.local_link.v0` contract. No AP scans or identifiers, no mesh-wide spatial coverage or CSI claim |
| Cloud API / app transport | Community source describes cloud forwarding of management requests | No evidence cloud adds CSI missing locally. Deprioritized: avoid account/session extraction, cloud dependency and sharing household telemetry |
| SNMP / UPnP / mDNS / BLE | No verified stock SNMP/NETCONF/CSI service found in reviewed model-specific sources. Generic TP-Link switch support is not Deco evidence | Not ruled out by this search. Inspect actual advertised services and matched firmware first; no community/password sweep, setup-mode change or BLE pairing attempted |
| Additional CSI receiver / physical access | Separate compatible receiver could observe traffic without changing mesh firmware; UART/test pads may expose diagnostics | Outside present software-only delivery. No purchase, board opening, serial writes or receiver firmware flashing performed |

## Vulnerability disposition

| Primary evidence | Applicability to measured inventory | Disposition |
|---|---|---|
| [TP-Link CVE-2026-5040](https://www.tp-link.com/hk/support/faq/5190/) | Vendor lists M5v1 and privileged/system compromise as a prerequisite; measured main is 3.2 | Not established as an entry point or applicable revision |
| [JVNVU99392903 / CVE-2023-40193](https://jvn.jp/en/vu/JVNVU99392903/) | Authenticated command injection lists M4(JP)v2 firmware before 1.5.8 Build20230619; measured M4R is 1.8.2, region unknown | Historical candidate; no affected-version match. Version ordering alone does not certify all regional builds safe |
| [CCS2024 original paper](https://www.cs.ucr.edu/~krish/ccs24.pdf), §7.3 and disclosure table | Describes weak mesh SSH trust anchors and tmpsvr injection in tested older products; reports TP-Link patched | Research lead, not proof of current vulnerability. Observed internal SSH events do not establish weak/shared keys or injection |
| [TP-Link CVE-2026-15469](https://www.tp-link.com/uk/support/faq/5263/) | Newer shared mesh-key advisory lists XE75v3, XE5300v3.6 and WE10800v3.6 | Those models are absent. Do not transfer this finding to M5/M4R/E4R |
| [Deco signature-bypass research](https://github.com/naf419/tplink_deco_exploits) | Some historical M4R revisions named; described paths target firmware/recovery uploads | Excluded by no-flashing constraint, regardless of possible revision overlap. Repository scripts were not run |

The web login's measured 512-bit public key must not be confused with either
the TLS certificate's 2048-bit key or the paper's mesh trust anchor. No CVE is
assigned from key length alone. The collector compensates for its self-signed
HTTPS deployment using an explicit leaf pin, not unauthenticated HTTP fallback.

## Source-backed CSI distinction

[CSI-Bench §3.3](https://proceedings.neurips.cc/paper_files/paper/2025/file/f7c68372b3d39e8d7a093eb2edaaad87-Paper-Datasets_and_Benchmarks_Track.pdf)
reports chipset-vendor collaboration and proprietary capture utilities with
CSI-enabled drivers/firmware. Its IPQ4019 results support investigating the M5
chip family, not claiming the retail M5 already exports those matrices.

[Atheros CSI Tool setup](https://github.com/xieyaxiongfly/Atheros_CSI_tool_OpenWRT_src/wiki/Getting-started-with-Atheros-CSI-tool)
requires its modified driver/kernel and names specific chips. An Atheros/Qualcomm
label alone is insufficient. [ath10k-ct developer discussion](https://github.com/greearb/ath10k-ct/issues/122)
also records limited reporting and uncertain decoding; it is not a stock-Deco
installation recipe. [Nexmon CSI](https://github.com/seemoo-lab/nexmon_csi)
targets specific Broadcom/Cypress hardware and firmware patches, not a generic
stock Mac or Qualcomm Deco interface.

## Stock-log side effect discovered

The M5's public `sysLog/models.js` maps preparation to
`/admin/log_export?form=feedback_log`, operation `build`; its controller submits
that model automatically on page launch/filter changes, then reads paged
`logList` entries. Opening the stock log UI therefore can prepare a diagnostic
snapshot even without clicking Save. This source-derived side effect was found
after viewing the page. No clear/export button, email action, logging setting,
debug daemon, reboot or firmware action was invoked. Keep these callbacks out
of the strict collector allowlist until preparation is separately characterized.

## OpenWrt feasibility continuation — 2026-10-20

Owner asked whether the newly added OpenWrt asset can replace stock firmware,
run as companion software, or use the vendor's wireless update path. This is
feasibility research only; the existing no-flashing boundary remains in effect
for hardware actions. No image was built/uploaded and no router was changed.

The improvements remote commit `a2cd776` adds `networking/openwrt` and its sibling
documentation export. Its ASSET record pins upstream source
`0d245fdaeae5c890c8aa997fadcf9287a707558f`. Read-only tree/source inspection
confirmed device targets and154exported text pages, with no per-device hardware
wiki pages. Only remote refs/objects were fetched; its checkout was not reset,
fast-forwarded or executed. The asset's canonical/mirror equality is recorded
provenance, not a comparison independently repeated in this continuation.

| Existing inventory | Source-backed feasibility | Remaining gate |
|---|---|---|
| M5, UI suffix3.2 | [Upstream support commit](https://github.com/openwrt/openwrt/commit/c60be6e983d95c971dc5659afb882eaeac9d01ca) explicitly discusses V320 hardware and supplies v1/v2/v3 targets. The current [device page](https://openwrt.org/toh/tp-link/deco_m5) lists snapshot support. Initial installation is documented through wired LAN/TFTP recovery | Physical label/region/flash variant, current image and known flash-chip limitations, exact-firmware recovery and rollback remain unvalidated |
| M4R, UI suffix2.0 | [Hardware entry](https://openwrt.org/toh/hwdata/tp-link/tp-link_m4r_v1) lists v1/v2 together with a shared image and release support. The [original support commit](https://github.com/openwrt/openwrt/commit/063e9047cc8b247ea4b04ee3248b99f3212a42f8) describes signature restrictions and a signed-debug-firmware installation route | Historical instructions do not establish that the currently installed firmware/bootloader accepts that route. Do not substitute v4 or nearby minor revisions |
| E4R, UI suffix4.0 | No matching verified target was established by the inspected source/device search | Do not infer compatibility from M4R naming, chipset family or a firmware filename |

OpenWrt is an embedded operating system and normally replaces the router's
vendor firmware. Installing it in a Mac VM or on a separate appliance does not
expose the stock Deco's private radio drivers. A custom RuView telemetry agent
could run on a compatible OpenWrt router after installation. Running an agent
inside stock firmware would instead need an independently verified legitimate
execution/package interface; the OpenWrt source is not an add-on package for
the existing Deco application.

OTA describes firmware delivery, not image compatibility or installation
authority. A stock updater may validate signatures, supported models and image
layout. Vendor-signed updates over Wi-Fi do not establish an arbitrary-image
installation path. Recovery can require Ethernet before Wi-Fi is running.
For a future initial conversion, plan a direct wired connection; Cat6 is not
specifically required. Later OpenWrt upgrades and initial stock conversion are
different operations. No recovery service or debug firmware was started here.

The inspected hostapd README documents `get_clients` with signal and per-client
rate/capability fields. This is a plausible richer input than stock ordinal
backhaul quality, subject to actual driver/firmware validation. It reports an
AP's associated clients, not every device at every AP simultaneously. CSI
export still requires a compatible instrumented driver/firmware path and real
complex-sample evidence. OpenWrt support alone does not pass the CSI, movement,
localization, range-improvement or body-size gates. A converted node should be
treated as requiring separate AP/mesh configuration; continued proprietary
Deco-app membership is not assumed. Preserve the main hub for any later isolated
secondary-node evaluation.

Some official wiki opens returned bot interstitials/internal errors. Support
claims were cross-checked against indexed hardware entries, upstream commits
and the pinned source, rather than treating those failed opens as content.
No downloaded instructions or programs were executed. See E108–E111 in PR notes.

## Completion and recovery

For a useful management bridge: one authenticated exact-firmware capture, field
comparison with the stock app, partial/error handling and a separate RuView mesh
consumer. For raw CSI: require actual complex subcarrier/antenna samples, timing,
scaling, loss accounting and a parser witness. An encoded blob, a working shell,
radio bars or a model paper alone cannot pass that gate.

Recover by stopping the local collector. No router rollback is needed for its
read allowlist. Keep public notes sanitized and private captures outside Git.
Do not characterize untested avenues as disproven or this register as exhaustive.
