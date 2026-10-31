# Changelog

## [1.3.0](https://github.com/AtaCanYmc/SmartcaleESP32/compare/smartscale-esp32-v1.2.0...smartscale-esp32-v1.3.0) (2026-10-31)


### Features

* add interactive Calibration Wizard with live BLE calibration sync and 8-language support ([5595fb8](https://github.com/AtaCanYmc/SmartcaleESP32/commit/5595fb855f4ce2881db007647b7cb692ae5c7048))
* enhance BLE connection handling with automatic reconnect and improved callbacks ([a193213](https://github.com/AtaCanYmc/SmartcaleESP32/commit/a193213076f2b1c8703c89b3a8ffbbd00a7140e1))
* **flasher:** refactor flasher ([b097ce2](https://github.com/AtaCanYmc/SmartcaleESP32/commit/b097ce25e98550ead1d72ce1b493622b6d4b2d8a))
* **mock:** add configurable jitter option for Mock Mode to simulate sensor noise ([3c9b1a6](https://github.com/AtaCanYmc/SmartcaleESP32/commit/3c9b1a69519fc3782a61cb3b8026ee16d61400aa))
* **mock:** add Mock Mode for hardware-free testing with synthetic weight injection and serial control ([0d08a87](https://github.com/AtaCanYmc/SmartcaleESP32/commit/0d08a87a5d1c9471956a46485c7a214d19af5825))
* **mock:** enhance Mock Mode with configurable weight steps and dynamic interval adjustment ([d449e1f](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d449e1f0b625c95b700a6ccd06836070b4922343))
* **recipe:** add interactive Recipe & Mixing Mode with auto-tare workflow, portion nutrition, and AI prompt sharing ([d8c2d2c](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d8c2d2cec78f96555cc5d5157882c965ad51131d))
* **scanner:** integrate @zxing/library for universal cross-platform barcode scanning with torch and code-splitting ([be80193](https://github.com/AtaCanYmc/SmartcaleESP32/commit/be80193aa549ca3304947e69f3849a6c5a7031ba))
* **ui:** add BLE auto-reconnect banners, retry action, and lifecycle tests ([7f1bc8d](https://github.com/AtaCanYmc/SmartcaleESP32/commit/7f1bc8dd831068096207f81a274125d08eacd022))
* **web-flasher:** add web flasher deployment workflow and initial HTML setup for firmware installation ([d53b602](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d53b6022d7070b45dac03911e245d0df556a456a))


### Bug Fixes

* **deploy:** enhance caching for PlatformIO packages and pip in deployment workflow ([e89b02b](https://github.com/AtaCanYmc/SmartcaleESP32/commit/e89b02b5ab1e9ab85a374a94132a78c70a42921f))
* **ui:** define .modal-header with flexbox alignment and flex-shrink: 0 to prevent close buttons from wrapping ([cfa3983](https://github.com/AtaCanYmc/SmartcaleESP32/commit/cfa39839f3ee1b92a68304b4b877ac8d68e6da21))
* **ui:** eliminate modal shifting in calibration wizard with stable height, grid alignment, and stepper connector ([e50aac2](https://github.com/AtaCanYmc/SmartcaleESP32/commit/e50aac28b826ad345be02cb3152159c3941473bc))

## [1.2.0](https://github.com/AtaCanYmc/SmartcaleESP32/compare/smartscale-esp32-v1.1.0...smartscale-esp32-v1.2.0) (2026-10-25)


### Features

* add AI prompt sharing functionality and improve calendar utilities ([d96c1d6](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d96c1d6ae3ff24b41e9e12decfd21ab0542c3b9f))
* add calendar modal for date selection and home search functionality ([d71cac7](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d71cac7e86f64b64d0230d3103c1ce3733524264))
* add data export functionality and update license to Apache 2.0 ([f92c3c0](https://github.com/AtaCanYmc/SmartcaleESP32/commit/f92c3c0422a1e2ac953dd035ea92c1f8eb960102))
* add food search and barcode scanning functionality in App component ([8292ccb](https://github.com/AtaCanYmc/SmartcaleESP32/commit/8292ccb837f295251694949ae9f8bb385771727d))
* add food search functionality with barcode scanning and product upload to Open Food Facts ([07a574f](https://github.com/AtaCanYmc/SmartcaleESP32/commit/07a574f3bf64ad7fa2e8ac12c497250d96cbc683))
* add initial configuration files for Capacitor app and update web manifest ([54a9577](https://github.com/AtaCanYmc/SmartcaleESP32/commit/54a95779b56acaa775419c89fe8e645de6490913))
* add settings modal for theme and language selection in App component ([29fd544](https://github.com/AtaCanYmc/SmartcaleESP32/commit/29fd54453430c81bc7ee0ee8146b05ae72291aa7))
* enhance accessibility and usability in App component with keyboard navigation and ARIA roles ([c94dfca](https://github.com/AtaCanYmc/SmartcaleESP32/commit/c94dfcaf019b0c452220546af0983f459682d955))
* enhance food service with improved API integration and proxy setup ([96ae76e](https://github.com/AtaCanYmc/SmartcaleESP32/commit/96ae76e106617c214198a85f5fc2985af0095cd3))
* enhance nutritional information display with 2 decimal precision and add macro chips ([e89288f](https://github.com/AtaCanYmc/SmartcaleESP32/commit/e89288f7950e49ead59a652add821f734d13ced1))
* implement language selection and theme toggle in App component ([3a6757c](https://github.com/AtaCanYmc/SmartcaleESP32/commit/3a6757cedfd0f0367c71dc152f9a6def7c2774a8))
* implement meal logging and diary functionality with UI updates ([83f085b](https://github.com/AtaCanYmc/SmartcaleESP32/commit/83f085beb5f911955d5a7778f0c95eeb6883736d))
* implement mobile bottom navigation and enhance calorie precision in food service ([da2e6f3](https://github.com/AtaCanYmc/SmartcaleESP32/commit/da2e6f3b7b3f5490295795f46e2636f43672c632))
* update display strings for Bluetooth and setup mode to English ([a95d635](https://github.com/AtaCanYmc/SmartcaleESP32/commit/a95d635f06e90694a54359fce4ebb9eff2cf9b69))
* update padding and viewport settings for improved layout and responsiveness ([45199fb](https://github.com/AtaCanYmc/SmartcaleESP32/commit/45199fb4bac6e179090d0b972ecfa0cf5abc5700))
* update settings modal with Bluetooth and Wi-Fi configuration sections ([4ca9730](https://github.com/AtaCanYmc/SmartcaleESP32/commit/4ca9730bb8f5ce47a99c91a963ddc887297e894d))


### Bug Fixes

* correct spelling of "SmartScale" to "Smartcale" in multiple files and update theme colors in web manifest ([8566d3c](https://github.com/AtaCanYmc/SmartcaleESP32/commit/8566d3c94db2eb11c921f48f42c30c63048a5676))

## [1.1.0](https://github.com/AtaCanYmc/SmartcaleESP32/compare/smartscale-esp32-v1.0.0...smartscale-esp32-v1.1.0) (2026-10-25)


### Features

* add configuration files for Release Please and CI workflows ([1245c84](https://github.com/AtaCanYmc/SmartcaleESP32/commit/1245c84c4775d0b7a944af224b25fdd1b4ebd9ba))
* add custom upload command for ESP32C3 in platformio configuration ([7869fdb](https://github.com/AtaCanYmc/SmartcaleESP32/commit/7869fdb259f33d74f74749dfc38b52aee683803c))
* add initial firmware files for Smart Kitchen Scale including battery management, BLE support, and display rendering ([41acc8f](https://github.com/AtaCanYmc/SmartcaleESP32/commit/41acc8fae38e5649be71cb9a87513a357a25d518))
* add logging functionality for boot, Wi-Fi, and scale operations ([294a9ac](https://github.com/AtaCanYmc/SmartcaleESP32/commit/294a9acc9aafe4007d85e141ae85ef56d39d9b84))
* add Makefile for unified build automation of firmware and companion app ([3d2b88e](https://github.com/AtaCanYmc/SmartcaleESP32/commit/3d2b88ee7560e83b93b8558b3e9d68420035c816))
* add technical documentation for firmware architecture, BLE protocol, calibration, hardware specs, and provisioning ([18bfa9b](https://github.com/AtaCanYmc/SmartcaleESP32/commit/18bfa9ba7d373e4f4ba3dcc5bea5076419e7f574))
* implement Wi-Fi provisioning with captive portal for configuration and add BLE name customization ([4caa6a7](https://github.com/AtaCanYmc/SmartcaleESP32/commit/4caa6a7c885cc5d2de6f08a5a35bdb15cdaeedf6))
* initialize Capacitor app structure and add basic configurations ([f8ca94a](https://github.com/AtaCanYmc/SmartcaleESP32/commit/f8ca94a48cc26016f20b521c408da23fc3317b19))
* open Preferences in read/write mode to create namespace if absent ([4ed74d4](https://github.com/AtaCanYmc/SmartcaleESP32/commit/4ed74d4d7c066b646af4fb22fe659b578ac55b2f))
* remove upload speed and flags from platformio configuration ([7f7429a](https://github.com/AtaCanYmc/SmartcaleESP32/commit/7f7429a2d9528af7cfb672f4bf52399a44a8f0c3))
* simplify tare execution flow and remove buzzer references from documentation ([6596003](https://github.com/AtaCanYmc/SmartcaleESP32/commit/6596003d4421f186bbc543ef910ffa776abf2459))
* update BLE command handling and platformio configuration for ESP32-C3 ([27a4cc2](https://github.com/AtaCanYmc/SmartcaleESP32/commit/27a4cc2fa41857ae1578f00e4fedc6bfd2b1ab8a))
* update CI and release workflows to cache PlatformIO packages and pip ([08cb1fb](https://github.com/AtaCanYmc/SmartcaleESP32/commit/08cb1fb142a859b65f739fdcbedd494a4f3c44d9))
* update platformio configuration for improved upload settings and flash mode ([d7574e2](https://github.com/AtaCanYmc/SmartcaleESP32/commit/d7574e2d3a997eb05ee710ee889d720e8c5acfee))
