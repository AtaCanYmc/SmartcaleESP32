# Mock / Simulation Mode Guide

[← Back to Documentation Index](README.md) | [← Back to Root Repository](../README.md)

The SmartcaleESP32 firmware includes a built-in **Mock / Simulation Mode** designed for rapid prototyping and integration testing of the companion mobile app and Bluetooth LE GATT stack without requiring physical sensors or peripherals (HX711 ADC, load cell, OLED display, or buttons) to be wired to the ESP32.

---

## Why Use Mock Mode?

* **Module-Free Development**: Test mobile app UI/UX, recipe workflows, calorie calculations, and BLE stability with just a bare ESP32-C3 board connected via USB.
* **Predictable Test Scenarios**: Inject specific weights or allow the firmware to cycle through automated test sequences.
* **Remote Tare Verification**: Validate that the mobile app's "Tare" button correctly resets net weight to `0.0g`.
* **Zero I2C Latency**: Automatically detects the absence of the SH1106 OLED display to prevent I2C bus timeout stalls.
* **Instant BLE Availability**: Bypasses the mandatory Wi-Fi setup captive portal on unconfigured chips, starting BLE advertising immediately.

---

## Configuration

Mock Mode is controlled by the `ENABLE_MOCK_SCALE` macro in [`include/config.h`](../include/config.h):

```cpp
// Simulation / Mock Mode (test without HX711/load cell connected)
#ifndef ENABLE_MOCK_SCALE
#define ENABLE_MOCK_SCALE true   // Set to true for mock testing, false for physical hardware
#endif
```

| Value | Behavior |
| :--- | :--- |
| `true` | **Active**: Generates synthetic weight telemetry; bypasses HX711 initialization and setup portal block. |
| `false` | **Production / Hardware Mode**: Requires physical HX711 and load cell. |

---

## Runtime Behavior & Control

When `ENABLE_MOCK_SCALE` is `true`, the firmware provides multiple interactive test mechanisms:

### 1. Automated Weight Cycle (Default)
If no manual Serial input is supplied, the scale automatically cycles through a demo progression every 4 seconds:
$$\text{Weight Sequence: } 0.0\,\text{g} \longrightarrow 45.5\,\text{g} \longrightarrow 128.2\,\text{g} \longrightarrow 250.0\,\text{g} \longrightarrow 375.4\,\text{g} \longrightarrow 0.0\,\text{g}$$

A subtle random jitter ($\pm 0.1\,\text{g}$) is dynamically injected during non-zero states to emulate natural load cell characteristics.

### 2. Interactive Serial Monitor Injection
You can override the weight at any moment by sending a number through the Serial Monitor (115200 baud):
* **Set Custom Weight**: Type any non-negative number and press Enter (e.g. `150` or `75.5`). The scale immediately locks to this gross weight.
* **Resume Auto-Cycle**: Send `-1` to return to the automatic 4-second cycling sequence.

```text
[MOCK] Manual weight set from Serial: 150.0g
[MOCK] Resumed auto demo weight cycle
```

### 3. Remote Tare Validation
When the companion mobile app sends a Tare command (`'T'` or `'t'` written to GATT characteristic `1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e`):
1. The firmware stores the current gross weight as `s_mockTareOffset`.
2. The transmitted net weight immediately drops to `0.0g`.
3. If additional weight is subsequently added, only the net delta is reported.

---

## Step-by-Step Testing Workflow

### 1. Flash Bare ESP32
Connect your bare ESP32-C3 board to your computer via USB (no breadboard or modules needed), then build and flash:

```bash
# Flash firmware and open Serial Monitor
make flash-monitor
```

You will observe the boot log:
```text
[BOOT] === Smartcale ESP32 Starting ===
[SCALE] === MOCK SCALE MODE ACTIVE ===
[SCALE] No hardware modules required. Type a weight (e.g. 150) in Serial Monitor to set weight manually, or -1 for auto-cycle.
[BLE] Advertising started as 'SmartKitchenScale'
```

### 2. Connect Mobile App
1. Open the Smartcale mobile application (or run `make app-dev` for the web interface in a Web Bluetooth capable browser like Chrome).
2. Tap **"Connect Scale"** and select **`SmartKitchenScale`**.
3. Observe live weight notifications arriving at 10 Hz (every 100ms).
4. Tap the **"Tare"** button in the app to verify zeroing functionality.

---

## Switching to Production Hardware

Once your physical modules (HX711, load cell, OLED display, push button) are soldered and assembled:

1. Open [`include/config.h`](../include/config.h).
2. Change `ENABLE_MOCK_SCALE` to `false`:
   ```cpp
   #define ENABLE_MOCK_SCALE false
   ```
3. Re-flash the device using `make flash`.
4. Follow the physical calibration procedure detailed in [Calibration & Troubleshooting Guide](calibration.md).
