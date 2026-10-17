# Security Policy

## Supported Versions

Only the latest firmware release receives active maintenance and security patches.

| Version | Supported |
| :--- | :--- |
| 1.0.x | Yes |
| < 1.0.0 | No |

## Reporting a Vulnerability

Do not disclose security vulnerabilities publicly in GitHub issues or discussions.

1. Navigate to the repository Security tab and select **Report a vulnerability** to open a private GitHub Security Advisory.
2. If private advisories are unavailable, contact the maintainer directly via GitHub profile contact information.
3. Include the following details in your report:
   - Affected firmware revision or commit hash.
   - Attack vector, such as malformed BLE GATT packets or buffer handling.
   - Reproduction steps or proof of concept.

## Response SLA

- Initial acknowledgment: Within 48 hours of receipt.
- Triage and mitigation assessment: Within 5 business days.
- Patch release: Deployed to `main` upon verification.
