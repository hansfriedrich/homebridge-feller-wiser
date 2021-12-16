
import { Logger } from 'homebridge';
import fetch from 'node-fetch';
import { JSendResponse } from './JSendResponse';
import { Load } from './load';
import { LoadState } from './loadstate';
import { EventEmitter } from 'stream';
import WebSocket from 'ws';
import { LoadCtrl } from '../types';


export class FellerWiserClient{
  private authkey: string;
  private authToken : string | undefined;
  private log : Logger;
  private websocket : WebSocket;
  private baseUrl: string;
  public loadStateChange : EventEmitter;

  constructor(config, log) {
    this.log = log;
    this.authkey = config.authkey;
    this.log.debug('feller client built');
    this.websocket = new WebSocket('ws://' + config.ip + '/api', [], {headers: {'Authorization': 'Bearer ' + config.authkey}} );
    this.baseUrl = 'http://' + config.ip + '/api';
    this.loadStateChange = new EventEmitter();


    this.websocket.on('error', (error) => {
      this.log.error('connection error', error.toString());
    });

    this.websocket.on('close', () => {
      this.log.error('websocket connetion closed');
    });

    this.websocket.on('message', (message) => {
      const jsonMessage = JSON.parse(message.toLocaleString());
      const id = jsonMessage.load.id as number;
      const loadstate = jsonMessage.load.state as LoadState;

      // inform the listeners for this load
      this.loadStateChange.emit(id.toString(), loadstate);
    });
    // finally establish the connection to the websocket
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

    this.log.debug('fetching loadstate via API', this.baseUrl + '/loads/' + id + '/state');
    return fetch(this.baseUrl + '/loads/' + id + '/state', {headers: {'Authorization': 'Bearer ' + this.authkey}})
      .then((response) => {
        return response.json() as JSendResponse;
      })
      .then((response) => {
        return response.data.state as LoadState;
      });

  }

  async setLoadState(id: number, state: LoadState): Promise<void>{
    this.log.debug('setLoadstate for id ' + id);
    return fetch(this.baseUrl + '/loads/' + id + '/target_state', {
      headers: {'Authorization': 'Bearer ' + this.authToken},
      method: 'put',
      body: JSON.stringify(state),
    })
      .then((response) => {
        return response.json();
      });

  }

  async ctrlLoad(id: number, loadCtrl : LoadCtrl){
    return fetch(this.baseUrl + '/loads/' + id + '/ctrl', {
      headers: {'Authorization': 'Bearer ' + this.authToken},
      method: 'put',
      body: JSON.stringify(loadCtrl),
    })
      .then((response) => {
        return response.json();
      });
  }

}

