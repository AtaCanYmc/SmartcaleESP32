#pragma once
#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>
#include "config.h"

static U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset= */ U8X8_PIN_NONE);

inline void initDisplay() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    u8g2.begin();

    // Boot splash screen
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_helvB10_tr);
    u8g2.drawStr(12, 28, "Smart Kitchen");
    u8g2.drawStr(38, 48, "Scale");
    u8g2.sendBuffer();
}

inline void renderDisplay(float weightGrams, bool bleConnected) {
    u8g2.clearBuffer();

    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 8, bleConnected ? "BLE: BAGLI" : "BLE: BEKLIYOR");
    u8g2.drawHLine(0, 11, 128);

    char weightStr[16];
    snprintf(weightStr, sizeof(weightStr), "%.1f", weightGrams);

    u8g2.setFont(u8g2_font_logisoso32_tr);
    int weightWidth = u8g2.getStrWidth(weightStr);

    u8g2.setFont(u8g2_font_helvB14_tr);
    int unitWidth = u8g2.getStrWidth("g");

    int totalWidth = weightWidth + 4 + unitWidth;
    int startX = (128 - totalWidth) / 2;
    if (startX < 0) startX = 0;

    u8g2.setFont(u8g2_font_logisoso32_tr);
    u8g2.drawStr(startX, 56, weightStr);

    u8g2.setFont(u8g2_font_helvB14_tr);
    u8g2.drawStr(startX + weightWidth + 4, 56, "g");

    u8g2.sendBuffer();
}

inline void renderConfigPortal(const char* ssid, const char* ip) {
    u8g2.clearBuffer();

    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 8, "KURULUM MODU (AP)");
    u8g2.drawHLine(0, 11, 128);

    u8g2.setFont(u8g2_font_7x14_tf);
    u8g2.drawStr(0, 26, "WiFi:");
    u8g2.drawStr(38, 26, ssid);

    u8g2.drawStr(0, 42, "IP  :");
    u8g2.drawStr(38, 42, ip);

    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 60, "Webden ayarlayiniz");

    u8g2.sendBuffer();
}

