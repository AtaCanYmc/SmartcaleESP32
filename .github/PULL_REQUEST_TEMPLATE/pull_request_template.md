## Description

<!-- Provide a concise technical summary of the changes introduced in this PR. -->

## Changes

<!-- List specific files, functions, or configurations modified. -->
- 

## Type of Change

- [ ] `feat`: New capability, peripheral support, or architectural addition
- [ ] `fix`: Bug fix or sensor calibration correction
- [ ] `docs`: Documentation updates, schemas, or wiring tables
- [ ] `refactor`: Internal structure change without behavioral alteration
- [ ] `test`: New or updated tests (unit, service, or hardware tests)
- [ ] `ci`: Automation, workflow, or build tooling updates

## Verification

<!-- Detail the steps taken to verify the changes locally (hardware testing, PlatformIO compilation, or frontend test suites). -->

```bash
# Firmware verification:
pio run && pio check

# Companion app verification:
npm --prefix app test && npm --prefix app run lint && npm --prefix app run build

# Markdown link verification:
python3 -c 'import re, glob, os; all_broken = [f"{f} -> {link}" for f in glob.glob("**/*.md", recursive=True) if "node_modules" not in f and ".pio" not in f for link in re.findall(r"\[.*?\]\((?!https?://|mailto:)(.*?)(?:#.*)?\)", re.sub(r"`[^`]*`", "", re.sub(r"```[\s\S]*?```", "", open(f, encoding="utf-8").read()))) if link.strip() and not link.strip().startswith("#") and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(f), link.strip())))]; exit(1 if all_broken else 0)'
```

## Checklist

- [ ] My commits adhere to [Conventional Commits](https://www.conventionalcommits.org/).
- [ ] Documentation (`README.md`, `docs/`, `app/README.md`, `web-flasher/README.md`) reflects the changes.
- [ ] No extraneous dependencies, temporary files, or AI slop introduced.
- [ ] All tests and CI validations pass locally.
