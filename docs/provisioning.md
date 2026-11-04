# Wi-Fi Provisioning & Captive Portal

[← Back to Documentation Index](README.md) | [← Back to Root Repository](../README.md)

This document describes the captive portal provisioning system, SoftAP wireless network configuration, HTTP endpoints, DNS hijacking mechanics, and non-volatile storage (NVS) layout.

---

## Provisioning Architecture

When unconfigured or explicitly commanded by the user, the ESP32-C3 initiates a Wi-Fi Access Point (SoftAP) and launches an internal DNS and HTTP server. Client devices connecting to this access point are redirected to the configuration web interface.

```mermaid
stateDiagram-v2
    [*] --> BootCheck
    BootCheck --> NormalOperation : Wi-Fi Configured & Button Not Held
    BootCheck --> PortalMode : No Wi-Fi Saved OR Button Held > 2s

    state PortalMode {
        [*] --> StartSoftAP
        StartSoftAP --> StartDNS : Bind UDP Port 53
        StartDNS --> ScanWiFi : Scan 2.4GHz Networks
        ScanWiFi --> StartWebServer : Bind TCP Port 80
        StartWebServer --> ServingClients : Await User Input

        ServingClients --> ProcessSave : POST /save
        ServingClients --> ProcessReset : POST /reset

        ProcessSave --> CommitNVS : Write to Preferences
        ProcessReset --> ClearNVS : Clear Preferences

        CommitNVS --> DelayedReboot : Wait 1500ms
        ClearNVS --> DelayedReboot
        DelayedReboot --> [*]
    }

    PortalMode --> NormalOperation : ESP.restart()
```

---

## Activation Conditions

1. **First Boot (Automated)**:
   The firmware inspects NVS storage on startup. If no Wi-Fi SSID is stored (`storage.isConfigured() == false`), the device enters portal mode directly.
2. **Manual Button Hold**:
   During power-up, holding the physical Tare button (GPIO 2) for more than 2.0 seconds forces portal mode.

---

## Network & DNS Hijacking

### SoftAP Configuration
- **SSID**: `Smartcale-Setup`
- **Security**: Open (No WPA passphrase required for initial setup)
- **Local IP**: `192.168.4.1`
- **Subnet Mask**: `255.255.255.0`

### DNS Captive Portal Redirection
A lightweight DNS server listens on UDP port 53. It replies to every inbound domain query with the scale IP address (`192.168.4.1`). Operating systems detecting captive networks automatically open the login browser window.

### Captive Probe Endpoints
The embedded web server intercepts operating-system specific connectivity check requests and returns HTTP 302 redirects to `http://192.168.4.1/`:

| Probe Path | Target Operating System | Response Code | Action |
| :--- | :--- | :--- | :--- |
| `/hotspot-detect.html` | Apple iOS / macOS | 302 Found | Redirects to `/` |
| `/generate_204` | Google Android / Chromium | 302 Found | Redirects to `/` |
| `/ncsi.txt` | Microsoft Windows | 302 Found | Redirects to `/` |
| `/connecttest.txt` | Microsoft Windows | 302 Found | Redirects to `/` |
| `/*` (Catch-all) | Any unrecognized route | 302 Found | Redirects to `/` |

---

## Web Server API Endpoints

### 1. `GET /`
Renders the complete mobile-responsive HTML configuration page.

- **Dynamic Content**: Injects a live list of scanned 2.4GHz Wi-Fi networks sorted into an interactive select element.
- **Form Controls**:
  - Wi-Fi SSID selection or manual text override.
  - Wi-Fi WPA2 passphrase input.
  - Custom BLE device name input.
  - Load cell calibration factor floating point input.
  - Enable OLED Display checkbox (toggle I2C display updates on/off for headless use).
  - GPIO Pin Mapping: HX711 DT, HX711 SCK, Tare Button, OLED SDA, OLED SCL.
  - Save Settings submit button.
  - Factory Reset submit button.

### 2. `POST /save`
Processes submitted configuration parameters:

- Validates and sanitizes incoming fields: `ssid`, `pass`, `blename`, `cal`, `oled`, `pin_dt`, `pin_sck`, `pin_btn`, `pin_sda`, `pin_scl`.
- Commits values to non-volatile flash storage using ESP32 Preferences API.
- Renders a confirmation page indicating impending restart.
- Arm an asynchronous 1500ms software timer before triggering `ESP.restart()`.

### 3. `POST /reset`
Executes factory wipe:

- Clears all keys stored under the `"scale_cfg"` NVS namespace.
- Renders a factory reset confirmation page.
- Triggers `ESP.restart()` after 1500ms.

---

## NVS Storage Schema

Parameters persist across power cycles using the ESP32 Preferences flash storage library under namespace `"scale_cfg"`:

| Preference Key | Data Type | Maximum Length | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ssid` | String | 32 characters | `""` | Target Wi-Fi network SSID |
| `pass` | String | 64 characters | `""` | WPA/WPA2/WPA3 network password |
| `blename` | String | 32 characters | `"SmartKitchenScale"` | Advertised BLE device name |
| `cal` | Float | 4 bytes (IEEE 754) | `420.0f` | Load cell ADC to gram scaling divisor |
| `oled` | Boolean | 1 byte | `true` (`ENABLE_OLED`) | Controls whether OLED display updates are enabled |
| `pin_dt` | Integer | 4 bytes | `0` (`PIN_HX711_DT`) | HX711 ADC Data (DT) GPIO pin |
| `pin_sck` | Integer | 4 bytes | `1` (`PIN_HX711_SCK`) | HX711 ADC Clock (SCK) GPIO pin |
| `pin_btn` | Integer | 4 bytes | `2` (`PIN_TARE_BTN`) | Tare Button GPIO pin (active LOW) |
| `pin_sda` | Integer | 4 bytes | `8` (`PIN_I2C_SDA`) | OLED I2C SDA GPIO pin |
| `pin_scl` | Integer | 4 bytes | `9` (`PIN_I2C_SCL`) | OLED I2C SCL GPIO pin |
