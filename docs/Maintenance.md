# Maintenance

## Reproducible setup

Use the committed root and Service lockfiles. Run `npm ci --ignore-scripts`, then `npm run service:deps`. Generate the ignored SDK manifest from installed aiowebostv 0.4.2; never paste SDK vendor metadata, signatures or user keys into tracked source. Generate optional provider artwork separately. Build targets Chromium 79 with a classic IIFE script; the TV service remains CommonJS compatible with Node 8.12. Host CLI dependencies need Node 20+.

The public Apple CDN can regenerate EXIF/XMP metadata identifiers. The artwork manifest preserves the original whole-file SHA plus a hash over all PNG chunks except non-rendering EXIF/text/time chunks. The fetcher verifies rendering/color content and leaves downloaded bytes untouched. A rendering mismatch requires a fresh provenance/identity review; do not replace the hash just to bypass a failure. Generated artwork is not part of the MIT source license.

## Version and update discipline

Update root `package.json`, root lockfile root entry, `Service/package.json`, Service lockfile root entry and `public/appinfo.json` together. Preserve the generic app/service IDs and callback namespace. Do not revive the separate-helper prototype. Preserve the service's own persistent activity lifecycle and stop checks; `message.respond` can complete an associated activity.

Before an installed update, export preferences, verify Home integration has durably stopped, preserve the prior working package, then use the explicit same-device install flow. Afterward inspect UI, order/restore, live app additions/removals, individual app launches, original icon fallback, Home and standby/wake. Report full cold boot separately. Local build/package success is not on-TV acceptance.

## Local data and disclosure

Pairing keys, service private configuration, debugger output, device inventories, screenshots, receipt files and user backups stay outside the repository. The TV stores its Home key in its own service's `bridge.private.json` with mode 0600; the web app keeps its catalog authorization in app-local storage. Do not export all localStorage or debugger state. The source contains only a six-app illustrative preview, generic target examples and public provenance.

Before any commit or release, inspect the full candidate tree/history for generated SDK manifests, keys, local addresses, per-person defaults and runtime data. `.gitignore` is a prevention aid, not a retrospective scrub. Keep the repository private pending the creator's review. Never publish generated provider artwork or arbitrary new NASA media under the MIT code license.

## Service and power behavior

The observer runs on the TV after normal setup and approved pairing. It registers its own background/persist/explicit activity and calls its own app via public Application Manager. It does not prevent suspension, disable screensavers, change updates or remove essential apps. A native Home transition remains possible. Stop/cancel before package removal; uninstalling an app is not assumed to cancel an orphaned persistent definition.

When investigating, use only the intended app's official inspector, target alias and own-service methods. Keep a single target/inspector pairing and verify the alias/port relationship yourself. Never use role overrides, a privileged service namespace, forged signatures, Input Hook or unprovided EIM registration as a recovery shortcut.

## Dependencies and release review

Run both root and Service audits after a dependency change. Keep the compatible ws security backport pinned. Root development tooling is not shipped in the TV app, but it still matters on the setup computer. [Dependency audit](Dependency_Audit.md) records exact residuals, including the official CLI's shrinkwrapped dependencies. Do not force a major Vite/CLI migration as part of a routine app update without separate build/behavior validation.

A future public release needs the creator's review, clean source/history, accurate media/software notices, fresh dependency disposition and clear model/testing limits. The present source export starts no release or publication workflow.
