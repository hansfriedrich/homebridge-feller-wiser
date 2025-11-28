export interface LoadState{
  bri?: number;
  level?: number;
  tilt?: number;
  moving?: 'down' | 'up' | 'stop';
  /* eslint-disable @typescript-eslint/no-explicit-any */
  flags?: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

}