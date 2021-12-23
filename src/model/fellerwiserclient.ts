
import { Logger } from 'homebridge';
import fetch from 'node-fetch';
import { JSendResponse } from './JSendResponse';
import { Load } from './load';
import { LoadState } from './loadstate';
import { EventEmitter } from 'stream';
import { LoadCtrl } from '../types';
import WebSocket from 'ws';


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
    this.loadStateChange = new EventEmitter();

    const createWebSocket = (ip = config.ip, authkey = config.authkey) => {
      const result = new WebSocket('ws://' + ip + '/api', [], {headers: {'Authorization': 'Bearer ' + authkey}} );

      result.on('message', (message) => {
        this.log.debug('message received', message.toLocaleString());
        const jsonMessage = JSON.parse(message.toLocaleString());
        const id = jsonMessage.load.id as number;
        const loadstate = jsonMessage.load.state as LoadState;
        // inform the listener(s) for this load
        this.loadStateChange.emit(id.toString(), loadstate);
      });

      result.on('open', () => {
        this.log.debug('websocket opened, sending command "dump_loads"');
        result.send(JSON.stringify({'command': 'dump_loads'}));

        const keepalive = setInterval(() => {
          result.ping((error) => {
            if (error) {
              this.log.error('error on keepalive websocket', error);
              // if readystate = 3 (CLOSED) => reconnect
              if (this.websocket.readyState === 3){
                this.log.error('reconnecting');
                this.websocket = createWebSocket();
              }
              clearInterval(keepalive);
            }
          });
          this.log.debug('ping sent');
        }, 3600000 );
      });

      result.on('close', (code, data) => {
        this.log.error('websocket connetion closed with code', code, 'reason: ', data.toString(), '... reconnecting');
        this.websocket = createWebSocket();
      });

      result.on('error', (error) => {
        this.log.error('error occured on websocket', error.message, '... reconnecting');
        this.websocket = createWebSocket();
      });

      return result;
    };

    this.websocket = createWebSocket(config.ip, config.authkey);
    this.baseUrl = 'http://' + config.ip + '/api';
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

  // dont use this method for getting a single load - they will be emitted via the websocket (see constructor)
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

  // sets the load state of the specified load with the given id
  async setLoadState(id: number, state: LoadState): Promise<LoadState>{
    this.log.debug('setLoadstate for id ' + id);
    return fetch(this.baseUrl + '/loads/' + id + '/target_state', {
      headers: {'Authorization': 'Bearer ' + this.authToken},
      method: 'put',
      body: JSON.stringify(state),
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.status === 'success'){
          return json.data as LoadState;
        } else {
          throw new Error(json.message);
        }
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

