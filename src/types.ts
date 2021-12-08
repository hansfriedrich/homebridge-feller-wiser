import { Load } from './model/load';

export interface WiserAPI {
    getLoads: () => Promise<Load[]>;
}