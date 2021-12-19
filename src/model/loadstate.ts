export interface LoadState{
  bri?: number;
  level?: number;
  tilt?: number;
  moving?: 'down' | 'up' | 'stop';
  flags?: any;
}