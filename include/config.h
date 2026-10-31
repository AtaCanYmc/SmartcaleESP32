#pragma once
#include <Arduino.h>

// Hardware Pin Definitions
static constexpr uint8_t PIN_HX711_DT     = 0;
static constexpr uint8_t PIN_HX711_SCK    = 1;
static constexpr uint8_t PIN_TARE_BTN     = 2;
static constexpr uint8_t PIN_I2C_SDA      = 8;
static constexpr uint8_t PIN_I2C_SCL      = 9;

// Calibration & Filter Defaults
static constexpr float DEFAULT_CALIBRATION_FACTOR = 420.0f; // Raw counts per gram
static constexpr float FILTER_ALPHA               = 0.25f;  // Exponential moving average weight
static constexpr float DEADBAND_GRAMS             = 0.40f;  // [-0.4g, +0.4g] clamped to 0.0g

// Simulation / Mock Mode (test without HX711/load cell connected)
#ifndef ENABLE_MOCK_SCALE
#define ENABLE_MOCK_SCALE true
#endif

// Loop Timing (ms)
static constexpr unsigned long INTERVAL_BLE_NOTIFY_MS = 100;
static constexpr unsigned long INTERVAL_DISPLAY_MS    = 200;
static constexpr unsigned long HOLD_TO_SETUP_MS       = 2000; // Hold Tare button on boot to force AP mode

// Setup AP & Storage
#define SETUP_AP_SSID              "Smartcale-Setup"
#define NVS_NAMESPACE              "scale_cfg"

// BLE GATT Profile
#define DEFAULT_BLE_NAME           "SmartKitchenScale"
#define SERVICE_UUID               "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_WEIGHT_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_CMD_UUID    "1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e"
