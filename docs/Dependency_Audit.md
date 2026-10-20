# Dependency audit disposition

Checked 20-Oct-2026 after a fresh `npm ci --ignore-scripts` and separate service install.

## TV runtime

`Service/package.json` and its lockfile pin **ws 7.5.11**. The service audit reported **zero vulnerabilities**. This is the compatible 7.x backport for [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p), not a major runtime upgrade. The setup computer's dependencies are not included in the installed TV app.

## Setup-computer tooling

The root audit reports **11 findings: 3 moderate, 7 high, 1 critical**. Exact package paths and public advisory URLs are in [Dependency_Audit.json](Dependency_Audit.json). These are unresolved development-tool findings, not a clean audit.

A safe root `source-map-js` override to 1.2.2 is retained and builds successfully. The official `@webos-tools/cli` 3.2.6 embeds an npm shrinkwrap. Attempts with root overrides and same-major patched root-lock resolutions did **not** survive fresh installation: its nested `proxy-addr` remained 2.0.7 rather than the available 2.0.8 fix, and nested `qs` and `brace-expansion` remained on its own pinned versions. Those ineffective overrides were removed, and its actual dependency graph is recorded honestly. No vendor package, managed cache, or dependency role was rewritten to disguise this state.

The CLI dependency chain includes the critical proxy-addr advisory and high/moderate parser/glob/formatting advisories. Vite 5.4.21 and its esbuild dependency also have development-server advisories; npm proposes a major Vite change. No forced major Vite/CLI migration was made in this source export.

Use the setup toolchain only with trusted project/input files; bind any dev server and inspector to localhost, close them after use, and do not expose them to the network. Production packaging does not ship Vite's dev server or the installer CLI to the TV. These exposure limits reduce applicability but do not resolve the advisories. Review official updates and re-run clean install/build/package/audits before any public release.

This snapshot is an audit disposition, not a security certification or permission to ignore a future applicable issue.
