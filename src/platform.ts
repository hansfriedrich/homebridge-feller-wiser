import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
//import * as http from 'http';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { OnOffLoad } from './onoffload';
//import { Load } from './model/load';
import { FellerWiserClient } from './model/fellerwiserclient';
import { Dimmer } from './dimmer';
import { Motor } from './motor';
//import { Accessory } from 'hap-nodejs';


/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class FellerWiserPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly fellerClient: FellerWiserClient;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.fellerClient = new FellerWiserClient(this.config, this.log);


    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback, discovering new devices and register seen devices');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });

    this.log.debug('Finished initializing platform:', this.config.name);

  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.fellerClient.getLoads()
      .then(loads => {
        for (const load of loads) {
          // edit this as more types are supported than onoff, dim or motor
          if (load.type !== 'onoff' && load.type !== 'dim' && load.type !== 'motor' && load.type !== 'dali') {
            continue;
          }
          const uuid = this.api.hap.uuid.generate(load.name + '-' + load.id + '-' + load.channel);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
          if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            switch (load.type) {
              case 'onoff':
                new OnOffLoad(this, existingAccessory);
                break;
              case 'dim':
                new Dimmer(this, existingAccessory);
                break;
              case 'motor':
                new Motor(this, existingAccessory);
                break;
              case 'dali':
                new Dimmer(this, existingAccessory);
            }
          } else {
            this.log.info('Adding new accessory:', load.device);
            const accessory = new this.api.platformAccessory(load.device, uuid);
            accessory.context.load = load;
            switch (load.type) {
              case 'onoff':
                new OnOffLoad(this, accessory);
                break;
              case 'dim':
                new Dimmer(this, accessory);
                break;
              case 'motor':
                new Motor(this, accessory);
                break;
              case 'dali':
                new Dimmer(this, accessory);
                break;
            }
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      })
      .catch(error => {
        this.log.error('error on discovering devices', error);
      });
  }
}
