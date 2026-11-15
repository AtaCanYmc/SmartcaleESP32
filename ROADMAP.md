# Project Roadmap

Milestones and engineering objectives for the SmartcaleESP32 firmware and companion ecosystem.

## Version 1.0.0 (Completed)

- [x] Non-blocking ESP32-C3 firmware architecture using `millis()` dispatch loops.
- [x] Hardware interrupt-driven tare button with software debouncing on GPIO 2.
- [x] HX711 24-bit ADC integration with exponential moving average filtering (alpha = 0.25) and 0.4g deadband clamping.
- [x] 1.3-inch SH1106 I2C OLED interface with BLE connection indicator.
- [x] BLE GATT server providing 100ms weight notifications and remote tare write commands.
- [x] Non-volatile storage (NVS / Preferences) for Wi-Fi credentials, BLE name, and calibration parameters.
- [x] Wi-Fi SoftAP (`Smartcale-Setup`) and mobile-responsive captive portal web configurator.

## Version 1.1.0 (Completed)

- [x] Release Please automated changelog generation and semantic release tagging.
- [x] Unified `Makefile` commands for local firmware compilation and companion app orchestration.
- [x] Technical documentation suite (`docs/`) for architecture, hardware, calibration, and BLE protocols.
- [x] Custom PlatformIO upload scripts with USB CDC auto-reset.

## Version 1.2.0 (Completed)

- [x] Capacitor 8 cross-platform companion application (Vite, React 19, TypeScript).
- [x] Open Food Facts integration with barcode scanner support (`@zxing/library`).
- [x] Daily nutrition diary with macro breakdown, meal logging, and calendar date selection.
- [x] Unit conversions (grams, ounces, pounds, milliliters, fluid ounces).
- [x] Custom Food REST API configuration with parallel search and bearer token authentication.

## Version 1.3.0 (Current)

- [x] In-browser firmware installer and serial diagnostic console (`web-flasher/`) via Web Serial API.
- [x] Interactive multi-language Calibration Wizard with live BLE calibration factor writes.
- [x] Interactive Recipe & Mixing Mode with automated tare workflows and nutritional yield calculation.
- [x] Hardware-free Mock Mode with serial injection and synthetic weight generation for client testing.
- [x] Web color-scheme synchronization (`<meta name="color-scheme">` and CSS `:has()` theme integration).

## Version 1.4.0 (Planned)

- [ ] Over-the-Air (OTA) firmware binary update over local Wi-Fi and Web Serial flasher.
- [ ] Deep sleep power management with wake-on-interrupt when idle for more than 5 minutes.
- [ ] Pour-over coffee timer mode directly on the SH1106 OLED interface.

## Version 2.0.0 (Backlog)

- [ ] Multi-point non-linear calibration curve with quadratic compensation.
- [ ] Multi-load cell summing bridge support for commercial pan scales.
