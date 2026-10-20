# Attribution

**Quiet Home creator and adaptation author:** Kian Konrad Tajbakhsh, 2026.

**Upstream launcher:** [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher), source baseline commit `1e2c39b9a988ceb1b258e40e3592bda84a2aa076`, MIT. Its copyright notice, “Copyright (c) 2026 webos-launcher contributors,” remains in [LICENSE](LICENSE) and the unmodified [upstream notice](public/licenses/Upstream_Launcher_MIT.txt). Creator attribution for this adaptation does not claim sole authorship of upstream code.

The adaptation adds the six-favorite landscape Dock, live installed-app handling, selection/order recovery, NASA photography and credits, focus behavior, and same-app no-root TV-local Home/wake observation.

- Preact: MIT, copyright Jason Miller. [Notice](public/licenses/preact-MIT.txt).
- Inter: SIL Open Font License 1.1, copyright the Inter Project Authors. [Notice](public/licenses/Inter-OFL.txt). The font remains unmodified.
- ws: MIT, copyright Einar Otto Stangvik and Arnout Kazemier and contributors, as recorded in its [retained notice](public/licenses/ws-MIT.txt). Version 7.5.11 is installed from the service lockfile.
- aiowebostv: Apache-2.0, [Home Assistant Libraries project](https://github.com/home-assistant-libs/aiowebostv). Its [retained notice](public/licenses/aiowebostv-Apache-2.0.txt) covers the published SDK registration data generated at setup from version 0.4.2. No static vendor IDs/signatures or user pairing keys are included in the tracked source.
- App icons: their respective publishers, fetched separately from reviewed public Apple App Store tvOS sources. [Source manifest](public/licenses/App_Artwork_Sources.json). No redistribution license is implied.
- Five offline NASA/JPL photographs and the launch-background derivative: exact titles, IDs, credit lines, source and usage URLs in [Space photo sources](public/licenses/Space_Photo_Sources.json). These media are separate from the MIT code license.

The application's own original icon and the simple editable TV/HDMI SVG glyphs are covered by the project's MIT license. No LG input bitmap or third-party native app bitmap is redistributed with this source export. Any original native icon used on a TV is read at runtime from that TV's existing installed-app metadata.
