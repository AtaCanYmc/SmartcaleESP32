#pragma once
#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

struct AppConfig {
    String wifiSsid;
    String wifiPass;
    String bleName;
    float calibrationFactor;
    bool enableOled;
    int8_t pinHx711Dt;
    int8_t pinHx711Sck;
    int8_t pinTareBtn;
    int8_t pinI2cSda;
    int8_t pinI2cScl;
};

class ConfigStorage {
public:
    static bool load(AppConfig& config) {
        Preferences prefs;
        // Open read/write so the namespace is created if not yet present
        if (!prefs.begin(NVS_NAMESPACE, false)) {
            config.wifiSsid = "";
            config.wifiPass = "";
            config.bleName = DEFAULT_BLE_NAME;
            config.calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
            config.enableOled = ENABLE_OLED;
            config.pinHx711Dt = PIN_HX711_DT;
            config.pinHx711Sck = PIN_HX711_SCK;
            config.pinTareBtn = PIN_TARE_BTN;
            config.pinI2cSda = PIN_I2C_SDA;
            config.pinI2cScl = PIN_I2C_SCL;
            return false;
        }

        config.wifiSsid = prefs.getString("ssid", "");
        config.wifiPass = prefs.getString("pass", "");
        config.bleName = prefs.getString("blename", DEFAULT_BLE_NAME);
        config.calibrationFactor = prefs.getFloat("cal", DEFAULT_CALIBRATION_FACTOR);
        config.enableOled = prefs.getBool("oled", ENABLE_OLED);
        config.pinHx711Dt = (int8_t)prefs.getInt("pin_dt", PIN_HX711_DT);
        config.pinHx711Sck = (int8_t)prefs.getInt("pin_sck", PIN_HX711_SCK);
        config.pinTareBtn = (int8_t)prefs.getInt("pin_btn", PIN_TARE_BTN);
        config.pinI2cSda = (int8_t)prefs.getInt("pin_sda", PIN_I2C_SDA);
        config.pinI2cScl = (int8_t)prefs.getInt("pin_scl", PIN_I2C_SCL);

        if (config.pinHx711Dt < 0 || config.pinHx711Dt > 21) config.pinHx711Dt = PIN_HX711_DT;
        if (config.pinHx711Sck < 0 || config.pinHx711Sck > 21) config.pinHx711Sck = PIN_HX711_SCK;
        if (config.pinTareBtn < 0 || config.pinTareBtn > 21) config.pinTareBtn = PIN_TARE_BTN;
        if (config.pinI2cSda < 0 || config.pinI2cSda > 21) config.pinI2cSda = PIN_I2C_SDA;
        if (config.pinI2cScl < 0 || config.pinI2cScl > 21) config.pinI2cScl = PIN_I2C_SCL;

        if (config.bleName.length() == 0) {
            config.bleName = DEFAULT_BLE_NAME;
        }
        if (config.calibrationFactor <= 0.0f) {
            config.calibrationFactor = DEFAULT_CALIBRATION_FACTOR;
        }

        prefs.end();
        return config.wifiSsid.length() > 0;
    }

    static bool save(const AppConfig& config) {
        Preferences prefs;
        if (!prefs.begin(NVS_NAMESPACE, false)) { // Read/Write
            return false;
        }

        prefs.putString("ssid", config.wifiSsid);
        prefs.putString("pass", config.wifiPass);
        prefs.putString("blename", config.bleName);
        prefs.putFloat("cal", config.calibrationFactor);
        prefs.putBool("oled", config.enableOled);
        prefs.putInt("pin_dt", config.pinHx711Dt);
        prefs.putInt("pin_sck", config.pinHx711Sck);
        prefs.putInt("pin_btn", config.pinTareBtn);
        prefs.putInt("pin_sda", config.pinI2cSda);
        prefs.putInt("pin_scl", config.pinI2cScl);

        prefs.end();
        return true;
    }

    static void reset() {
        Preferences prefs;
        if (prefs.begin(NVS_NAMESPACE, false)) {
            prefs.clear();
            prefs.end();
        }
    }
};
