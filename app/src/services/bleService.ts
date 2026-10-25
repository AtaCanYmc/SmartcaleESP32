import {
  BleClient,
  dataViewToText,
  textToDataView,
} from '@capacitor-community/bluetooth-le';

export const SCALE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHAR_WEIGHT_UUID   = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const CHAR_CMD_UUID      = '1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e';

export interface BleConnectionCallbacks {
  onWeightUpdate: (weightGrams: number) => void;
  onDisconnected: (unexpected: boolean) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  onReconnected?: (deviceName: string) => void;
  onReconnectFailed?: () => void;
}

export class ScaleBleService {
  private deviceId: string | null = null;
  private deviceName = 'SmartKitchenScale';
  private lastDeviceId: string | null = null;
  private isInitialized = false;
  private isManualDisconnect = false;
  private reconnectAttempt = 0;
  private readonly maxReconnectAttempts = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private callbacks: BleConnectionCallbacks | null = null;

  async init(): Promise<void> {
    if (!this.isInitialized) {
      await BleClient.initialize();
      this.isInitialized = true;
    }
  }

  async connect(
    onWeightOrCallbacks: ((weightGrams: number) => void) | BleConnectionCallbacks,
    onDisconnectedArg?: (unexpected: boolean) => void,
    optionalCallbacks?: Partial<BleConnectionCallbacks>
  ): Promise<string> {
    await this.init();
    this.cancelReconnect();
    this.isManualDisconnect = false;

    if (typeof onWeightOrCallbacks === 'function') {
      this.callbacks = {
        onWeightUpdate: onWeightOrCallbacks,
        onDisconnected: onDisconnectedArg || (() => {}),
        ...optionalCallbacks,
      };
    } else {
      this.callbacks = onWeightOrCallbacks;
    }

    // 1. Request device matching the Smartcale service
    const device = await BleClient.requestDevice({
      services: [SCALE_SERVICE_UUID],
      optionalServices: [SCALE_SERVICE_UUID],
    });

    this.deviceId = device.deviceId;
    this.lastDeviceId = device.deviceId;
    this.deviceName = device.name || 'SmartKitchenScale';

    // 2. Connect to device
    await BleClient.connect(this.deviceId, () => {
      this.handleDisconnectEvent();
    });

    // 3. Start streaming notifications from the weight characteristic
    await this.startWeightNotifications(this.deviceId);

    return this.deviceName;
  }

  private async startWeightNotifications(deviceId: string): Promise<void> {
    await BleClient.startNotifications(
      deviceId,
      SCALE_SERVICE_UUID,
      CHAR_WEIGHT_UUID,
      (value: DataView) => {
        const rawStr = dataViewToText(value).trim();
        const weight = parseFloat(rawStr);
        if (!isNaN(weight)) {
          this.callbacks?.onWeightUpdate(weight);
        }
      }
    );
  }

  private handleDisconnectEvent(): void {
    const previousDeviceId = this.deviceId || this.lastDeviceId;
    this.deviceId = null;

    if (this.isManualDisconnect) {
      this.callbacks?.onDisconnected(false);
      return;
    }

    // Unexpected disconnection
    this.callbacks?.onDisconnected(true);

    if (previousDeviceId) {
      this.triggerAutoReconnect(previousDeviceId);
    }
  }

  private triggerAutoReconnect(targetDeviceId: string): void {
    if (this.isManualDisconnect || this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.reconnectAttempt = 0;
      this.callbacks?.onReconnectFailed?.();
      return;
    }

    this.reconnectAttempt++;
    this.callbacks?.onReconnecting?.(this.reconnectAttempt, this.maxReconnectAttempts);

    const delayMs = this.reconnectAttempt * 1500;
    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.isManualDisconnect) return;
        await BleClient.connect(targetDeviceId, () => {
          this.handleDisconnectEvent();
        });
        await this.startWeightNotifications(targetDeviceId);

        this.deviceId = targetDeviceId;
        this.reconnectAttempt = 0;
        this.callbacks?.onReconnected?.(this.deviceName);
      } catch (err) {
        console.warn(`BLE reconnect attempt ${this.reconnectAttempt} failed:`, err);
        this.triggerAutoReconnect(targetDeviceId);
      }
    }, delayMs);
  }

  cancelReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempt = 0;
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
    this.isManualDisconnect = true;
    this.cancelReconnect();

    if (this.deviceId) {
      try {
        await BleClient.disconnect(this.deviceId);
      } catch {
        // ignore
      }
      this.deviceId = null;
    }
  }

  isConnected(): boolean {
    return this.deviceId !== null;
  }

  isReconnecting(): boolean {
    return this.reconnectAttempt > 0;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  getLastDeviceId(): string | null {
    return this.lastDeviceId;
  }

  async reconnect(optionalCallbacks?: Partial<BleConnectionCallbacks>): Promise<string> {
    if (!this.lastDeviceId) {
      throw new Error('No previous device');
    }
    await this.init();
    this.cancelReconnect();
    this.isManualDisconnect = false;

    if (optionalCallbacks) {
      this.callbacks = {
        onWeightUpdate: this.callbacks?.onWeightUpdate || (() => {}),
        onDisconnected: this.callbacks?.onDisconnected || (() => {}),
        ...this.callbacks,
        ...optionalCallbacks,
      };
    }

    await BleClient.connect(this.lastDeviceId, () => {
      this.handleDisconnectEvent();
    });
    await this.startWeightNotifications(this.lastDeviceId);

    this.deviceId = this.lastDeviceId;
    this.reconnectAttempt = 0;
    this.callbacks?.onReconnected?.(this.deviceName);
    return this.deviceName;
  }
}

export const scaleBle = new ScaleBleService();
