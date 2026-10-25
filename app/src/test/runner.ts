/**
 * Smartcale ESP32 Comprehensive Test Suite Runner
 * Runs all unit and integration tests across services, utils, and i18n.
 */

console.log('\n========================================');
console.log('  Smartcale ESP32 - Test Suite Runner   ');
console.log('========================================\n');

const startTime = Date.now();

try {
  console.log('▶ [1/7] Running scaleMath tests...');
  await import('../utils/scaleMath.test');

  console.log('▶ [2/7] Running calendar tests...');
  await import('../utils/calendar.test');

  console.log('▶ [3/7] Running i18n parity tests...');
  await import('../i18n/index.test');

  console.log('▶ [4/7] Running BLE scale service tests...');
  await import('../services/bleService.test');

  console.log('▶ [5/7] Running foodService & OpenFoodFacts tests...');
  await import('../services/foodService.test');

  console.log('▶ [6/7] Running mealService & nutrition diary tests...');
  await import('../services/mealService.test');

  console.log('▶ [7/7] Running barcodeScanner tests...');
  await import('../services/barcodeScanner.test');

  const elapsedMs = Date.now() - startTime;
  console.log('\n========================================');
  console.log(`✓ All 7 test suites passed in ${elapsedMs}ms!`);
  console.log('========================================\n');
} catch (err) {
  console.error('\n❌ Test suite failure:', err);
  process.exit(1);
}
