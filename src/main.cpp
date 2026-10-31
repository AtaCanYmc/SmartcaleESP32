/**
 * @file main.cpp
 * @brief Smart Kitchen Scale - Main Controller with Wi-Fi AP Provisioning
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HX711.h>
#include <math.h>

#include "config.h"
#include "logger.h"
#include "storage.h"
#include "display.h"
#include "ble_scale.h"
#include "portal.h"

static bool g_setupMode = false;
static AppConfig g_appConfig;

static HX711 scale;
static volatile bool g_tareRequested = false;
static volatile unsigned long g_lastTareInterruptMs = 0;

static float g_filteredWeight = 0.0f;
static float g_displayWeight = 0.0f;

static unsigned long g_lastDisplayMs = 0;
static unsigned long g_lastBleMs     = 0;

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

void onCalFactorFromBle(float factor) {
    LOG_I("BLE", "Remote calibration factor update: %.1f", factor);
    g_appConfig.calibrationFactor = factor;
    ConfigStorage::save(g_appConfig);
    scale.set_scale(factor);
}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 1500);

    LOG_I("BOOT", "=== Smartcale ESP32 Starting ===");

    pinMode(PIN_TARE_BTN, INPUT_PULLUP);
    bool forceSetupMode = false;
    if (digitalRead(PIN_TARE_BTN) == LOW) {
        LOG_I("BOOT", "Tare button pressed on power-up, checking hold duration...");
        unsigned long holdStart = millis();
        while (digitalRead(PIN_TARE_BTN) == LOW) {
            if (millis() - holdStart >= HOLD_TO_SETUP_MS) {
                forceSetupMode = true;
                LOG_W("BOOT", "Tare button held for >%lums -> Forcing Setup Mode!", HOLD_TO_SETUP_MS);
                break;
            }
            delay(10);
        }
    }

    initDisplay();

    bool isConfigured = ConfigStorage::load(g_appConfig);
    LOG_I("BOOT", "NVS Config: configured=%d, SSID='%s', BLE='%s', CAL=%.1f",
          isConfigured, g_appConfig.wifiSsid.c_str(), g_appConfig.bleName.c_str(), g_appConfig.calibrationFactor);

    if (forceSetupMode || (!isConfigured && !ENABLE_MOCK_SCALE)) {
        g_setupMode = true;
        LOG_W("BOOT", "Launching Setup AP Mode (SSID: %s)", SETUP_AP_SSID);
        ConfigPortal::begin(g_appConfig);
        renderConfigPortal(SETUP_AP_SSID, ConfigPortal::getApIp().toString().c_str());
        return;
    }

    LOG_I("BOOT", "Entering normal scale weighing mode");
    attachInterrupt(digitalPinToInterrupt(PIN_TARE_BTN), onTareButtonISR, FALLING);
    initBle(g_appConfig.bleName.c_str(), triggerTareFromBle, onCalFactorFromBle);

    if (g_appConfig.wifiSsid.length() > 0) {
        LOG_I("WIFI", "Connecting to Wi-Fi SSID '%s'...", g_appConfig.wifiSsid.c_str());
        WiFi.mode(WIFI_STA);
        WiFi.begin(g_appConfig.wifiSsid.c_str(), g_appConfig.wifiPass.c_str());
    }

#if ENABLE_MOCK_SCALE
    LOG_I("SCALE", "=== MOCK SCALE MODE ACTIVE ===");
    LOG_I("SCALE", "Config: %u weight steps, interval %lums", (unsigned int)MOCK_WEIGHT_STEPS_COUNT, MOCK_STEP_INTERVAL_MS);
    LOG_I("SCALE", "Serial commands: type weight (e.g. 150), 'i2000' to change interval ms, '-1' to resume auto-cycle.");
#else
    scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
    scale.set_scale(g_appConfig.calibrationFactor);

    // Initial boot tare (sensor ready timeout: 1.5s)
    unsigned long bootStart = millis();
    while (!scale.is_ready() && (millis() - bootStart < 1500)) {
        delay(10);
    }
    if (scale.is_ready()) {
        scale.tare(10);
        LOG_I("SCALE", "Sensor ready. Offset calibrated: %ld", scale.get_offset());
    } else {
        LOG_W("SCALE", "Sensor not detected or busy on power-up");
    }
#endif

    LOG_I("BOOT", "Initialization complete. Ready.");
}

void loop() {
    if (g_setupMode) {
        ConfigPortal::handle();

        unsigned long now = millis();
        if (now - g_lastDisplayMs >= INTERVAL_DISPLAY_MS) {
            g_lastDisplayMs = now;
            renderConfigPortal(SETUP_AP_SSID, ConfigPortal::getApIp().toString().c_str());
        }
        return;
    }

    unsigned long now = millis();

#if ENABLE_MOCK_SCALE
    static float s_mockGross = 0.0f;
    static float s_mockTareOffset = 0.0f;
    static unsigned long s_lastStepMs = 0;
    static size_t s_stepIdx = 0;
    static bool s_manualWeightMode = false;
    static unsigned long s_mockIntervalMs = MOCK_STEP_INTERVAL_MS;

    // Check if user inputs weight or interval via Serial Monitor
    if (Serial.available()) {
        int peekChar = Serial.peek();
        if (peekChar == 'i' || peekChar == 'I') {
            Serial.read(); // consume 'i'
            long newInterval = Serial.parseInt();
            if (newInterval >= 100) {
                s_mockIntervalMs = (unsigned long)newInterval;
                LOG_I("MOCK", "Step interval updated to %lums", s_mockIntervalMs);
            }
        } else {
            float inputVal = Serial.parseFloat();
            if (inputVal >= 0.0f) {
                s_mockGross = inputVal;
                s_manualWeightMode = true;
                LOG_I("MOCK", "Manual weight set from Serial: %.1fg", s_mockGross);
            } else if (inputVal < 0.0f) {
                s_manualWeightMode = false;
                LOG_I("MOCK", "Resumed auto demo weight cycle");
            }
        }
    }

    // Auto-cycle demo weights using configured interval and step array
    if (!s_manualWeightMode && (now - s_lastStepMs >= s_mockIntervalMs)) {
        s_lastStepMs = now;
        s_mockGross = MOCK_WEIGHT_STEPS[s_stepIdx];
        s_stepIdx = (s_stepIdx + 1) % MOCK_WEIGHT_STEPS_COUNT;
        LOG_I("MOCK", "Auto simulated weight: %.1fg (step %u/%u, interval: %lums)",
              s_mockGross, (unsigned int)(s_stepIdx == 0 ? MOCK_WEIGHT_STEPS_COUNT : s_stepIdx),
              (unsigned int)MOCK_WEIGHT_STEPS_COUNT, s_mockIntervalMs);
    }

    if (g_tareRequested) {
        g_tareRequested = false;
        s_mockTareOffset = s_mockGross;
        LOG_I("MOCK", "Tare requested -> Offset set to %.1fg (Display = 0.0g)", s_mockTareOffset);
    }

    float net = s_mockGross - s_mockTareOffset;
    if (net < 0.0f) net = 0.0f;

    // Subtle natural jitter (+/-0.1g) when weight > 0
    float jitter = (net > 0.5f) ? (((rand() % 3) - 1) * 0.1f) : 0.0f;
    g_displayWeight = net + jitter;
#else
    if (g_tareRequested) {
        g_tareRequested = false;
        if (scale.is_ready()) {
            scale.tare(3);
        } else {
            scale.set_offset(scale.read());
        }
        g_filteredWeight = 0.0f;
        g_displayWeight = 0.0f;
    }

    if (scale.is_ready()) {
        float raw = scale.get_units(1);
        g_filteredWeight = (FILTER_ALPHA * raw) + ((1.0f - FILTER_ALPHA) * g_filteredWeight);
        g_displayWeight = (fabs(g_filteredWeight) <= DEADBAND_GRAMS) ? 0.0f : g_filteredWeight;
    }
#endif

    if (now - g_lastBleMs >= INTERVAL_BLE_NOTIFY_MS) {
        g_lastBleMs = now;
        notifyBleWeight(g_displayWeight);
    }

    if (now - g_lastDisplayMs >= INTERVAL_DISPLAY_MS) {
        g_lastDisplayMs = now;
        renderDisplay(g_displayWeight, isBleConnected());
    }
}
