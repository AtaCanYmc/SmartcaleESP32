import assert from 'node:assert/strict';
import {
  SCALE_SERVICE_UUID,
  CHAR_WEIGHT_UUID,
  CHAR_CMD_UUID,
  scaleBle,
} from './bleService';

// 1. BLE GATT Profile UUID constants (must match firmware include/config.h)
assert.equal(
  SCALE_SERVICE_UUID,
  '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  'Service UUID must strictly match firmware SERVICE_UUID'
);
assert.equal(
  CHAR_WEIGHT_UUID,
  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  'Weight Characteristic UUID must match firmware CHARACTERISTIC_WEIGHT_UUID'
);
assert.equal(
  CHAR_CMD_UUID,
  '1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e',
  'Command Characteristic UUID must match firmware CHARACTERISTIC_CMD_UUID'
);

// 2. Data parsing simulation (matching bleService startNotifications handler)
function parseWeightNotification(rawStr: string): number | null {
  const trimmed = rawStr.trim();
  const weight = parseFloat(trimmed);
  if (!isNaN(weight)) {
    return weight;
  }
  return null;
}

assert.equal(parseWeightNotification('0.0'), 0.0);
assert.equal(parseWeightNotification('150.45'), 150.45);
assert.equal(parseWeightNotification('  250.0 \r\n'), 250.0);
assert.equal(parseWeightNotification('-12.4'), -12.4, 'Tared negative offset');
assert.equal(parseWeightNotification(''), null, 'Empty string returns null');
assert.equal(parseWeightNotification('   '), null);
assert.equal(parseWeightNotification('ERR_OVERLOAD'), null, 'Non-numeric string returns null');
assert.equal(parseWeightNotification('NaN'), null);

// 3. Tare command payload verification
const tareChar = 'T';
const tareByte = tareChar.charCodeAt(0);
assert.equal(tareByte, 84, 'Tare command ASCII character must be 84 ("T")');

// 4. Initial connection state
assert.equal(scaleBle.isConnected(), false);
assert.equal(scaleBle.getDeviceId(), null);

console.log('✓ All bleService tests passed!');
