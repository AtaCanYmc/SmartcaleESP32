#pragma once
#include <Arduino.h>

#define LOG_I(tag, fmt, ...) Serial.printf("[%7lu][I][%s] " fmt "\n", millis(), tag, ##__VA_ARGS__)
#define LOG_W(tag, fmt, ...) Serial.printf("[%7lu][W][%s] " fmt "\n", millis(), tag, ##__VA_ARGS__)
#define LOG_E(tag, fmt, ...) Serial.printf("[%7lu][E][%s] " fmt "\n", millis(), tag, ##__VA_ARGS__)
