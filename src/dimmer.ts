import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { LoadState } from './model/loadstate';
import { OnOffLoad } from './onoffload';

import { FellerWiserPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Dimmer extends OnOffLoad{

  protected brightness : CharacteristicValue;

  constructor(
    protected readonly platform: FellerWiserPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    this.brightness = 0;
  }

  async setBrightness(value : CharacteristicValue) : Promise<void>{
    this.platform.log.debug('setBrightness', value);
    if ('number' === typeof value){
      const loadstate = <LoadState>{ 'bri' : value * 100};
      return this.platform.fellerClient?.setLoadState(this.accessory.context.load.id, loadstate).then(() => {
        return;
      });
    }
  }

  async getBrightness() : Promise<CharacteristicValue> {
    return this.brightness;
  }

  async updateOn(state: LoadState){
    super.updateOn(state);
    if (typeof state.bri !== 'undefined'){
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, state.bri / 100);
      this.brightness = state.bri / 100;
      this.on = state.bri !== 0;
    }
  }
}
