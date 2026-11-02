#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include "config.h"
#include "storage.h"
#include "logger.h"

class ConfigPortal {
public:
    static void begin(const AppConfig& currentConfig) {
        s_config = currentConfig;
        s_restartPending = false;
        s_csrfToken = String(random(100000, 999999)) + String(millis());

        WiFi.disconnect(true);
        delay(20);
        WiFi.mode(WIFI_AP_STA);
        bool apOk = WiFi.softAP(SETUP_AP_SSID, nullptr, 1);
        IPAddress apIp = WiFi.softAPIP();

        LOG_I("PORTAL", "SoftAP start: %s | SSID: '%s' | IP: %s",
              apOk ? "SUCCESS" : "FAILED", SETUP_AP_SSID, apIp.toString().c_str());

        // Start Captive Portal DNS on port 53
        s_dnsServer.start(53, "*", apIp);
        LOG_I("PORTAL", "DNS captive portal active on port 53");

        // Scan available networks
        LOG_I("PORTAL", "Scanning nearby 2.4GHz Wi-Fi networks...");
        s_networkListHtml = "";
        int n = WiFi.scanNetworks();
        LOG_I("PORTAL", "Found %d networks", n);
        if (n <= 0) {
            s_networkListHtml = "<option value=\"\">No networks found</option>";
        } else {
            for (int i = 0; i < n; ++i) {
                String rawSsid = WiFi.SSID(i);
                String safeSsid = escapeHtml(rawSsid);
                int rssi = WiFi.RSSI(i);
                s_networkListHtml += "<option value=\"" + safeSsid + "\">" + safeSsid + " (" + String(rssi) + " dBm)</option>";
            }
        }

        // Web Server Route Handlers
        s_webServer.on("/", HTTP_GET, handleRoot);
        s_webServer.on("/save", HTTP_POST, handleSave);
        s_webServer.on("/reset", HTTP_POST, handleReset);

        // Captive Portal Handlers for iOS / Android / Windows
        s_webServer.on("/generate_204", HTTP_GET, handleRedirect);
        s_webServer.on("/hotspot-detect.html", HTTP_GET, handleRedirect);
        s_webServer.on("/ncsi.txt", HTTP_GET, handleRedirect);
        s_webServer.on("/connecttest.txt", HTTP_GET, handleRedirect);
        s_webServer.onNotFound(handleRedirect);

        s_webServer.begin();
        LOG_I("PORTAL", "HTTP web server active on port 80");
    }

    static void handle() {
        s_dnsServer.processNextRequest();
        s_webServer.handleClient();

        if (s_restartPending && (millis() - s_restartTime >= 1200)) {
            ESP.restart();
        }
    }

    static IPAddress getApIp() {
        return WiFi.softAPIP();
    }

private:
    static inline DNSServer s_dnsServer;
    static inline WebServer s_webServer{80};
    static inline AppConfig s_config;
    static inline String s_networkListHtml;
    static inline String s_csrfToken;
    static inline bool s_restartPending = false;
    static inline unsigned long s_restartTime = 0;

    static String escapeHtml(const String& input) {
        String output;
        output.reserve(input.length() + 16);
        for (size_t i = 0; i < input.length(); ++i) {
            char c = input[i];
            switch (c) {
                case '&':  output += "&amp;"; break;
                case '<':  output += "&lt;"; break;
                case '>':  output += "&gt;"; break;
                case '"':  output += "&quot;"; break;
                case '\'': output += "&#39;"; break;
                default:   output += c; break;
            }
        }
        return output;
    }

    static void handleRedirect() {
        s_webServer.sendHeader("Location", "http://" + WiFi.softAPIP().toString() + "/", true);
        s_webServer.send(302, "text/plain", "Redirecting to setup portal...");
    }

    static void handleRoot() {
        String html = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Smartcale ESP32 Setup</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 16px; }
.card { background: #1e293b; width: 100%; max-width: 420px; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
h1 { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; text-align: center; }
p.desc { font-size: 13px; color: #cbd5e1; text-align: center; margin-bottom: 20px; }
label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #cbd5e1; margin-bottom: 6px; }
input, select { width: 100%; min-height: 44px; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 14px; margin-bottom: 16px; outline: none; }
input:focus-visible, select:focus-visible { border-color: #38bdf8; outline: 2px solid #38bdf8; outline-offset: 2px; }
.btn { width: 100%; min-height: 44px; padding: 12px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.btn-primary { background: #0284c7; color: white; margin-top: 8px; }
.btn-primary:hover { background: #0369a1; }
.btn-danger { background: transparent; color: #f87171; border: 1px solid #ef4444; margin-top: 14px; }
.btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
.hint { font-size: 12px; color: #cbd5e1; margin-top: -12px; margin-bottom: 14px; }
</style>
<script>
function selectSsid(val) {
    if(val) document.getElementById('ssid_input').value = val;
}
</script>
</head>
<body>
<div class="card">
    <h1>Smartcale ESP32</h1>
    <p class="desc">Device Configuration & Network Settings</p>
    <form action="/save" method="POST">
        <input type="hidden" name="token" value=")rawliteral";
        html += s_csrfToken;
        html += R"rawliteral(">
        <label for="network_select">Available Wi-Fi Networks</label>
        <select id="network_select" onchange="selectSsid(this.value)">
            <option value="">-- Select Network (or enter manually) --</option>
)rawliteral";

        html += s_networkListHtml;

        html += R"rawliteral(
        </select>
        <label for="ssid_input">Wi-Fi Network (SSID)</label>
        <input type="text" id="ssid_input" name="ssid" value=")rawliteral";
        html += escapeHtml(s_config.wifiSsid);
        html += R"rawliteral(" maxlength="32" required placeholder="Network Name">

        <label for="pass_input">Wi-Fi Password</label>
        <input type="password" id="pass_input" name="pass" value="" maxlength="64" placeholder=")rawliteral";
        html += (s_config.wifiPass.length() > 0 ? "•••••••• (Leave blank to keep current)" : "Network Password");
        html += R"rawliteral(">

        <label for="blename_input">BLE Device Name</label>
        <input type="text" id="blename_input" name="blename" value=")rawliteral";
        html += escapeHtml(s_config.bleName);
        html += R"rawliteral(" maxlength="32" required placeholder="SmartKitchenScale">
        <div class="hint">Bluetooth device name visible on mobile</div>

        <label for="cal_input">Calibration Factor</label>
        <input type="number" step="0.1" id="cal_input" name="cal" value=")rawliteral";
        html += String(s_config.calibrationFactor, 1);
        html += R"rawliteral(" required>
        <div class="hint">Default: 420.0 (Raw ADC / Reference Weight)</div>

        <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; text-transform: none; font-size: 14px; font-weight: normal; color: #f8fafc; margin-bottom: 4px;">
                <input type="checkbox" id="oled_input" name="oled" value="1" )rawliteral";
        if (s_config.enableOled) {
            html += "checked ";
        }
        html += R"rawliteral(style="width: 18px; min-height: 18px; margin-bottom: 0; accent-color: #0284c7;">
                <span>Enable OLED Display</span>
            </label>
            <div class="hint" style="margin-top: 2px; margin-bottom: 0;">Uncheck if operating headless without an I2C display</div>
        </div>

        <button type="submit" class="btn btn-primary">Save and Restart</button>
    </form>
    <form action="/reset" method="POST" onsubmit="return confirm('All settings will be reset to factory defaults. Are you sure?');">
        <input type="hidden" name="token" value=")rawliteral";
        html += s_csrfToken;
        html += R"rawliteral(">
        <button type="submit" class="btn btn-danger">Reset to Factory Defaults</button>
    </form>
</div>
</body>
</html>)rawliteral";

        s_webServer.send(200, "text/html", html);
    }

    static void handleSave() {
        if (!s_webServer.hasArg("token") || s_webServer.arg("token") != s_csrfToken) {
            s_webServer.send(403, "text/plain", "Forbidden: Invalid CSRF token");
            return;
        }

        if (s_webServer.hasArg("ssid")) {
            String ssid = s_webServer.arg("ssid");
            ssid.trim();
            if (ssid.length() > 0 && ssid.length() <= 32) {
                s_config.wifiSsid = ssid;
            }
        }
        if (s_webServer.hasArg("pass")) {
            String pass = s_webServer.arg("pass");
            pass.trim();
            if (pass.length() > 0 && pass.length() <= 64) {
                s_config.wifiPass = pass;
            }
        }
        if (s_webServer.hasArg("blename")) {
            String ble = s_webServer.arg("blename");
            ble.trim();
            if (ble.length() > 0 && ble.length() <= 32) {
                s_config.bleName = ble;
            }
        }
        if (s_webServer.hasArg("cal")) {
            float val = s_webServer.arg("cal").toFloat();
            if (val > 0.0f && val <= 50000.0f) {
                s_config.calibrationFactor = val;
            }
        }
        s_config.enableOled = s_webServer.hasArg("oled");

        ConfigStorage::save(s_config);

        String responseHtml = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Saved</title>
<style>
body { background: #0f172a; color: #38bdf8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; }
.card { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; }
h2 { margin-bottom: 12px; }
p { color: #94a3b8; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
    <h2>Settings Saved Successfully!</h2>
    <p>The scale is restarting with new settings. Please wait...</p>
</div>
</body>
</html>)rawliteral";

        s_webServer.send(200, "text/html", responseHtml);
        s_restartPending = true;
        s_restartTime = millis();
    }

    static void handleReset() {
        if (!s_webServer.hasArg("token") || s_webServer.arg("token") != s_csrfToken) {
            s_webServer.send(403, "text/plain", "Forbidden: Invalid CSRF token");
            return;
        }

        ConfigStorage::reset();
        String responseHtml = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Reset</title>
<style>body{background:#0f172a;color:#ef4444;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;}</style>
</head>
<body>
<div><h2>Device Reset!</h2><p style="color:#94a3b8;">Restarting with factory default settings...</p></div>
</body></html>)rawliteral";
        s_webServer.send(200, "text/html", responseHtml);
        s_restartPending = true;
        s_restartTime = millis();
    }
};
