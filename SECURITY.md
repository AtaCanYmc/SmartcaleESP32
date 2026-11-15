# Security Policy

## Supported Versions

Only the latest release receives active maintenance and security patches.

| Version | Supported |
| :--- | :--- |
| 1.3.x | Yes |
| < 1.3.0 | No |

## Reporting a Vulnerability

Do not disclose security vulnerabilities publicly in GitHub issues or discussions.

1. Navigate to the repository Security tab and select **Report a vulnerability** to open a private GitHub Security Advisory (`https://github.com/AtaCanYmc/SmartcaleESP32/security/advisories/new`).
2. If private advisories are unavailable, contact the maintainer directly via GitHub profile contact information (`atacanymc@users.noreply.github.com`).
3. Include the following details in your report:
   - Affected firmware revision, companion app release, or commit hash.
   - Attack vector, such as malformed BLE GATT packets, captive portal buffer handling, or API injection.
   - Exact reproduction steps or minimal proof of concept.

## Response SLA

- Initial acknowledgment: Within 48 hours of receipt.
- Triage and mitigation assessment: Within 5 business days.
- Patch release: Deployed to `main` upon verification and released via semantic tag.
