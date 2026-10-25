export type WeightUnit = 'g' | 'oz' | 'ml';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WeightRecord {
  timestamp: number;
  weightGrams: number;
}
