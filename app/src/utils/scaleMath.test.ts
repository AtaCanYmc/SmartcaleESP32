import assert from 'node:assert/strict';
import { applyDeadband, formatWeight, computeCalFactor, adjustCalFactor, calculateSparklinePoints, DEADBAND_GRAMS } from './scaleMath';

// 1. Deadband tests
assert.equal(applyDeadband(0.0), 0.0, '0g should stay 0');
assert.equal(applyDeadband(0.2), 0.0, '0.2g inside deadband should be 0');
assert.equal(applyDeadband(-0.35), 0.0, '-0.35g inside deadband should be 0');
assert.equal(applyDeadband(DEADBAND_GRAMS), 0.0, 'Exact deadband boundary should be 0');
assert.equal(applyDeadband(-DEADBAND_GRAMS), 0.0, 'Exact negative deadband boundary should be 0');
assert.equal(applyDeadband(0.41), 0.41, '0.41g outside deadband should remain');
assert.equal(applyDeadband(-15.5), -15.5, '-15.5g outside deadband should remain');

// 2. formatWeight tests across units
// Grams (g)
assert.equal(formatWeight(0, 'g'), '0.0');
assert.equal(formatWeight(0.3, 'g'), '0.0', 'Deadband clamped');
assert.equal(formatWeight(150.46, 'g'), '150.5', 'Single decimal rounding for grams');
assert.equal(formatWeight(1000.0, 'g'), '1000.0');

// Ounces (oz) - 1g = 0.035274 oz
assert.equal(formatWeight(0, 'oz'), '0.00');
assert.equal(formatWeight(100, 'oz'), '3.53', '100g = 3.53 oz');
assert.equal(formatWeight(500, 'oz'), '17.64', '500g = 17.64 oz');

// Milliliters (ml) - 1g water = 1ml
assert.equal(formatWeight(0, 'ml'), '0.0');
assert.equal(formatWeight(250.4, 'ml'), '250.4');

// 3. computeCalFactor tests
assert.equal(computeCalFactor('210000', '500'), '420.0', 'Standard factor: 210000 / 500 = 420.0');
assert.equal(computeCalFactor('425000', '1000'), '425.0', '1000g reference calibration');
assert.equal(computeCalFactor('0', '0'), '420.0', 'Zero ref fallback');
assert.equal(computeCalFactor('invalid', '500'), '420.0', 'NaN raw fallback');
assert.equal(computeCalFactor('210000', 'invalid'), '420.0', 'NaN ref fallback');
assert.equal(computeCalFactor('210000', '-500'), '420.0', 'Negative ref fallback');

// 4. adjustCalFactor tests
assert.equal(adjustCalFactor(420.0, 480.0, 500.0), '403.2', 'Proportional factor adjustment');
assert.equal(adjustCalFactor(420.0, 500.0, 500.0), '420.0', 'Exact match yields same factor');
assert.equal(adjustCalFactor('420.0', '1050.0', '1000.0'), '441.0', 'Over-reading adjustment');
assert.equal(adjustCalFactor(420.0, 0, 500.0), '420.0', 'Zero measured fallback');
assert.equal(adjustCalFactor(420.0, 500.0, 0), '420.0', 'Zero reference fallback');

// 5. calculateSparklinePoints tests
const emptyPoints = calculateSparklinePoints([]);
assert.equal(emptyPoints, '', 'Empty history returns empty string');

const flatHistory = [0, 0, 0, 0];
const flatPoints = calculateSparklinePoints(flatHistory);
assert.ok(flatPoints.length > 0, 'Generates valid points for flat history');

const climbingHistory = [0, 50, 100, 150];
const climbingPoints = calculateSparklinePoints(climbingHistory, 100, 40);
assert.ok(climbingPoints.includes('0.0,'), 'Should start at x=0');
assert.ok(climbingPoints.includes('100.0,'), 'Should end at x=100');

console.log('✓ All scaleMath tests passed!');
