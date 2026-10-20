#pragma once
#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

struct AppConfig {
    String wifiSsid;
    String wifiPass;
    String bleName;
    float calibrationFactor;
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
            return false;
        }

        config.wifiSsid = prefs.getString("ssid", "");
        config.wifiPass = prefs.getString("pass", "");
        config.bleName = prefs.getString("blename", DEFAULT_BLE_NAME);
        config.calibrationFactor = prefs.getFloat("cal", DEFAULT_CALIBRATION_FACTOR);

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
