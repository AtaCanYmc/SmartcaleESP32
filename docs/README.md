# Technical Documentation Index

[← Back to Root Repository](../README.md)

This directory provides in-depth technical documentation for the SmartcaleESP32 firmware, hardware schematics, communication interfaces, and runtime operation.

---

## Documentation Modules

| Document | Primary Focus | Key Contents |
| :--- | :--- | :--- |
| [Hardware Specification](hardware.md) | Electrical & Wiring | Pin mapping, HX711 wiring, I2C OLED, battery divider, buzzer circuitry |
| [Firmware Architecture](architecture.md) | Software Design & Flow | Non-blocking loop, GPIO interrupts, EMA filter, piecewise Li-Po model |
| [BLE GATT Protocol](ble_protocol.md) | Wireless Interface | Service and characteristic UUIDs, notification payloads, tare commands |
| [Provisioning & Web Portal](provisioning.md) | Initial Configuration | SoftAP captive portal, DNS redirection, NVS parameter persistence |
| [Calibration & Troubleshooting](calibration.md) | Sensor Adjustment | Load cell calibration formula, reference mass verification, issue diagnosis |

---

## System Subsystem Topology

The following diagram illustrates the hardware peripherals, core microcontroller interfaces, and external client connections:

```mermaid
flowchart TD
    subgraph Sensors and Power
        HX["HX711 24-bit ADC"] -->|"DT: GPIO 0, SCK: GPIO 1"| MCU["ESP32-C3 Super Mini"]
        BAT["1S Li-Po Battery"] -->|"100k/100k Divider"| ADC["GPIO 3 (ADC1_CH3)"]
        ADC --> MCU
    end

    subgraph User Interface
        BTN["Tare Tactile Button"] -->|"Active Low: GPIO 2"| MCU
        MCU -->|"I2C: SDA 8, SCL 9"| OLED["SH1106 128x64 OLED"]
        MCU -->|"LEDC PWM: GPIO 4"| BUZ["Piezo Buzzer"]
    end

    subgraph Wireless Telemetry
        MCU -->|"BLE GATT Server"| APP["Mobile / Web App"]
        MCU -->|"SoftAP HTTP 192.168.4.1"| PORTAL["Captive Web Portal"]
    end
```

---

## Architectural Principles

1. **Non-blocking Execution**: The firmware operates without blocking delay functions. All sensor polling, screen updates, and communication tasks evaluate monotonically increasing millisecond timers.
2. **Deterministic Tare via Hardware Interrupt**: Tare button presses register on a dedicated falling-edge interrupt handler with hardware-debounced validation.
3. **Calibrated Li-Po Telemetry**: Battery voltage readings pass through an 11-point piecewise linear interpolation algorithm to match the non-linear discharge plateau of 1S lithium polymer cells.
4. **Zero-Configuration SoftAP**: Unconfigured units broadcast an open setup access point with captive DNS redirection on port 53.
