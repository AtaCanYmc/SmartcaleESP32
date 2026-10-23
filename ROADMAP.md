# Project Roadmap

Milestones and upcoming engineering objectives for the ESP32-C3 Smart Kitchen Scale firmware.

## Version 1.0.0 (Current)

- [x] Non-blocking ESP32-C3 firmware architecture using `millis()` dispatch loops.
- [x] Hardware interrupt-driven tare button with software debouncing.
- [x] HX711 24-bit ADC integration with exponential moving average filtering and 0.4g deadband clamping.
- [x] 1.3-inch SH1106 I2C OLED interface with BLE connection indicator.
- [x] BLE GATT server providing 100ms weight notifications and remote tare write commands.
- [x] Non-volatile storage (NVS / Preferences) for Wi-Fi credentials, BLE name, and calibration parameters.
- [x] Wi-Fi SoftAP (`SmartScale-Setup`) and mobile-responsive captive portal web configurator.

## Version 1.1.0 (Planned)

- [ ] Interactive two-point calibration routine executable over serial console or web portal.
- [ ] Deep sleep power management with wake-on-interrupt when scale is idle for 5 minutes.

## Version 1.2.0 (Planned)

- [ ] Unit switching between grams, ounces, and milliliters.
- [ ] Over-the-Air (OTA) firmware update support over BLE.
- [ ] Timer mode for pour-over coffee workflows on the OLED interface.
