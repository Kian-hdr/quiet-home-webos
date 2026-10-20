# Security and privacy

Quiet Home is an independent, no-root Developer Mode app. It does not replace firmware, disable updates, remove essential apps, impersonate system services or bypass normal TV pairing. The same-app service uses approved TV-local control and LG's public Application Manager. Authentication/permission failures disable the affected integration rather than seeking privilege.

Keep the setup computer and TV on a trusted local network. Pair through normal TV consent, explicitly pin the presented TLS certificate for setup, and store keys outside the checkout with mode 0600. Do not share keys, launch-parameter traces, debugger dumps or complete app-local storage. Public screenshots and inventories need separate privacy review. Optional NASA calls are unauthenticated and contain no provider login; the offline photographs remain usable without them.

Bind the development server and official inspector to localhost; do not expose their ports to the LAN or internet. Development tools have residual advisories described in [Dependency_Audit.md](docs/Dependency_Audit.md). This does not establish zero risk or an audited security certification. The TV runtime's ws dependency is independently audited through its Service lockfile.

For a suspected defect, contact the repository maintainer through a private channel made available by the repository host. Do not place credentials, device identifiers or exploit material in public issues. No email address or external send is configured by this export.
