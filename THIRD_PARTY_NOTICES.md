# Third-party notices

[LICENSE](LICENSE) covers original project/adaptation source and the project's own app icon and editable TV/HDMI input glyphs. Retain upstream notices when redistributing code. This license does not relicense third-party fonts, photographs, provider trademarks or app artwork.

| Material | Terms | Retained notice |
|---|---|---|
| Upstream webos-launcher code | MIT | [upstream notice](public/licenses/Upstream_Launcher_MIT.txt) |
| Preact | MIT | [Preact notice](public/licenses/preact-MIT.txt) |
| Unmodified Inter font | SIL OFL 1.1 | [Inter notice](public/licenses/Inter-OFL.txt) |
| ws 7.5.11 | MIT | [ws notice](public/licenses/ws-MIT.txt) |
| Generated aiowebostv 0.4.2 public registration data | Apache-2.0 | [aiowebostv notice](public/licenses/aiowebostv-Apache-2.0.txt) |
| NASA/JPL photos and derived launch background | NASA media guidelines and applicable JPL image-use policy | [exact credits and usage URLs](public/licenses/Space_Photo_Sources.json) |
| Optional provider artwork | Publisher copyright/trademarks; no general redistribution license established | [public provenance and hashes](public/licenses/App_Artwork_Sources.json) |

## Images and artwork

The five bundled photographs are real observations or photography, including traditional multi-band scientific composites. They are not AI-generated imagery. Preparation applies a centered 16:9 crop and resizing; the UI supplies its dark treatment. `Launch_Background.png` is a darkened derivative of the Cassini image “The Day the Earth Smiled,” PIA17172, credit NASA/JPL-Caltech/SSI. Full source/credit associations remain available in Settings and the manifest. NASA/JPL materials are not represented as MIT-licensed, and no NASA, JPL or contributor endorsement is implied.

The optional artwork fetch script downloads original flattened tvOS marketing icons for private installations; it does not generate, redraw or alter provider logos. Public CDN accessibility is provenance, not permission to redistribute. Generated app artwork is ignored by source control and must remain excluded from releases unless the relevant rights are established. Apple TV and GeForce NOW use original installed-TV artwork at runtime rather than a guessed tvOS icon.

LG/webOS, Apple/tvOS, streaming-service names and other third-party marks belong to their owners. This independent launcher is not affiliated with those providers. Installer/development tools are installed by lockfile and retain their own licenses in their packages. Review their notices if distributing those tools themselves.
