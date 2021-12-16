import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { LoadState } from './model/loadstate';

import { FellerWiserPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class OnOffLoad {
  protected service: Service;

  constructor(
    protected readonly platform: FellerWiserPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.load.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    this.platform.fellerClient.loadStateChange.on(this.accessory.context.load.id.toString(), (loadState) => this.updateOn(loadState));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.platform.log.debug('Set Characteristic On ->', value);
    const target_loadstate = <LoadState>{'bri': value? 10000 : 0};
    this.platform.fellerClient.setLoadState(this.accessory.context.load.id, target_loadstate).then((value) => {
      this.platform.log.debug('seted state on ' + this.accessory.context.load.id + ' to value:' + JSON.stringify(value));
      return;
    });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {

    return this.platform.fellerClient.getLoadState(this.accessory.context.load.id).then((value)=> {
      //this.platform.log.debug('Get Characteristic On: ' + value);
      return value.bri !== 0;
    });

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

  }

  //TODO: update this method name to "updateState"
  async updateOn(state: LoadState) : Promise<void> {
    //this.platform.log.debug('update new loadstate on', this.accessory.context.load.id);
    this.service.updateCharacteristic(this.platform.Characteristic.On, state.bri !== 0);
  }
}
