#pragma once
#include <Arduino.h>

// =============================================================================
// Hardware Pin Definitions
// =============================================================================
static constexpr uint8_t PIN_HX711_DT     = 0;  // Load Cell Data
static constexpr uint8_t PIN_HX711_SCK    = 1;  // Load Cell Clock
static constexpr uint8_t PIN_TARE_BTN     = 2;  // Hardware Tare Button (INPUT_PULLUP)
static constexpr uint8_t PIN_BATTERY_ADC  = 3;  // Li-Po Voltage Divider (ADC1_CH3)
static constexpr uint8_t PIN_BUZZER       = 4;  // Piezo Buzzer (PWM Tone)
static constexpr uint8_t PIN_I2C_SDA      = 8;  // OLED I2C SDA
static constexpr uint8_t PIN_I2C_SCL      = 9;  // OLED I2C SCL

// =============================================================================
// Default Calibration & Filter Constants
// =============================================================================
static constexpr float DEFAULT_CALIBRATION_FACTOR = 420.0f; // Scale factor: raw / reference grams
static constexpr float FILTER_ALPHA               = 0.25f;  // Exponential Moving Average weight
static constexpr float DEADBAND_GRAMS             = 0.40f;  // [-0.4g, +0.4g] clamped to 0.0g

// =============================================================================
// Loop Timing Intervals (milliseconds)
// =============================================================================
static constexpr unsigned long INTERVAL_BLE_NOTIFY_MS = 100;
static constexpr unsigned long INTERVAL_DISPLAY_MS    = 200;
static constexpr unsigned long INTERVAL_BATTERY_MS    = 3000;
static constexpr unsigned long HOLD_TO_SETUP_MS       = 2000; // Hold Tare btn on boot for setup

// =============================================================================
// Setup AP & Storage Configuration
// =============================================================================
#define SETUP_AP_SSID              "SmartScale-Setup"
#define NVS_NAMESPACE              "scale_cfg"

// =============================================================================
// BLE GATT Configuration
// =============================================================================
#define DEFAULT_BLE_NAME           "SmartKitchenScale"
#define SERVICE_UUID               "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_WEIGHT_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_CMD_UUID    "1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e"
