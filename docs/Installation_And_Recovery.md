# Installation and recovery

Use the official LG Developer Mode route. All examples use the generic target alias `TV` and documentation address `192.0.2.10`; substitute your own values locally. Do not publish device/network details or keys. This generic-ID export is separate from the maintainer's private installation.

## 1. Prepare the TV and setup computer

1. Install LG's official Developer Mode app from LG Apps, sign in with your developer account, enable Developer Mode and then Key Server as LG directs. Complete any TV reboot or authentication prompt yourself.
2. Run the official `npx ares-setup-device` workflow to register an explicit alias such as `TV`, then `npx ares-novacom --device TV --getkey`. Enter the TV's passphrase only into the supported prompt. Never put a password/passphrase in a command, document or log.
3. Build following the README. Keep a copy of the previous known-working source/package outside this checkout before updates. Only the current generic app ID is managed by these helpers.

[LG official Developer Mode instructions](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app).

## 2. Install the app

```sh
. .venv/bin/activate
python tools/tv_control.py install --device TV --ipk build/org.quiethome.launcher_1.3.4_all.ipk
python tools/tv_control.py launch --device TV
```

The installer checks the package's embedded app ID. On a fresh installation it installs only that package. For an existing installation, it requires verified stopping through the same app before updating; see below. The generic namespace avoids silently updating a differently named private package.

## 3. Pair normally and provision approved keys

Use a private directory outside the repository, with directory mode 0700 and key files mode 0600. Two separately approved files distinguish installed-app discovery from the Home observer. The helper reads only file paths supplied explicitly by you.

The TV's SSAP endpoint uses a self-signed TLS certificate. Obtain/check its public certificate fingerprint over your trusted local connection, and pin that exact SHA-256 value. For example, a trusted setup computer can display the presented certificate fingerprint with:

```sh
openssl s_client -connect 192.0.2.10:3001 </dev/null 2>/dev/null | openssl x509 -noout -sha256 -fingerprint
```

This first inspection depends on a trusted local network; it is not an independent identity guarantee. Check unexpected certificate changes before reconnecting. `pair_tv.py` matches the explicitly supplied pin before sending any registration data. It does not turn off a TV approval prompt or reuse someone else's credentials.

```sh
python tools/pair_tv.py --host 192.0.2.10 --fingerprint YOUR_CHECKED_SHA256 --scope catalog --key-file "$HOME/.local/state/quiet-home/catalog-key.json"
python tools/pair_tv.py --host 192.0.2.10 --fingerprint YOUR_CHECKED_SHA256 --scope home --key-file "$HOME/.local/state/quiet-home/home-key.json"
python tools/tv_control.py provision --device TV --catalog-key-file "$HOME/.local/state/quiet-home/catalog-key.json" --home-key-file "$HOME/.local/state/quiet-home/home-key.json"
```

Approve each normal connection on the TV. The Home scope uses the unchanged published aiowebostv 0.4.2 registration payload, generated locally from the pinned distribution; no signature is forged. Discovery uses a minimal READ_INSTALLED_APPS request. The files remain outside the repo and their contents are never printed. Provisioning sends them as app launch parameters, which may be transiently visible in local process arguments/debuggers; do not share terminal traces, debugger dumps or logs of that operation.

Verify the actual TV before relying on it: Settings reports the integration enabled, installed apps refresh, selecting an app works, Home returns to Quiet Home, the house button opens LG Home for a temporary bypass, and standby/wake recovers. A running computer is not required for these TV-local functions. Full power-loss cold boot remains unverified.

## 4. Export preferences and stop before update/removal

Keep only one target/inspector session for this workflow. Launch the app on `TV`, then start its **official** inspector:

```sh
npx ares-inspect --device TV --app org.quiethome.launcher
```

Use the localhost port printed by that command as `PORT` below. **The inspector must belong to the same `--device TV` alias and the same generic app.** The helper verifies the inspected app ID and a localhost debugging destination; it cannot independently prove that your chosen port belongs to that alias. Close unrelated inspector sessions and do not mix targets.

```sh
python tools/tv_control.py export-preferences --device TV --inspector-port PORT --file "$HOME/.local/state/quiet-home/preferences.json"
python tools/tv_control.py stop --device TV --inspector-port PORT
```

Only the `launcher-config-v1` preference object is exported, not pairing keys, discovered inventory, credentials or streaming logins. The stop check must confirm disabled state, no active anchor, persisted disable and cancellation of the app's own activity. If any check fails, retain the installed app and use Settings to disable integration before diagnosing. Closing the app alone does not prove its activity stopped.

## 5. Update, restore or remove

After exporting preferences and stopping, install a trusted new package using `install` with the same explicit target and inspector port. Build output is disposable; the preference backup is meaningful private data and should stay recoverable.

```sh
python tools/tv_control.py install --device TV --inspector-port PORT --ipk build/org.quiethome.launcher_1.3.4_all.ipk
python tools/tv_control.py launch --device TV
```

Reopen the official inspector if the old port/context ended after an update. Restore the exported object, then verify order and Settings on the TV:

```sh
python tools/tv_control.py restore-preferences --device TV --inspector-port PORT --file "$HOME/.local/state/quiet-home/preferences.json"
```

Restoration first verifies a stop, closes only this app and launches it with the preference object and a one-time restore nonce. It does not restore firmware, DRM, provider accounts or other apps. Re-enable Home explicitly in Settings after confirming the desired behavior. Approved pairing state may need provisioning again after a clean reinstall.

For removal, retain the same target/inspector binding and use:

```sh
python tools/tv_control.py remove --device TV --inspector-port PORT
```

This verifies a stop, removes only `org.quiethome.launcher`, then checks that its app ID is absent. Confirm normal LG Home afterward. If the service has already become unavailable, do not infer that a persisted activity was cancelled; investigate using the app's normal supported debugging path before removal. Essential LG apps and all TV-wide settings remain outside the helper's removal scope.

## Failure handling

- Expired Developer Mode: use LG's supported renewal/account flow. Do not modify session scripts, signatures or OS roles.
- Pairing denied or certificate mismatch: stop; check the target and normal consent/pin. Do not bypass the prompt.
- Local SSAP/public launch denied: keep integration disabled and inspect the app's own status. Do not switch to root/private callbacks.
- Bad update: stop/cancel, reinstall the prior known-working generic-ID package and restore the preference backup. Check the UI, app launch, Home and standby/wake again.
- The new helper scripts have local syntax/help checks; these generic-ID workflows were not run against a TV during export preparation.
