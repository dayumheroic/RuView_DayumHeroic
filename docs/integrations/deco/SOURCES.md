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

The prior Work chat supplies **CLAIMED/user-reported** inventory including two
E4s. New owner-supplied screenshots were inspected in this session: E17 confirms
the app displays an M5 main and M4R satellite with the firmware builds recorded
in the inventory. This is app-view evidence, not authenticated local API evidence.
Addresses, MACs, network/room names and screenshots remain private. Do not copy
the prior conversation or screenshots into a public PR.
