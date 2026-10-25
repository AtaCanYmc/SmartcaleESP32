import {
  BleClient,
  dataViewToText,
  textToDataView,
} from '@capacitor-community/bluetooth-le';

export const SCALE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHAR_WEIGHT_UUID   = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const CHAR_CMD_UUID      = '1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e';

class ScaleBleService {
  private deviceId: string | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (!this.isInitialized) {
      await BleClient.initialize();
      this.isInitialized = true;
    }
  }

  async connect(
    onWeightUpdate: (weightGrams: number) => void,
    onDisconnected: () => void
  ): Promise<string> {
    await this.init();

    // 1. Request device matching the Smartcale service
    const device = await BleClient.requestDevice({
      services: [SCALE_SERVICE_UUID],
      optionalServices: [SCALE_SERVICE_UUID],
    });

    this.deviceId = device.deviceId;

    // 2. Connect to device
    await BleClient.connect(this.deviceId, () => {
      this.deviceId = null;
      onDisconnected();
    });

    // 3. Start streaming notifications from the weight characteristic
    await BleClient.startNotifications(
      this.deviceId,
      SCALE_SERVICE_UUID,
      CHAR_WEIGHT_UUID,
      (value: DataView) => {
        const rawStr = dataViewToText(value).trim();
        const weight = parseFloat(rawStr);
        if (!isNaN(weight)) {
          onWeightUpdate(weight);
        }
      }
    );

    return device.name || 'SmartKitchenScale';
  }

  async sendTare(): Promise<void> {
    if (!this.deviceId) {
      throw new Error('Cihaz bağlı değil');
    }

    const payload = textToDataView('T');
    await BleClient.write(
      this.deviceId,
      SCALE_SERVICE_UUID,
      CHAR_CMD_UUID,
      payload
    );
  }

  async disconnect(): Promise<void> {
    if (this.deviceId) {
      await BleClient.disconnect(this.deviceId);
      this.deviceId = null;
    }
  }

  isConnected(): boolean {
    return this.deviceId !== null;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}

export const scaleBle = new ScaleBleService();
