export type WeightUnit = 'g' | 'oz' | 'ml';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface WeightRecord {
  timestamp: number;
  weightGrams: number;
}
