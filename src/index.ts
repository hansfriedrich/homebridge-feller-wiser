import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import { FellerWiserPlatform } from './platform.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  console.log('REGISTERED PLATFORM NAME:', PLATFORM_NAME);
  api.registerPlatform(PLATFORM_NAME, FellerWiserPlatform);
};


