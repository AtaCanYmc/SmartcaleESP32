.DEFAULT_GOAL := help

# Terminal color styling
BOLD    := \033[1m
GREEN   := \033[32m
CYAN    := \033[36m
YELLOW  := \033[33m
RESET   := \033[0m

# Configurable options
PORT ?=
BAUD ?= 115200

# PlatformIO flag construction
PIO_UPLOAD_FLAGS  := $(if $(PORT),--upload-port $(PORT),)
PIO_MONITOR_FLAGS := $(if $(PORT),--port $(PORT),) --baud $(BAUD)

.PHONY: all help build build-firmware build-fw flash upload monitor flash-monitor clean-firmware \
        app-install app-dev app-build app-sync app-android app-ios app-lint clean-app clean ci

help:
	@echo ""
	@echo "$(BOLD)Smartcale ESP32 - Build & Developer Commands$(RESET)"
	@echo "Usage: make $(CYAN)<target>$(RESET) [PORT=/dev/...]"
	@echo ""
	@echo "$(BOLD)Firmware (ESP32-C3 / PlatformIO):$(RESET)"
	@echo "  $(CYAN)build-firmware$(RESET)   Build ESP32-C3 firmware (alias: build-fw, build)"
	@echo "  $(CYAN)flash$(RESET)            Flash firmware to ESP32-C3 (alias: upload) [optional: PORT=...]"
	@echo "  $(CYAN)monitor$(RESET)          Open serial console (115200 baud) [optional: PORT=...]"
	@echo "  $(CYAN)flash-monitor$(RESET)    Flash firmware and immediately open serial monitor"
	@echo "  $(CYAN)clean-firmware$(RESET)   Clean PlatformIO build artifacts"
	@echo ""
	@echo "$(BOLD)Companion App (Capacitor 8 / React):$(RESET)"
	@echo "  $(CYAN)app-install$(RESET)      Install npm dependencies in app/"
	@echo "  $(CYAN)app-dev$(RESET)          Start local web development server (with Web Bluetooth)"
	@echo "  $(CYAN)app-build$(RESET)        Build production web bundle (Vite + TypeScript)"
	@echo "  $(CYAN)app-sync$(RESET)         Sync web assets with Capacitor Android & iOS"
	@echo "  $(CYAN)app-android$(RESET)      Open Android Studio project"
	@echo "  $(CYAN)app-ios$(RESET)          Open Xcode project (Swift Package Manager)"
	@echo "  $(CYAN)app-lint$(RESET)         Run frontend linter (oxlint)"
	@echo "  $(CYAN)clean-app$(RESET)        Clean app/dist directory"
	@echo ""
	@echo "$(BOLD)Project-wide & CI:$(RESET)"
	@echo "  $(CYAN)all$(RESET)              Build both firmware and companion web app"
	@echo "  $(CYAN)ci$(RESET)               Run full verification (firmware build + app lint & build)"
	@echo "  $(CYAN)clean$(RESET)            Clean all build artifacts (firmware & app)"
	@echo ""

# Firmware targets
build-firmware:
	@echo "$(BOLD)$(GREEN)==> Compiling ESP32-C3 firmware...$(RESET)"
	pio run

build-fw: build-firmware

build: build-firmware

flash:
	@echo "$(BOLD)$(GREEN)==> Flashing firmware to ESP32-C3...$(RESET)"
	pio run --target upload $(PIO_UPLOAD_FLAGS)

upload: flash

monitor:
	@echo "$(BOLD)$(CYAN)==> Opening serial monitor at $(BAUD) baud...$(RESET)"
	pio device monitor $(PIO_MONITOR_FLAGS)

flash-monitor: flash monitor

clean-firmware:
	@echo "$(BOLD)$(YELLOW)==> Cleaning PlatformIO build artifacts...$(RESET)"
	pio run --target clean

# App targets
app-install:
	@echo "$(BOLD)$(GREEN)==> Installing companion app dependencies...$(RESET)"
	cd app && npm install

app-dev:
	@echo "$(BOLD)$(CYAN)==> Starting companion app dev server...$(RESET)"
	cd app && npm run dev

app-build:
	@echo "$(BOLD)$(GREEN)==> Building companion app for production...$(RESET)"
	cd app && npm run build

app-sync: app-build
	@echo "$(BOLD)$(GREEN)==> Syncing web assets to Capacitor native platforms...$(RESET)"
	cd app && npx cap sync

app-android:
	@echo "$(BOLD)$(CYAN)==> Opening Android project in Android Studio...$(RESET)"
	cd app && npx cap open android

app-ios:
	@echo "$(BOLD)$(CYAN)==> Opening iOS project in Xcode...$(RESET)"
	cd app && npx cap open ios

app-lint:
	@echo "$(BOLD)$(GREEN)==> Linting companion app...$(RESET)"
	cd app && npm run lint

clean-app:
	@echo "$(BOLD)$(YELLOW)==> Cleaning companion app dist directory...$(RESET)"
	rm -rf app/dist

# Unified targets
all: build-firmware app-build
	@echo ""
	@echo "$(BOLD)$(GREEN)✔ Both firmware and companion app built successfully.$(RESET)"

clean: clean-firmware clean-app
	@echo "$(BOLD)$(GREEN)✔ Clean complete.$(RESET)"

ci: build-firmware app-lint app-build
	@echo ""
	@echo "$(BOLD)$(GREEN)✔ All CI verification checks passed.$(RESET)"
