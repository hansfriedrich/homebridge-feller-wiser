import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { LoadState } from './model/loadstate';
import { FellerWiserPlatform } from './platform';




export class Motor {
  protected service : Service;
  protected cachedTargetPosition : CharacteristicValue = -1;

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
    return this.platform.fellerClient.getLoadState(this.accessory.context.load.id).then(
      (loadState) => {
        this.platform.log.debug('received loadstate for ', this.accessory.context.load.id, loadState);
        if (typeof loadState.level !== 'undefined'){
          return loadState.level / 100;
        }
        throw new Error('could not read level of motor ' + this.accessory.context.load.id);
      },
    );
  }

  async getPositionState() : Promise<CharacteristicValue> {
    return this.platform.fellerClient.getLoadState(this.accessory.context.load.id).then((loadState) => {
      switch (loadState.moving){
        case 'stop':
          return this.platform.Characteristic.PositionState.STOPPED;
        case 'up':
          return this.platform.Characteristic.PositionState.INCREASING;
        case 'down':
          return this.platform.Characteristic.PositionState.DECREASING;
        default:
          throw new Error('could not read positionstate for motor ' + this.accessory.context.load.id);
      }
    });
  }

  async getTargetPosition() : Promise<CharacteristicValue>{
    if (this.cachedTargetPosition !== -1) {
      return this.cachedTargetPosition;
    } else {
      return this.getCurrentPosition();
    }
  }

  async setTargetPosition(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug('setTargetPosition ', value);
    if ('number' === typeof value){
      this.cachedTargetPosition = value;
      return this.platform.fellerClient.setLoadState(this.accessory.context.load.id,
        {
          'level' : value * 100,
        });
    }
  }

  async updateState (loadState: LoadState){
    this.platform.log.debug('updateState', loadState);
    if (typeof loadState.moving !== 'undefined'){
      let posState = -1;
      switch(loadState.moving){
        case 'stop':
          this.cachedTargetPosition = -1;
          posState = this.platform.Characteristic.PositionState.STOPPED;
          if (typeof loadState.level !== 'undefined') {
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, loadState.level / 100);
          }
          break;
        case 'down':
          posState = this.platform.Characteristic.PositionState.DECREASING;
          this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, 100);
          break;
        case 'up':
          posState = this.platform.Characteristic.PositionState.INCREASING;
          this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, 0);
          break;
      }
      this.service.updateCharacteristic( this.platform.Characteristic.PositionState, posState);
    }
  }

  async setHoldPosition() : Promise<void> {
    return;
  }
}