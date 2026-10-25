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
            s_networkListHtml = "<option value=\"\">Ağ bulunamadı</option>";
        } else {
            for (int i = 0; i < n; ++i) {
                String ssid = WiFi.SSID(i);
                int rssi = WiFi.RSSI(i);
                s_networkListHtml += "<option value=\"" + ssid + "\">" + ssid + " (" + String(rssi) + " dBm)</option>";
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
    static inline bool s_restartPending = false;
    static inline unsigned long s_restartTime = 0;

    static void handleRedirect() {
        s_webServer.sendHeader("Location", "http://" + WiFi.softAPIP().toString() + "/", true);
        s_webServer.send(302, "text/plain", "Redirecting to setup portal...");
    }

    static void handleRoot() {
        String html = R"rawliteral(<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Smartcale ESP32 Kurulum</title>
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
    <p class="desc">Cihaz Yapılandırma ve Ağ Ayarları</p>
    <form action="/save" method="POST">
        <label for="network_select">Mevcut Wi-Fi Ağları</label>
        <select id="network_select" onchange="selectSsid(this.value)">
            <option value="">-- Ağ Seçiniz (veya elle yazınız) --</option>
)rawliteral";

        html += s_networkListHtml;

        html += R"rawliteral(
        </select>
        <label for="ssid_input">Wi-Fi Ağı (SSID)</label>
        <input type="text" id="ssid_input" name="ssid" value=")rawliteral";
        html += s_config.wifiSsid;
        html += R"rawliteral(" required placeholder="Bağlanılacak Ağ Adı">

        <label for="pass_input">Wi-Fi Şifresi</label>
        <input type="password" id="pass_input" name="pass" value=")rawliteral";
        html += s_config.wifiPass;
        html += R"rawliteral(" placeholder="Ağ Şifresi">

        <label for="blename_input">BLE Aygıt Adı</label>
        <input type="text" id="blename_input" name="blename" value=")rawliteral";
        html += s_config.bleName;
        html += R"rawliteral(" required placeholder="SmartKitchenScale">
        <div class="hint">Mobilde görünecek Bluetooth adı</div>

        <label for="cal_input">Kalibrasyon Katsayısı</label>
        <input type="number" step="0.1" id="cal_input" name="cal" value=")rawliteral";
        html += String(s_config.calibrationFactor, 1);
        html += R"rawliteral(" required>
        <div class="hint">Varsayılan: 420.0 (Ham Veri / Referans Ağırlık)</div>

        <button type="submit" class="btn btn-primary">Kaydet ve Yeniden Başlat</button>
    </form>
    <form action="/reset" method="POST" onsubmit="return confirm('Tüm ayarlar sıfırlanacak. Emin misiniz?');">
        <button type="submit" class="btn btn-danger">Fabrika Ayarlarına Sıfırla</button>
    </form>
</div>
</body>
</html>)rawliteral";

        s_webServer.send(200, "text/html", html);
    }

    static void handleSave() {
        if (s_webServer.hasArg("ssid")) {
            s_config.wifiSsid = s_webServer.arg("ssid");
            s_config.wifiSsid.trim();
        }
        if (s_webServer.hasArg("pass")) {
            s_config.wifiPass = s_webServer.arg("pass");
            s_config.wifiPass.trim();
        }
        if (s_webServer.hasArg("blename")) {
            s_config.bleName = s_webServer.arg("blename");
            s_config.bleName.trim();
        }
        if (s_webServer.hasArg("cal")) {
            float val = s_webServer.arg("cal").toFloat();
            if (val > 0.0f) {
                s_config.calibrationFactor = val;
            }
        }

        ConfigStorage::save(s_config);

        String responseHtml = R"rawliteral(<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kaydedildi</title>
<style>
body { background: #0f172a; color: #38bdf8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; }
.card { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; }
h2 { margin-bottom: 12px; }
p { color: #94a3b8; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
    <h2>Ayarlar Başarıyla Kaydedildi!</h2>
    <p>Tartı yeni ayarlarla yeniden başlatılıyor. Lütfen bekleyiniz...</p>
</div>
</body>
</html>)rawliteral";

        s_webServer.send(200, "text/html", responseHtml);
        s_restartPending = true;
        s_restartTime = millis();
    }

    static void handleReset() {
        ConfigStorage::reset();
        String responseHtml = R"rawliteral(<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"><title>Sıfırlandı</title>
<style>body{background:#0f172a;color:#ef4444;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;}</style>
</head>
<body>
<div><h2>Cihaz Sıfırlandı!</h2><p style="color:#94a3b8;">Varsayılan ayarlarla yeniden başlatılıyor...</p></div>
</body></html>)rawliteral";
        s_webServer.send(200, "text/html", responseHtml);
        s_restartPending = true;
        s_restartTime = millis();
    }
};
