#pragma once
#include <Arduino.h>
#include "config.h"

inline void initBuzzer() {
    pinMode(PIN_BUZZER, OUTPUT);
}

inline void beep(unsigned int frequency = 2400, unsigned long durationMs = 80) {
    tone(PIN_BUZZER, frequency, durationMs);
}

inline void beepBoot() {
    beep(2000, 100);
}

inline void beepTare() {
    beep(2500, 60);
}

inline void beepConnected() {
    beep(3000, 100);
}

inline void beepDisconnected() {
    beep(1500, 120);
}

inline void beepConfigMode() {
    beep(1800, 150);
}
