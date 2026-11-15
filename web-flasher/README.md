# Smartcale Web Flasher & Serial Diagnostics

[← Back to Root Repository](../README.md)

In-browser firmware installer and live serial diagnostic console for the ESP32-C3 Smartcale kitchen scale.

---

## Capabilities

- **Zero-Install Web Flashing**: Installs firmware directly from the browser using the Web Serial API and ESP Web Tools.
- **Pre-Compiled Binaries**: Flashes bootloader, partition table, and application binaries without requiring PlatformIO or Python locally.
- **Live Serial Console**: Provides bi-directional serial terminal communication at 115200 baud for telemetry inspection and calibration factor adjustment.
- **Multi-Language Support**: Complete interface localization across 8 languages powered by `i18n.js`.
- **Adaptive Color Scheme**: Synchronizes with browser `<meta name="color-scheme">` and system light/dark mode preferences.

---

## Browser Compatibility

Web Serial API support is required to communicate with the USB-CDC interface:

| Browser | Supported Platforms | Status |
| :--- | :--- | :--- |
| Google Chrome | macOS, Windows, Linux, ChromeOS | Fully Supported (v89+) |
| Microsoft Edge | macOS, Windows, Linux | Fully Supported (v89+) |
| Opera | macOS, Windows, Linux | Fully Supported |
| Brave | macOS, Windows, Linux | Supported (enable Web Serial in flags if blocked) |
| Mozilla Firefox | All | Not Supported (lacks Web Serial API) |
| Apple Safari | All | Not Supported (lacks Web Serial API) |

---

## Local Development & Testing

Serve the web flasher locally using Python or the repository Makefile:

```bash
# Using Makefile (builds firmware binaries and starts HTTP server on port 8080)
make flasher-dev

# Alternatively, using Python directly:
cd web-flasher
python3 -m http.server 8080
```

Open `http://localhost:8080` in a supported browser.

---

## Memory Offset Layout

The web flasher programs the ESP32-C3 flash memory using the standard Espressif partition offsets:

| Binary Artifact | Flash Address | Description |
| :--- | :--- | :--- |
| `bootloader.bin` | `0x0000` | Second-stage bootloader |
| `partitions.bin` | `0x8000` | Partition table definition |
| `firmware.bin` | `0x10000` | Smartcale application firmware |

---

## License

This component is part of the SmartcaleESP32 project and is licensed under the [Apache-2.0 License](../LICENSE).
