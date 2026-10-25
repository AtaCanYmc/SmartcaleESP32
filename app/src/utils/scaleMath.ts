import type { WeightUnit } from '../types/scale';

export const DEADBAND_GRAMS = 0.4;

export function applyDeadband(weightGrams: number, deadband: number = DEADBAND_GRAMS): number {
  if (Math.abs(weightGrams) <= deadband) {
    return 0.0;
  }
  return weightGrams;
}

export function formatWeight(g: number, unit: WeightUnit): string {
  const effectiveGrams = applyDeadband(g);
  switch (unit) {
    case 'oz':
      return (effectiveGrams * 0.035274).toFixed(2);
    case 'ml':
      return effectiveGrams.toFixed(1);
    case 'g':
    default:
      return effectiveGrams.toFixed(1);
  }
}

export function computeCalFactor(rawAdcInput: string, refWeightGrams: string): string {
  const raw = parseFloat(rawAdcInput);
  const ref = parseFloat(refWeightGrams);
  if (!isNaN(raw) && !isNaN(ref) && ref > 0) {
    return (raw / ref).toFixed(1);
  }
  return '420.0';
}

export function calculateSparklinePoints(history: number[], width: number = 100, height: number = 40): string {
  if (!history || history.length === 0) return '';
  const minW = Math.min(0, ...history);
  const maxW = Math.max(10, ...history);
  const range = maxW - minW || 1;
  const paddingBottom = 5;
  const usableHeight = height - paddingBottom - 5;

  return history
    .map((val, idx) => {
      const x = (idx / Math.max(1, history.length - 1)) * width;
      const y = (height - paddingBottom) - ((val - minW) / range) * usableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
