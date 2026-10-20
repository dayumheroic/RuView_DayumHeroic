# Sources and evidence boundaries

Reviewed 2026-10-16. Links to pinned project files identify the inspected
baseline. External documentation can change; pin an adapter commit before reuse.
Do not equate a documentation claim with a test on the owner's network.

| ID | Primary source | What it supports / limit |
|---|---|---|
| S1 | [TP-Link stock web login](https://www.tp-link.com/us/support/faq/2641/) | Owner-account login and local network prerequisite; current address can differ from default. Does not guarantee every firmware has an API |
| S2 | [Community integration README](https://github.com/amosyuen/ha-tplink-deco/blob/main/README.md) and [API source](https://github.com/amosyuen/ha-tplink-deco/blob/main/custom_components/tplink_deco/api.py) | Local polling precedent, reported M4/M5 testing, session/status reads and separate reboot path. Source review only; exact owner firmware untested |
| S3 | [Adapter license](https://github.com/amosyuen/ha-tplink-deco/blob/main/LICENSE) | MIT at reviewed page; preserve notices if code is reused |
| S4 | [TP-Link M5 regional downloads](https://www.tp-link.com/ca/support/download/deco-m5/) | Hardware/revision and region matter; this page is not evidence of the owner's firmware or region |
| S5 | [RuView source contract](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/AGENTS.md) and [Claude instructions](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/CLAUDE.md) | Least authority, claim labels, real hardware evidence, relevant checks |
| S6 | [Server routes](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/v2/crates/wifi-densepose-sensing-server/src/main.rs) and [provider registry](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/v2/crates/wifi-densepose-sensing-server/src/vendor_rf.rs) | Existing outputs/vendor ingest; no Deco registration at inspected commit |
| S7 | [Accepted ADR-270](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/docs/adr/ADR-270-vendor-rf-sensing-integration-program.md) and [ADR-295](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/docs/adr/ADR-295-source-provenance-state-machine.md) | Capability gates and source-state policy; this change is not a new accepted ADR |
| S8 | [improvements catalog](https://github.com/dayumheroic/improvements/blob/d0e906c9538221f76a84cfaace6744b542674b2a/CATALOG.md) and [README](https://github.com/dayumheroic/improvements/blob/d0e906c9538221f76a84cfaace6744b542674b2a/README.md) | Asset scope, reference collection and license convention; private source, no copied tool code here |
| S9 | [REA asset](https://github.com/dayumheroic/improvements/blob/d0e906c9538221f76a84cfaace6744b542674b2a/reverse-engineering/rea/ASSET.md) and [power-pwn asset](https://github.com/dayumheroic/improvements/blob/d0e906c9538221f76a84cfaace6744b542674b2a/security/power-pwn/ASSET.md) | Exact vendored pins; no tool execution or comprehensive audit |

## Continuation sources

| ID | Primary source | What it supports / limit |
|---|---|---|
| S10 | [Standalone protocol SDK, pinned](https://github.com/roquerodrigo/tplink-deco-api/tree/dabd77fbc9bd4d5209a78beb7752b4308b2e647a) | Auth/AES/RSA reference and BE65-derived callback catalogue. Not tested as a package on owner hardware; internal telemetry forms remain candidates |
| S11 | [HA API, pinned](https://github.com/amosyuen/ha-tplink-deco/blob/cfb2a2ac864e43671c3b1c17f6866f5c737d2acc/custom_components/tplink_deco/api.py) | Independent protocol reference with reads and separate reboot path; not installed |
| S12 | [TP-Link CVE-2026-5040](https://www.tp-link.com/hk/support/faq/5190/) | M5v1 weak hashing advisory with privileged compromise prerequisite; no revision match established |
| S13 | [JVNVU99392903](https://jvn.jp/en/vu/JVNVU99392903/) | Historical M4 JPv2 authenticated injection affected range, not a finding on owner firmware |
| S14 | [CCS2024 mesh-security paper](https://www.cs.ucr.edu/~krish/ccs24.pdf) | Original Dropbear/tmpsvr analysis and disclosure/patch table; does not establish current firmware exposure |
| S15 | [TP-Link CVE-2026-15469](https://www.tp-link.com/uk/support/faq/5263/) | Shared-key advisory names XE75/XE5300/WE10800 revisions, absent from inventory |
| S16 | [Official E4v4 download page](https://www.tp-link.com/my/support/download/deco-e4/) and [reviewed ZIP](https://static.tp-link.com/upload/firmware/2025/202507/20250711/E4%204.0_en_1.1.2%20Build%2020250226%20Rel.%2035508.zip) | Matching displayed build, US package. Offline download/hash/strings only; no owner-region match or installation |
| S17 | [OpenWrt M5 source commit](https://github.com/openwrt/openwrt/commit/c60be6e983d95c971dc5659afb882eaeac9d01ca) | M5v1/v2/v3 IPQ4019 definitions, not a stock driver/CSI test |
| S18 | [OpenWrt M4R maintainers' commit](https://lists.infradead.org/pipermail/lede-commits/2022-May/014025.html) | M4Rv1/v2 QCA9563 and QCA9888 source definitions; not universal Atheros-CSI-tool compatibility |
| S19 | [Apple current-interface noise/RSSI documentation](https://developer.apple.com/documentation/corewlan/cwinterface/noisemeasurement%28%29) | Public dBm methods and zero error/disconnection sentinel; not a CSI API |
| S20 | [CSI-Bench NeurIPS2025, §3.3](https://proceedings.neurips.cc/paper_files/paper/2025/file/f7c68372b3d39e8d7a093eb2edaaad87-Paper-Datasets_and_Benchmarks_Track.pdf) | IPQ4019/IPQ4018 precedent, explicitly vendor-enabled drivers/firmware and proprietary utilities; no retail Deco export established |
| S21 | [Atheros CSI Tool setup](https://github.com/xieyaxiongfly/Atheros_CSI_tool_OpenWRT_src/wiki/Getting-started-with-Atheros-CSI-tool), [ath10k-ct developers](https://github.com/greearb/ath10k-ct/issues/122), [Nexmon CSI](https://github.com/seemoo-lab/nexmon_csi) | Chip/driver/firmware-specific prerequisites; not a universal no-flash collector |
| S22 | [RuView BFI decoder](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/tools/bfi/bfi_decode.py) and [capture acceptance](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/tools/bfi/README.md) | Existing offline VHT/HE steering decoder; separate Linux capture prerequisites, no Deco witness or full-CSI reconstruction |
| S23 | [Existing Mac helper](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/archive/v1/src/sensing/mac_wifi.swift) and [Rust scanner](https://github.com/dayumheroic/RuView_DayumHeroic/blob/3a1bf6dae78d1b6a9b0f249c16dc65ceb17ebe76/v2/crates/wifi-densepose-wifiscan/src/adapter/macos_scanner.rs) | Current connected-link RSSI precedent. ADR025 is proposed/historical; current source takes precedence over its simulated-fallback claims |
| S24 | [Deco signature-bypass research](https://github.com/naf419/tplink_deco_exploits) | Hardware/recovery upload methods conflict with no-flashing scope; not executed |
| S25 | [M5 offline packaging research](https://github.com/rickdeck/decrypt_Deco_m5-p7) | Candidate SP4/AES/RSA offline extraction procedure. Not executed or copied; recovery/patching instructions are outside scope |

E4 archive SHA256:
`cd7860b3c68079eb26b799940ac962d8e8915f6bbfcf6639a2dbc3f08503e4fc`.
Contained firmware image SHA256:
`a7f2bd34df64738effbcfe543ad15e0f395867980a483b78abb08f5478918bd8`.
These are public vendor-artifact hashes, not device-specific credentials or
the owner's private certificate fingerprint. No downloaded image is committed.

Additional [official M5 package](https://static.tp-link.com/upload/firmware/2026/202607/20260728/M5v1_M5v3_M5v3.20_M1300v1_M1300v2_M1300v3-SP4-RSA2048-up-ver1-9-5-P1%5B20260602-rel25369%5D_2026-06-02_00.03.30.zip)
from S4: archive SHA256
`78f491ac268d40dbdaeb53e3b0f75d5665001e56df4dfe11b7a69529c22709dc`;
contained image SHA256
`4d6ab4f2a9708dc05fc0a7a95f7422b5f34df82ce78022715111613cc37ad672`.
The displayed build matches, but region is not verified. No filesystem audit or
decryption completed; no firmware was uploaded to hardware.

The prior Work chat supplies **CLAIMED/user-reported** inventory including two
E4s. New owner-supplied screenshots were inspected in this session: E17 confirms
the app displays an M5 main and M4R satellite with the firmware builds recorded
in the inventory. This is app-view evidence, not authenticated local API evidence.
Addresses, MACs, network/room names and screenshots remain private. Do not copy
the prior conversation or screenshots into a public PR.
