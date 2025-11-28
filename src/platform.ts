import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
//import * as http from 'http';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { OnOffLoad } from './onoffload.js';
//import { Load } from './model/load';
import { FellerWiserClient } from './model/fellerwiserclient.js';
import { Dimmer } from './dimmer.js';
import { Motor } from './motor.js';
//import { Accessory } from 'hap-nodejs';


/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class FellerWiserPlatform implements DynamicPlatformPlugin {
   
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];

  public readonly fellerClient?: FellerWiserClient;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    console.log('Homebridge API version:', api.version);
    log.error('Starting initializing platform:', this.config.name);
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    try {
      this.fellerClient = new FellerWiserClient({
        ip: this.config.ip as string,
        authkey: this.config.authkey as string,
      }, this.log);
    } catch (error) {
      this.log.error('error occured during feller client initialization: ', error);
    }


    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback, discovering new devices and register seen devices');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });

    this.log.info('Finished initializing platform:', this.config.name);

  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.fellerClient?.getLoads()
      .then(loads => {
        for (const load of loads) {
          // edit this as more types are supported than onoff, dim or motor
          if (load.type !== 'onoff' && load.type !== 'dim' && load.type !== 'motor' && load.type !== 'dali') {
            continue;
          }
          const uuid = this.api.hap.uuid.generate(load.device + '-' + load.channel);
          const existingAccessory = this.accessories.get(uuid);
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
            this.log.info('Adding new accessory:', load.name, load.device);
            const accessory = new this.api.platformAccessory(load.name, uuid);
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
