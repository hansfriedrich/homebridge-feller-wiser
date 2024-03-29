import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { LoadState } from './model/loadstate';
import { FellerWiserPlatform } from './platform';


/*
Motors are intent to be used as a WindowCovering.
Current Position and Target Position have a range from 0-100 whereas 0 is closed and 100 is open.
Meanwhile the wiser-api responds with ranges from 0-10000 where 0 is open and 10000 is closed
*/

export class Motor {
  protected service: Service;

  // new model
  protected positionState = 0;
  protected currentPosition = 0;
  protected targetPosition = 0;
  // end new model

  constructor(
    protected readonly platform: FellerWiserPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Feller AG')
      .setCharacteristic(this.platform.Characteristic.Model, 'undefined')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.UUID);

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


    this.platform.fellerClient?.loadStateChange.on(
      this.accessory.context.load.id.toString(),
      (loadState) => this.updateState(loadState));
  }

  async getCurrentPosition(): Promise<CharacteristicValue> {
    return this.currentPosition;
  }

  async getPositionState(): Promise<CharacteristicValue> {
    return this.positionState;
  }

  async getTargetPosition(): Promise<CharacteristicValue> {
    return this.targetPosition;
  }

  async setTargetPosition(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug('setTargetPosition ', value);
    if ('number' === typeof value) {
      this.targetPosition = value;
      return this.platform.fellerClient?.setLoadState(this.accessory.context.load.id,
        {
          'level': this.convertLevelFromHB2Wiser(value),
        })
        .then(() => {
          this.targetPosition = value;
        });
    }
  }

  async updateState(loadState: LoadState) {
    this.platform.log.debug('updateState', loadState);

    switch (loadState.moving) {
      case 'stop':
        this.positionState = this.platform.Characteristic.PositionState.STOPPED;
        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.convertLevelFromWiser2HB(loadState.level!));
        this.targetPosition = this.convertLevelFromWiser2HB(loadState.level!);
        break;
      case 'down':
        this.positionState = this.platform.Characteristic.PositionState.DECREASING;
        break;
      case 'up':
        this.positionState = this.platform.Characteristic.PositionState.INCREASING;
        break;
    }
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.convertLevelFromWiser2HB(loadState.level!));
    this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);

    this.currentPosition = this.convertLevelFromWiser2HB(loadState.level!);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.convertLevelFromWiser2HB(loadState.level!));

    this.platform.log.debug('position state', this.positionState);
    this.platform.log.debug('current position', this.currentPosition);
    this.platform.log.debug('target position', this.targetPosition);
  }

  async setHoldPosition(): Promise<void> {
    this.platform.fellerClient?.ctrlLoad(this.accessory.context.load.id, {
      button: 'stop',
      event: 'click',
    });
  }

  convertLevelFromHB2Wiser = (level: number) => (100 - level) * 100;
  convertLevelFromWiser2HB = (level: number) => 100 - ((level / 100)>>0);
}