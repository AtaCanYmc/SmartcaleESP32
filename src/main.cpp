/**
 * @file main.cpp
 * @brief Smart Kitchen Scale - Main Controller with Wi-Fi AP Provisioning
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HX711.h>
#include <math.h>

#include "config.h"
#include "storage.h"
#include "buzzer.h"
#include "battery.h"
#include "display.h"
#include "ble_scale.h"
#include "portal.h"

// =============================================================================
// Operating Mode & Global State
// =============================================================================
static bool g_setupMode = false;
static AppConfig g_appConfig;

static HX711 scale;
static volatile bool g_tareRequested = false;
static volatile unsigned long g_lastTareInterruptMs = 0;

static float g_filteredWeight = 0.0f;
static float g_displayWeight = 0.0f;
static uint8_t g_batteryPercent = 100;

static unsigned long g_lastDisplayMs = 0;
static unsigned long g_lastBleMs     = 0;
static unsigned long g_lastBatteryMs = 0;

// =============================================================================
// Hardware ISR & Tare Handler
// =============================================================================
void IRAM_ATTR onTareButtonISR() {
    unsigned long now = millis();
    if (now - g_lastTareInterruptMs >= 200) {
        g_tareRequested = true;
        g_lastTareInterruptMs = now;
    }
}

void triggerTareFromBle() {
    g_tareRequested = true;
}

// =============================================================================
// Setup & Loop
// =============================================================================
void setup() {
    Serial.begin(115200);

    // 1. Check if Tare button is held down at power-on to force setup mode
    pinMode(PIN_TARE_BTN, INPUT_PULLUP);
    bool forceSetupMode = false;
    if (digitalRead(PIN_TARE_BTN) == LOW) {
        unsigned long holdStart = millis();
        while (digitalRead(PIN_TARE_BTN) == LOW) {
            if (millis() - holdStart >= HOLD_TO_SETUP_MS) {
                forceSetupMode = true;
                break;
            }
            delay(10);
        }
    }

    // 2. Initialize Core Hardware
    initBuzzer();
    initBattery();
    initDisplay();

    // 3. Load Persistent Configuration from NVS
    bool isConfigured = ConfigStorage::load(g_appConfig);

    // 4. Branch to Captive Portal AP Setup if unconfigured or requested
    if (forceSetupMode || !isConfigured) {
        g_setupMode = true;
        ConfigPortal::begin(g_appConfig);
        g_batteryPercent = getBatteryPercent();
        renderConfigPortal(SETUP_AP_SSID, ConfigPortal::getApIp().toString().c_str(), g_batteryPercent);
        Serial.println("Started Wi-Fi Setup AP Mode.");
        return;
    }

    // 5. Normal Scale Operation Mode
    attachInterrupt(digitalPinToInterrupt(PIN_TARE_BTN), onTareButtonISR, FALLING);
    initBle(g_appConfig.bleName.c_str(), triggerTareFromBle);

    // Optional background Wi-Fi connection
    if (g_appConfig.wifiSsid.length() > 0) {
        WiFi.mode(WIFI_STA);
        WiFi.begin(g_appConfig.wifiSsid.c_str(), g_appConfig.wifiPass.c_str());
    }

    // HX711 Setup with stored calibration factor
    scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
    scale.set_scale(g_appConfig.calibrationFactor);

    // Initial boot tare (wait up to 1.5s for sensor ready)
    unsigned long bootStart = millis();
    while (!scale.is_ready() && (millis() - bootStart < 1500)) {
        delay(10);
    }
    if (scale.is_ready()) {
        scale.tare(10);
    }

    g_batteryPercent = getBatteryPercent();
    beepBoot();
    Serial.println("Smart Kitchen Scale initialized in normal weighing mode.");
}

void loop() {
    // -------------------------------------------------------------------------
    // Mode A: Captive Portal Configuration Loop
    // -------------------------------------------------------------------------
    if (g_setupMode) {
        ConfigPortal::handle();

        unsigned long now = millis();
        if (now - g_lastDisplayMs >= INTERVAL_DISPLAY_MS) {
            g_lastDisplayMs = now;
            g_batteryPercent = getBatteryPercent();
            renderConfigPortal(SETUP_AP_SSID, ConfigPortal::getApIp().toString().c_str(), g_batteryPercent);
        }
        return;
    }

    // -------------------------------------------------------------------------
    // Mode B: Normal Weighing & Telemetry Loop
    // -------------------------------------------------------------------------
    unsigned long now = millis();

    // 1. Process Pending Tare Request
    if (g_tareRequested) {
        g_tareRequested = false;
        if (scale.is_ready()) {
            scale.tare(5);
        } else {
            scale.set_offset(scale.read());
        }
        g_filteredWeight = 0.0f;
        g_displayWeight = 0.0f;
        beepTare();
    }

    // 2. Read Weight Non-Blockingly
    if (scale.is_ready()) {
        float raw = scale.get_units(1);
        g_filteredWeight = (FILTER_ALPHA * raw) + ((1.0f - FILTER_ALPHA) * g_filteredWeight);
        g_displayWeight = (fabs(g_filteredWeight) <= DEADBAND_GRAMS) ? 0.0f : g_filteredWeight;
    }

    // 3. BLE Notification (100ms)
    if (now - g_lastBleMs >= INTERVAL_BLE_NOTIFY_MS) {
        g_lastBleMs = now;
        notifyBleWeight(g_displayWeight);
    }

    // 4. Battery Level Monitoring (3000ms)
    if (now - g_lastBatteryMs >= INTERVAL_BATTERY_MS) {
        g_lastBatteryMs = now;
        g_batteryPercent = getBatteryPercent();
    }

    // 5. Display Update (200ms)
    if (now - g_lastDisplayMs >= INTERVAL_DISPLAY_MS) {
        g_lastDisplayMs = now;
        renderDisplay(g_displayWeight, isBleConnected(), g_batteryPercent);
    }
}
