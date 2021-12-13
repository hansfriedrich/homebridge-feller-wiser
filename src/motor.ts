import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { LoadState } from './model/loadstate';
import { FellerWiserPlatform } from './platform';




export class Motor {
  protected service : Service;

  constructor (
        protected readonly platform : FellerWiserPlatform,
        protected readonly accessory: PlatformAccessory,
  ){
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Feller')
          .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

        this.service = this.accessory.getService(this.platform.Service.WindowCovering)
        || this.accessory.addService(this.platform.Service.WindowCovering);

        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
          .onGet(this.getCurrentPosition.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.PositionState)
          .onGet(this.getPositionState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
          .onGet(this.getTargetPosition.bind(this))
          .onSet(this.setTargetPosition.bind(this));

        this.platform.fellerClient.loadStateChange.on(
          this.accessory.context.load.id.toString(),
          (loadState) => this.updateState(loadState));
  }

  async getCurrentPosition() : Promise<CharacteristicValue> {
    return true;
  }

  async getPositionState() : Promise<CharacteristicValue> {
    return true;
  }

  async getTargetPosition() : Promise<CharacteristicValue>{
    return true;
  }

  async setTargetPosition(value: CharacteristicValue): Promise<void> {
    return;
  }

  async updateState (loadState: LoadState){
    return;
  }
}