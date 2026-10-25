import assert from 'node:assert/strict';
import { barcodeScanner, BarcodeScannerService } from './barcodeScanner';

// 1. Initial State
assert.equal(barcodeScanner.getIsScanning(), false, 'Initially not scanning');
assert.equal(barcodeScanner.hasTorch(), false, 'Initially no torch available');
assert.equal(barcodeScanner.isTorchOn(), false, 'Initially torch is off');

// 2. Safe execution of stop() when idle
barcodeScanner.stop();
assert.equal(barcodeScanner.getIsScanning(), false, 'stop() when idle stays false');

// 3. New instance independence
const customScanner = new BarcodeScannerService();
assert.equal(customScanner.getIsScanning(), false);

// 4. Safe failure when camera is unavailable
await assert.rejects(
  async () => {
    // In node.js test environment, HTMLVideoElement and getUserMedia are absent
    // @ts-expect-error Mock null video element for test
    await customScanner.start(null, () => {});
  },
  { message: 'Camera not supported' },
  'Must reject with Camera not supported in headless environment'
);

console.log('✓ All barcodeScanner tests passed!');
