# Contributing to Smart Kitchen Scale

Contributions to this project must follow the standards and validation steps defined below.

## Commit Message Convention

All commit messages must adhere to the Conventional Commits specification.

| Prefix | Scope | Description |
| :--- | :--- | :--- |
| `feat` | Firmware | Introduces a new feature or peripheral capability |
| `fix` | Bug Fix | Corrects a functional fault or sensor calibration issue |
| `refactor` | Codebase | Modifies internal structure without changing external behavior |
| `docs` | Documentation | Modifies markdown files, schemas, or wiring tables |
| `ci` | Automation | Modifies GitHub Actions pipelines or PlatformIO configurations |

Format: `<type>(<scope>): <subject>`

Example: `feat(ble): add connection timeout handler`

## Local Development Workflow

1. Fork and clone the repository.
2. Create a dedicated branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. Install PlatformIO Core if not present:
   ```bash
   pip install platformio
   ```
4. Verify the build locally:
   ```bash
   pio run
   ```
5. Ensure static analysis passes:
   ```bash
   pio check
   ```

## Pull Request Checklist

Before submitting a pull request, verify:
- The firmware compiles cleanly via `pio run` with zero compiler warnings.
- New peripherals use non-blocking timers instead of blocking delays.
- Hardware pin assignments are documented in `include/config.h`.
- The pull request description specifies testing hardware and validation results.
