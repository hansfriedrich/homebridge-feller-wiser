import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { LoadState } from './model/loadstate';
import { OnOffLoad } from './onoffload';

import { FellerWiserPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Dimmer extends OnOffLoad {

  protected brightness: Promise<CharacteristicValue>;

  constructor(
    protected readonly platform: FellerWiserPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    this.brightness = new Promise(resolve => resolve(0));
  }

  async setBrightness(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug('setBrightness', value);
    if ('number' === typeof value) {
      const loadstate = <LoadState>{ 'bri': value * 100 };
      this.brightness = new Promise(resolve => {
        this.platform.fellerClient?.setLoadState(this.accessory.context.load.id, loadstate).then((loadstate) => {
          resolve(loadstate.bri!);
        });
      });
    }
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.brightness;
  }

  async updateOn(state: LoadState) {
    super.updateOn(state);
    if (typeof state.bri !== 'undefined') {
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, state.bri / 100);
      this.brightness = new Promise(resolve => resolve(state.bri! / 100));
    }
  }
}
