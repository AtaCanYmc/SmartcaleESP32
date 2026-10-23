# Calibration & Troubleshooting

[← Back to Documentation Index](README.md) | [← Back to Root Repository](../README.md)

This document details the mathematical derivation, step-by-step physical calibration procedure, and troubleshooting matrix for the SmartcaleESP32 load cell subsystem.

---

## Load Cell Calibration Theory

The HX711 24-bit ADC converts differential millivolt signals from a strain gauge bridge into raw digital integer units.

The conversion from raw ADC values to physical mass in grams follows a linear response:

$$\text{Weight (grams)} = \frac{\text{Raw Reading} - \text{Zero Offset}}{\text{Calibration Factor}}$$

Where:
- $\text{Raw Reading}$ is the current 24-bit value from the load cell ADC.
- $\text{Zero Offset}$ is the tare offset captured when the platform is empty.
- $\text{Calibration Factor}$ is the scaling divisor representing raw units per gram.

---

## Step-by-Step Calibration Procedure

Calibration requires a reference weight of certified mass (e.g. 100g, 200g, or 500g).

### Method A: Web Portal (Runtime, No Reflashing Required)

1. Power on the scale while holding the Tare button for 2 seconds to enter the setup portal.
2. Connect to Wi-Fi network `SmartScale-Setup` on a phone or laptop.
3. Open `http://192.168.4.1` in the browser.
4. Set the **Calibration Factor** input field to `1.0` and click **Save Settings**. The scale will reboot.
5. Place the scale on a rigid, level surface with no weight on the platter. Power on and wait for the display to settle at `0.0g`.
6. Place the known reference weight (e.g. $500.0\,\text{g}$) precisely in the center of the platform.
7. Record the displayed reading ($R_{\text{raw}}$).
8. Calculate the target calibration factor:
   $$\text{Factor} = \frac{R_{\text{raw}}}{M_{\text{known}}}$$
   *Example: If a 500.0g weight displays 210000.0 with factor 1.0:*
   $$\text{Factor} = \frac{210000.0}{500.0} = 420.0$$
9. Hold the Tare button to re-enter the web portal, enter the calculated factor (`420.0`), and save.

### Method B: Firmware Compile-Time Default

1. Open `include/config.h`.
2. Locate the calibration definition:
   ```cpp
   constexpr float CALIBRATION_FACTOR = 420.0f;
   ```
3. Update the value with your calculated calibration factor.
4. Flash the firmware via PlatformIO:
   ```bash
   pio run --target upload
   ```

---

## Troubleshooting Matrix

| Symptom | Root Cause | Remediation |
| :--- | :--- | :--- |
| **Weight drifts continuously** | Mechanical flex, loose screws, or thermal gradients | Ensure the load cell is bolted to a rigid base. Tighten mounting screws to standard torque. Allow 60 seconds after power-on for thermal stabilization. |
| **Random weight spikes / noise** | High-frequency electromagnetic interference on DT/SCK lines | Shorten the wire runs between HX711 and ESP32-C3. Twist the DT and SCK wires together. Place a 0.1uF ceramic decoupling capacitor across HX711 VCC and GND. |
| **OLED display fails to initialize** | Missing I2C pull-up resistors or incorrect GPIO mapping | Verify SDA connects to GPIO 8 and SCL connects to GPIO 9. Verify the display is supplied with 3.3V. If using a bare OLED without onboard pull-ups, install 4.7k Ohm resistors from SDA and SCL to 3.3V. |
| **Tare button does not trigger** | Pin floating or bad grounding | Verify the tactile switch connects GPIO 2 directly to GND. The firmware configures internal pull-up (`INPUT_PULLUP`). |
| **No serial output on USB** | USB CDC port not enumerated on ESP32-C3 boot | Confirm `platformio.ini` includes `-D ARDUINO_USB_CDC_ON_BOOT=1` and `-D ARDUINO_USB_MODE=1`. When opening the terminal, allow 1 second for CDC re-enumeration. |
| **PlatformIO upload fails with Python 3.14** | `esptool` internal package incompatibilities with Python 3.14 | Use the configured `upload_command` in `platformio.ini` which routes through the system `python3 -m esptool` runner. |
| **BLE connection drops immediately** | Insufficient supply voltage during RF peak currents | ESP32-C3 RF transmissions draw up to 280mA current spikes. Add a 100uF electrolytic or tantalum capacitor across the 3.3V and GND power rails. |
