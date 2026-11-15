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
3. Firmware Verification (ESP32-C3):
   ```bash
   # Install PlatformIO Core if not present
   pip install platformio

   # Compile firmware
   pio run # or: make build-firmware

   # Run static analysis
   pio check
   ```
4. Companion App Verification (`app/`):
   ```bash
   cd app
   npm ci
   npm test       # executes test suite runner
   npm run lint   # executes oxlint
   npm run build  # executes tsc typecheck & vite production build
   ```
5. Unified Verification:
   ```bash
   make ci        # runs full verification across firmware and companion app
   ```

## Pull Request Checklist

Before submitting a pull request, verify:
- The firmware compiles cleanly via `pio run` with zero compiler warnings.
- New peripherals use non-blocking timers instead of blocking delays.
- Hardware pin assignments are documented in `include/config.h`.
- Frontend changes pass `npm test`, `npm run lint`, and `npm run build` in `app/`.
- All internal markdown documentation links resolve cleanly.
- The pull request description specifies testing hardware and validation results.
