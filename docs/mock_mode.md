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

Mock Mode parameters are centrally configured in [`include/config.h`](../include/config.h):

```cpp
// Simulation / Mock Mode (test without HX711/load cell connected)
#ifndef ENABLE_MOCK_SCALE
#define ENABLE_MOCK_SCALE true   // Set to true for mock testing, false for physical hardware
#endif

// Mock Mode Parameters (time duration per step & weight values)
static constexpr unsigned long MOCK_STEP_INTERVAL_MS = 4000; // Duration (ms) per weight step
static constexpr bool MOCK_ENABLE_JITTER              = false; // Set true for +/-0.1g random sensor noise
static constexpr float MOCK_WEIGHT_STEPS[] = {
    0.0f,     // Empty scale
    45.5f,    // Small ingredient (e.g. espresso shot, spices)
    128.2f,   // Medium item (e.g. apple, cup of flour)
    250.0f,   // Standard container / liquid
    375.4f,   // Heavier meal portion
    0.0f      // Tare / removed item
};
static constexpr size_t MOCK_WEIGHT_STEPS_COUNT = sizeof(MOCK_WEIGHT_STEPS) / sizeof(MOCK_WEIGHT_STEPS[0]);
```

### Dynamic Customization:
* **Change Transition Time**: Modify `MOCK_STEP_INTERVAL_MS` (e.g., change `4000` to `2000` for 2-second fast transitions).
* **Change Weight Targets**: Add, remove, or modify values inside `MOCK_WEIGHT_STEPS[]`. The step count `MOCK_WEIGHT_STEPS_COUNT` automatically adapts.

---

## Runtime Behavior & Control

When `ENABLE_MOCK_SCALE` is `true`, the firmware provides multiple interactive test mechanisms:

### 1. Automated Weight Cycle (Config-Driven)
The scale steps through each weight in `MOCK_WEIGHT_STEPS` at the interval specified by `MOCK_STEP_INTERVAL_MS`. A subtle random jitter ($\pm 0.1\,\text{g}$) is dynamically injected during non-zero states to emulate natural load cell characteristics.

### 2. Interactive Serial Monitor Controls
You can interact with the mock runner in real time over Serial (115200 baud):
* **Set Custom Weight**: Type any positive number (e.g., `150` or `75.5`) and press Enter to fix the weight to that value.
* **Dynamically Adjust Cycle Speed**: Type `i<ms>` (e.g., `i2000` for 2 seconds, `i500` for 500ms) to change step duration on the fly without re-flashing!
* **Resume Auto-Cycle**: Send `-1` to return to automatic step progression.

```text
[MOCK] Manual weight set from Serial: 150.0g
[MOCK] Step interval updated to 2000ms
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
