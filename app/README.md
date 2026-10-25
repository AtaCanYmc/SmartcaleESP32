# SmartScale Cross-Platform App (Capacitor 8)

Single-codebase Web, iOS, and Android companion application for **SmartcaleESP32**.

Built with:
- **Vite + React 19 + TypeScript**
- **Capacitor 8** (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`)
- **Bluetooth Low Energy**: `@capacitor-community/bluetooth-le` (Web Bluetooth API on browsers, CoreBluetooth on iOS, Android BLE on Android)

---

## Quick Start

### 1. Web Development Server (Chrome / Edge)
Run locally in your browser with Web Bluetooth support:
```bash
npm install
npm run dev
```
Open in Google Chrome or Microsoft Edge, click **Bağlan (Connect)**, and select your `SmartKitchenScale` device.

### 2. Build Web Bundle
```bash
npm run build
```

### 3. Sync to Mobile (Capacitor 8)
Sync compiled web assets to native iOS and Android projects:
```bash
npx cap sync
```

### 4. Run on Android
Open in Android Studio or run directly via CLI:
```bash
npx cap open android
# or
npx cap run android
```

### 5. Run on iOS
Open in Xcode (utilizes Swift Package Manager):
```bash
npx cap open ios
# or
npx cap run ios
```

---

## BLE Configuration & Compatibility

- **GATT Scale Service**: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Weight Characteristic**: `beb5483e-36e1-4688-b7f5-ea07361b26a8` (Read, Notify, 100ms)
- **Tare Command Characteristic**: `1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e` (Write `'T'`)
