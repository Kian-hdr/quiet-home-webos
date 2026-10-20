# Quiet Home

A minimal, no-root home app for LG webOS TVs, created as an adaptation by **Kian Konrad Tajbakhsh**. Version **1.3.4**. Based on [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher) under MIT, with upstream credits retained.

This source export is prepared for a **private repository pending the creator's review**. It does not publish a release. Its generic app ID is `org.quiethome.launcher`; it is a reproducible source package, not an in-place update of the maintainer's private device package.

## What it does

- Six landscape favorites in a shared Dock, with other installed apps and inputs below.
- Live TV-local app discovery, refreshed on return and once a minute while visible. New apps use their original native TV icon; removed apps disappear.
- Hold OK, move with arrows, then OK to place or Back to cancel. Settings controls app/source selection and ordering; preferences can be exported and restored.
- Real NASA photography, a dark treatment, roughly one-minute rotation and an optional six-hour visible-operation collection refresh. Five bundled photographs remain available offline. Full image credits live in Settings and the source manifest.
- App captions and photo/source overlays stay hidden. App names remain available to accessibility tools and as plain text when artwork is unavailable. Background clicks, Back, window blur and hidden-tab transitions clear focus; arrows restore it.
- A restricted same-app JavaScript service handles Home observation and wake recovery entirely on the TV. **A running Mac is not required after setup.**

LG handles the physical Home button first. Quiet Home then redirects through the public Application Manager, so a brief native Home transition remains possible. This is an observer, not a privileged system-Home replacement. It does not root the TV, modify firmware, disable updates, suppress power management/screensavers, or uninstall other apps.

The maintainer's source baseline was exercised on an **LG 2021 A1, webOS SDK 6.5.3, firmware 03.53.45**, including standby/wake and repeated Home navigation. A recent Home event-to-ready observation was about half a second; user-visible timing varies. This generic-ID export has been built locally but has not been installed on another TV. Full power-loss cold boot remains unverified. See [compatibility and limits](docs/Compatibility_And_Limits.md).

## Build

Use Node.js 20+ and Python 3.9+ on the setup computer. The TV service targets its separate Node 8.12 runtime.

```sh
npm ci --ignore-scripts
npm run service:deps
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --no-deps -r tools/requirements.txt
npm run registration:generate
# Optional: fetch original publisher app icons for your own private installation.
npm run assets:fetch
npm run build
npm run package
```

The package is `build/org.quiethome.launcher_1.3.4_all.ipk`. The service uses exact `ws@7.5.11`, a Node 8-compatible security backport. No `node_modules`, generated registration manifest or compiled package is source-controlled.

Provider icons are **not bundled in this source export and are not licensed under MIT**. The optional fetcher verifies the reviewed public source's PNG rendering/color chunks and retains the downloaded bytes unchanged. Apple sometimes regenerates only EXIF/XMP IDs, so a historical whole-file SHA can differ while the rendering hash remains identical. Changed image content stops the fetch. Apple TV and GeForce NOW have no static substitutions in this export; TV discovery uses their original installed LG artwork. Without optional fetched artwork, native TV artwork and plain text remain available.

## Install and pair

Use the official LG Developer Mode and CLI, a normal on-TV consent prompt, and an explicit device alias such as `TV`. Keep keys and preference backups outside the repository. Follow [Installation and recovery](docs/Installation_And_Recovery.md); the helper requires file paths for approved keys and never prints their values.

## Maintenance and licensing

[Maintenance](docs/Maintenance.md) covers updates, verified stopping, restoration and source hygiene. [Dependency audit](docs/Dependency_Audit.md) records remaining development-tool advisories. [Attribution](ATTRIBUTION.md), [third-party notices](THIRD_PARTY_NOTICES.md), and [MIT license](LICENSE) distinguish code from fonts, publisher artwork and NASA/JPL media. LG, Apple, NASA and the app providers do not sponsor or endorse this project.

## Actual TV before and after

These are genuine native TV captures from the maintainer test, converted to metadata-free PNG. The before image shows stock LG Home; the after image shows Quiet Home1.3.4. They are device evidence, not generated mockups. Visible provider/UI artwork remains owned by its respective publishers and is not relicensed under MIT.

![Stock LG Home before](docs/images/Before.png)

![Quiet Home after](docs/images/After.png)
