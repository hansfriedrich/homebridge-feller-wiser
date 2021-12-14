
import { Logger } from 'homebridge';
import fetch from 'node-fetch';
import { JSendResponse } from './JSendResponse';
import { Load } from './load';
import { LoadState } from './loadstate';
import WebSocket = require('websocket');
import { EventEmitter } from 'stream';


export class FellerWiserClient{
  private authkey: string;
  private authToken : string | undefined;
  private log : Logger;
  private websocket : WebSocket.client;
  private baseUrl: string;
  private loadstates : Map<number, LoadState>;
  public loadStateChange : EventEmitter;

  constructor(config, log) {
    this.log = log;
    this.authkey = config.authkey;
    this.log.debug('feller client built');
    this.websocket = new WebSocket.client();
    this.baseUrl = 'http://' + config.ip + '/api';
    this.loadstates = new Map<number, LoadState>();
    this.loadStateChange = new EventEmitter();

    const connect = () => {
      this.websocket.connect('ws://' + config.ip + '/api', '', undefined, {'Authorization': 'Bearer ' + config.authkey} );
    };

    this.websocket.on('connectFailed', (error) => {
      this.log.error('websocket connection failed with', error);
    });

    this.websocket.on('connect', (connection) => {
      // when the websocket connection is established read the load states
      this.log.debug('websocket connection established');
      this.log.debug('requesting dump_load');
      connection.send(JSON.stringify({'command': 'dump_loads'}));

      connection.on('error', (error) => {
        this.log.error('connection error', error.toString());
      });

      connection.on('close', () => {
        this.log.debug('websocket connection closed... reconnecting');
        connect();
      });

      connection.on('message', (message) => {
        // when a new message is received, add the loadstate to the cache
        if (message.type === 'utf8'){
          const jsonMessage = JSON.parse(message.utf8Data);
          const id = jsonMessage.load.id as number;
          const loadstate = jsonMessage.load.state as LoadState;

          // write the received state to the state cache
          this.loadstates.set(id, loadstate);
          this.log.debug('new loadstate for ', id, 'to', loadstate);

          // inform the listeners for this load
          this.loadStateChange.emit(id.toString(), loadstate);

        }

      });
    });
    // finally establish the connection to the websocket
    connect();
  }


  async getLoads() : Promise<Load[]>{
    // fetch the loads through the http-api
    const result = await fetch (this.baseUrl + '/loads', {headers: {'Authorization': 'Bearer ' + this.authkey}})
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        this.log.debug(json);
        if (json.status === 'error'){
          this.log.error('error occured', json.message);
        }
        const loads = json.data as Load[];
        return loads;
      });
    return result;
  }

  async getLoadState(id: number) : Promise<LoadState>{
    this.log.debug('getLoadstate for id ' + id);

    const loadstate = this.loadstates.get(id);
    if (loadstate){
      this.log.debug('found loadstate for id', id, 'in cache. Returning', loadstate);
      return loadstate;
    } else{
      this.log.debug('fetching loadstate via api', this.baseUrl + '/loads/' + id + '/state');
      return fetch(this.baseUrl + '/loads/' + id + '/state', {headers: {'Authorization': 'Bearer ' + this.authkey}})
        .then((response) => {
          return response.json() as JSendResponse;
        })
        .then((response) => {
          this.log.debug('received', response.data.state as LoadState);
          return response.data.state as LoadState;
        });
    }
  }

  async setLoadState(id: number, state: LoadState): Promise<void>{
    this.log.debug('setLoadstate for id ' + id);

    this.log.debug('requesting ', this.baseUrl + '/loads/' + id + '/target_state', 'with state', state);
    return fetch(this.baseUrl + '/loads/' + id + '/target_state', {
      headers: {'Authorization': 'Bearer ' + this.authToken},
      method: 'put',
      body: JSON.stringify(state),
    })
      .then((response) => {
        return response.json();
      });

  }

}

