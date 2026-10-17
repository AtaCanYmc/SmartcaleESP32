#pragma once
#include <Arduino.h>
#include "config.h"

// 100k + 100k voltage divider ratio: (100k + 100k) / 100k = 2.0
static constexpr float BATTERY_DIVIDER_RATIO = 2.0f;
static constexpr uint8_t BATTERY_ADC_SAMPLES  = 16;

struct LiPoVoltagePoint {
    float voltage;
    uint8_t percentage;
};

// 1S Li-Po open-circuit resting voltage discharge curve
static const LiPoVoltagePoint LIPO_DISCHARGE_CURVE[] = {
    {4.20f, 100},
    {4.12f,  90},
    {4.00f,  80},
    {3.90f,  70},
    {3.84f,  60},
    {3.80f,  50},
    {3.76f,  40},
    {3.73f,  30},
    {3.68f,  20},
    {3.60f,  10},
    {3.30f,   0}
};
static constexpr size_t LIPO_CURVE_SIZE = sizeof(LIPO_DISCHARGE_CURVE) / sizeof(LIPO_DISCHARGE_CURVE[0]);

inline void initBattery() {
    analogSetPinAttenuation(PIN_BATTERY_ADC, ADC_11db);
}

inline uint8_t calculateBatteryPercentage(float voltage) {
    if (voltage >= LIPO_DISCHARGE_CURVE[0].voltage) return 100;
    if (voltage <= LIPO_DISCHARGE_CURVE[LIPO_CURVE_SIZE - 1].voltage) return 0;

    for (size_t i = 0; i < LIPO_CURVE_SIZE - 1; ++i) {
        float vHigh = LIPO_DISCHARGE_CURVE[i].voltage;
        float vLow  = LIPO_DISCHARGE_CURVE[i + 1].voltage;

        if (voltage <= vHigh && voltage >= vLow) {
            uint8_t pHigh = LIPO_DISCHARGE_CURVE[i].percentage;
            uint8_t pLow  = LIPO_DISCHARGE_CURVE[i + 1].percentage;

            float ratio = (voltage - vLow) / (vHigh - vLow);
            return static_cast<uint8_t>(pLow + ratio * (pHigh - pLow) + 0.5f);
        }
    }
    return 0;
}

inline uint8_t getBatteryPercent() {
    uint32_t adcSumMv = 0;
    for (uint8_t i = 0; i < BATTERY_ADC_SAMPLES; ++i) {
        adcSumMv += analogReadMilliVolts(PIN_BATTERY_ADC);
    }
    float avgAdcMv = static_cast<float>(adcSumMv) / BATTERY_ADC_SAMPLES;
    float batteryVoltage = (avgAdcMv * BATTERY_DIVIDER_RATIO) / 1000.0f;

    return calculateBatteryPercentage(batteryVoltage);
}
