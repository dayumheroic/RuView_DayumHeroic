# 03 — `improvements` tooling review

## Desired state and effect

Choose only tools relevant to the observed interface and understand their
dependencies, licenses and side effects before running them. A library of
security tools is not a firmware-specific exploit inventory.

## Prerequisites

Read the asset's nearest instructions and establish an exact analysis target.
No tool installation or execution is needed for this reference review.

## Reviewed baseline

`dayumheroic/improvements` at
`d0e906c9538221f76a84cfaace6744b542674b2a`, default branch
`claude/focused-goodall-b5ot6r`. This session created a sparse local checkout;
none existed in the bounded locations searched. Initial status was clean.
Root `README.md` and `CATALOG.md` define vendored reference snapshots, preserved
asset licenses and no CI. No root `AGENTS.md` or `CLAUDE.md` exists at this
commit; vendored instructions are scoped to their asset directories.

| Asset | Pin / inspected evidence | Decision |
|---|---|---|
| `reverse-engineering/rea` | Upstream `3e7c6302233ecbcb9b92e43ee5a60337738961bd`; ASSET, README, AGENTS, package manifest, SECURITY, DISCLAIMER, LICENSE | Optional later analysis of lawfully obtained artifacts. Not required for initial inventory; not installed or executed |
| `security/power-pwn` | Upstream `88456806d93b9c0c9c777db7c72c40ea2c26af72`; ASSET plus root catalog | Microsoft 365/Power Platform tooling; no Deco applicability established. Do not run |
| `osint/Aliens_eye` | Root catalog only | Username OSINT does not answer mesh telemetry questions |
| Code understanding/design assets | Root catalog only | Optional engineering references; no network capability inferred |

REA's top-level license is MIT, but bundled providers/tools keep separate
licenses and may need user-supplied installations. Its package manifest has
optional Frida and setup/build scripts: installation is not a read-only step.
Do not run `rea setup`, package install hooks, runtime attachment or traffic
interception as part of discovery. The current review is manifest/documentation
review, not a full dependency or supply-chain audit.

## Actions and evidence

1. Record repository and asset pins, license files and nearest instructions.
2. For a selected tool, inspect its actual entry point, lockfile, install hooks,
   subprocesses, external destinations, credential inputs, privileges and
   cleanup. Record unreviewed dependencies explicitly.
3. Prefer built-in macOS route/interface tools and a bounded HTTP reader for
   discovery. A future community Deco adapter should be pinned and reviewed
   separately, particularly its write/reboot functions and session logging.
4. If deeper artifact analysis becomes useful, obtain an owner-authorized
   artifact, hash it privately, and run a static-only analysis in an isolated
   environment. Document the provider and its license; do not extract secrets
   or execute the target merely to discover a status schema.

## Completion and recovery

Gate: each selected tool has a pin, license decision, reviewed entry point,
bounded execution plan and data/cleanup policy. Current discovery selects no
vendored executable. Stop a tool that exceeds scope; retain sanitized evidence
and clean only resources demonstrably created by that run. Do not alter the
vendored snapshots to make the bridge work.
