# Firmware Architecture & Timing

[← Back to Documentation Index](README.md) | [← Back to Root Repository](../README.md)

This document describes the firmware architecture, interrupt handling, signal processing filters, and timing schedules implemented in the SmartcaleESP32 codebase.

---

## Architecture Overview

The firmware uses a single-threaded, cooperative scheduling model built on monotonic millisecond timestamps (`millis()`). It avoids FreeRTOS task overhead, critical section locks, and blocking delays in the main execution path.

```mermaid
flowchart TD
    START(["System Boot (setup)"]) --> INIT_HW["Initialize GPIO, I2C, Display, NVS, HX711"]
    INIT_HW --> PORTAL_CHECK{"Hold Button > 2s OR No Wi-Fi?"}
    PORTAL_CHECK -->|"Yes"| PORTAL_LOOP["Enter Captive Portal Mode"]
    PORTAL_CHECK -->|"No"| BLE_INIT["Start BLE GATT Server & Advertising"]
    BLE_INIT --> MAIN_LOOP["Enter Non-Blocking Loop"]

    subgraph Cooperative Scheduling Loop
        MAIN_LOOP --> TARE_CHECK{"g_tareRequested == true?"}
        TARE_CHECK -->|"Yes"| EXEC_TARE["scale.tare(), clear flag"]
        TARE_CHECK -->|"No"| HX_READY{"scale.is_ready() == true?"}
        EXEC_TARE --> HX_READY

        HX_READY -->|"Yes"| READ_HX["Read raw load cell units"]
        READ_HX --> APPLY_EMA["Apply EMA filter (alpha = 0.25)"]
        APPLY_EMA --> CHECK_DEAD["Apply deadband threshold (+/- 0.4g)"]
        HX_READY -->|"No"| TIME_CHECKS

        CHECK_DEAD --> TIME_CHECKS["Evaluate Interval Timers"]

        TIME_CHECKS --> BLE_TICK{"now - lastBle >= 100ms?"}
        BLE_TICK -->|"Yes"| SEND_BLE["Notify connected BLE client"]
        BLE_TICK -->|"No"| DISP_TICK{"now - lastDisp >= 200ms?"}
        SEND_BLE --> DISP_TICK

        DISP_TICK -->|"Yes"| DRAW_OLED["Render weight and BLE status"]
        DISP_TICK -->|"No"| MAIN_LOOP
        DRAW_OLED --> MAIN_LOOP
    end
```

---

## Core Subsystems

### 1. Interrupt Driven Tare Processing

Tare commands originate from either a physical button press or a remote BLE GATT write operation:

1. **Physical Button Press**: GPIO 2 falling edge triggers `tareISR()`. The ISR validates a 200ms debounce interval against `millis()`. If valid, it asserts the volatile flag `g_tareRequested = true`.
2. **BLE Remote Command**: Writing `'T'` or `'t'` to the command characteristic executes the characteristic callback, which sets `g_tareRequested = true`.
3. **Execution in Main Thread**: The main loop inspects `g_tareRequested`. If set, it executes `scale.tare()` and resets the flag. This keeps hardware bus communication out of interrupt service routines.

### 2. Signal Conditioning and Noise Rejection

Raw analog readings from strain gauges exhibit thermal drift and mechanical vibration. The firmware applies a two-stage filtering pipeline:

#### Exponential Moving Average (EMA)
Each time the HX711 signals data readiness (`scale.is_ready()`), the raw reading updates an exponential moving average register:

$$y_k = \alpha \cdot x_k + (1 - \alpha) \cdot y_{k-1}$$

Where:
- $x_k$ is the current instantaneous weight reading from the ADC.
- $y_{k-1}$ is the prior filtered state.
- $\alpha$ is the smoothing factor set to `0.25` in `include/config.h`.

An alpha of 0.25 suppresses high-frequency sensor noise while responding to significant weight changes in less than 300 milliseconds.

#### Idle Deadband Suppression
Small mechanical vibrations on empty scale platforms cause rapid jumping around zero (+/- 0.2g). If the absolute filtered value falls within the deadband limit, the firmware sets the displayed and transmitted weight to zero:

$$\text{Reported Weight} = \begin{cases} 0.0 & \text{if } |y_k| \le 0.4\,\text{g} \\ y_k & \text{otherwise} \end{cases}$$

### 3. Loop Scheduling Intervals

| Task | Interval | Evaluation Location | Description |
| :--- | :--- | :--- | :--- |
| **HX711 Polling** | Continuous / Asynchronous | `loop()` | Evaluates `scale.is_ready()` on every iteration without blocking |
| **BLE Notify** | 100 ms | Monotonic check | Pushes UTF-8 weight string to connected GATT subscriber |
| **Display Refresh** | 200 ms | Monotonic check | Redraws full SH1106 buffer (5 frames per second) |
| **Portal Polling** | Continuous | `loop()` | Processes DNS requests and HTTP requests when in configuration mode |
