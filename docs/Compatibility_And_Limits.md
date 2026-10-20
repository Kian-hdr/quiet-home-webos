# Compatibility and limits

## Evidence boundary

The maintainer exercised the source baseline on one LG 2021 A1 with SDK 6.5.3, firmware 03.53.45, Chromium 79 and Node 8.12. The 1.3.4 source/service package includes ws 7.5.11. Standby/wake and repeated Home navigation were exercised there. This export changes the namespace to `org.quiethome.launcher` and uses a generic six-app preview; it is not an in-place update of a private maintainer installation. Its local build/packaging checks do not establish device acceptance or compatibility with additional models.

## Home and power

The physical Home key belongs to LG's system Home. The paired TV-local service observes foreground changes and launches Quiet Home using the public Application Manager. A native Home flash may remain. Recent source-baseline observations were approximately half a second from foreground Home event to custom-app readiness, with button-to-observation affected by polling. There is no zero-frame or latency guarantee.

The service registers its own persistent explicit background activity, connects through TV-local loopback, and uses the same app's normal restricted service access. On a transition to Active following an inactive state, it requests the app again. It does not request a keep-awake/power requirement. Neither ordinary standby testing nor a persisted activity definition proves full cold boot after power loss. That case remains unverified.

The implementation does not invoke Input Hook, root services, private EIM registration, forged signatures, privileged system identities or alert-callback tricks. Developer Mode/normal TV-approved remote-control access remains mandatory. Restricted APIs, denied permissions and failed authorizations stop the corresponding integration instead of escalating privileges.

## Retention and network

LG Developer Mode has a limited session. Extend it through the supported control before expiry. LG can remove developer apps when the mode is disabled; this is not permanent app-store installation. Updating firmware remains enabled. No TV-wide preference or essential app is changed by the source tools.

After installation and provisioning, Home observation and installed-app discovery run on the TV without a Mac. Optional online NASA photography requires internet access; the five local photographs remain available offline. Public app inventories can differ by region/model. Source labels reflect the TV's own input configuration. Missing artwork falls back to original native metadata or plain text, not a fabricated logo.

## Platform references

- [LG JavaScript service basics and per-platform Node versions](https://webostv.developer.lge.com/develop/guides/js-service-basics)
- [LG JS service lifecycle FAQ](https://webostv.developer.lge.com/develop/guides/js-service-faq)
- [LG Activity Manager](https://webostv.developer.lge.com/develop/references/activity-manager)
- [LG public Application Manager](https://webostv.developer.lge.com/develop/references/application-manager)
- [LG Developer Mode](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app)

Current LG support states there is no general consumer-TV app autostart API. This project's observed same-app service behavior is narrower device evidence, not a promise that it is a universal default launcher or supported boot configuration for every TV.
