import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { LoadState } from './model/loadstate';
import { FellerWiserPlatform } from './platform';




export class Motor {
  protected service : Service;

  // new model
  protected positionState : CharacteristicValue = 0;
  protected currentPosition : CharacteristicValue = 0;
  protected targetPosition : CharacteristicValue = 0;
  // end new model

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

        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.load.name);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
          .onGet(this.getCurrentPosition.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.PositionState)
          .onGet(this.getPositionState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
          .onGet(this.getTargetPosition.bind(this))
          .onSet(this.setTargetPosition.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.HoldPosition)
          .onSet(this.setHoldPosition.bind(this));


        this.platform.fellerClient.loadStateChange.on(
          this.accessory.context.load.id.toString(),
          (loadState) => this.updateState(loadState));
  }

  async getCurrentPosition() : Promise<CharacteristicValue> {
    return this.currentPosition;
  }

  async getPositionState() : Promise<CharacteristicValue> {
    return this.positionState;
  }

  async getTargetPosition() : Promise<CharacteristicValue>{
    return this.targetPosition;
  }

  async setTargetPosition(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug('setTargetPosition ', value);
    if ('number' === typeof value){
      this.targetPosition = value;
      return this.platform.fellerClient.setLoadState(this.accessory.context.load.id,
        {
          'level' : (100-value) * 100,
        }).then(() => {
        return;
      });
    }
  }

  async updateState (loadState: LoadState){
    this.platform.log.debug('updateState', loadState);

    switch(loadState.moving){
      case 'stop':
        this.positionState = this.platform.Characteristic.PositionState.STOPPED;
        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, (10000-loadState.level!) / 100);
        break;
      case 'down':
        this.positionState = this.platform.Characteristic.PositionState.DECREASING;
        break;
      case 'up':
        this.positionState = this.platform.Characteristic.PositionState.INCREASING;
        break;
    }
    this.service.updateCharacteristic( this.platform.Characteristic.PositionState, this.positionState);

    this.platform.log.debug('setting curr position to ', loadState.level);
    this.currentPosition = (10000-loadState.level!) / 100;
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, (10000-loadState.level!) / 100);

  }

  async setHoldPosition() : Promise<void> {
    this.platform.fellerClient.ctrlLoad(this.accessory.context.load.id, {
      button: 'stop',
      event: 'click',
    });
  }
}