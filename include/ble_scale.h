#pragma once
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <string>
#include "config.h"

static BLEServer* pBleServer = nullptr;
static BLECharacteristic* pWeightCharacteristic = nullptr;
static BLECharacteristic* pCmdCharacteristic = nullptr;
static bool g_bleConnected = false;
static void (*g_onTareCallback)() = nullptr;

class BleServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        g_bleConnected = true;
    }

    void onDisconnect(BLEServer* pServer) override {
        g_bleConnected = false;
        pServer->startAdvertising(); // Auto-restart advertising
    }
};

class BleCommandCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) override {
        String value = String(pCharacteristic->getValue().c_str());
        if (value.length() > 0) {
            char cmd = value[0];
            if ((cmd == 'T' || cmd == 't') && g_onTareCallback != nullptr) {
                g_onTareCallback();
            }
        }
    }
};

inline void initBle(const char* deviceName, void (*onTareFunc)()) {
    g_onTareCallback = onTareFunc;

    const char* name = (deviceName && strlen(deviceName) > 0) ? deviceName : DEFAULT_BLE_NAME;
    BLEDevice::init(name);
    pBleServer = BLEDevice::createServer();
    pBleServer->setCallbacks(new BleServerCallbacks());

    BLEService* pService = pBleServer->createService(SERVICE_UUID);

    pWeightCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_WEIGHT_UUID,
        BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
    );
    pWeightCharacteristic->addDescriptor(new BLE2902());

    pCmdCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_CMD_UUID,
        BLECharacteristic::PROPERTY_WRITE
    );
    pCmdCharacteristic->setCallbacks(new BleCommandCallbacks());

    pService->start();

    BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();
}

inline bool isBleConnected() {
    return g_bleConnected;
}

inline void notifyBleWeight(float weightGrams) {
    if (g_bleConnected && pWeightCharacteristic != nullptr) {
        char payload[16];
        snprintf(payload, sizeof(payload), "%.1f", weightGrams);
        pWeightCharacteristic->setValue(payload);
        pWeightCharacteristic->notify();
    }
}
