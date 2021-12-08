
import { Logger } from 'homebridge';
import fetch from 'node-fetch';
import { Load } from './load';
import { LoadState } from './loadstate';

export class FellerWiserClient {
  private username: string;
  private password: string;
  private baseUrl : string;
  private authToken : string | undefined;
  private log : Logger;

  constructor(config, log) {
    this.log = log;
    this.username = config.username;
    this.password = config.password;
    this.baseUrl = 'http://' + config.ip + '/api/';
    this.log.debug('feller client built');
  }

  async getLoads() : Promise<Load[]>{
    if (!this.authToken){
      await this.auth();
    }

    const response = await fetch (this.baseUrl + 'loads', {headers: {'Cookie': 'auth='+ this.authToken}});
    const result = await response.json();
    if (result.status === 'error'){
      this.log.debug('status', result.status);
    }

    //this.log.debug(result);

    return result.data as Promise<Load[]>;
  }

  async auth() {
    this.log.debug('starting auth');
    const response = await fetch(this.baseUrl + '../login', {
      method: 'POST',
      body: JSON.stringify({
        'username' : this.username,
        'password' : this.password,
      }),
    });
    await response;
    const setCookie = response.headers.raw()['set-cookie'].pop() as string;
    const matchArray = setCookie.match('(?=.*auth=(?<token>[0-9a-f]+))(?=.*Max-Age=(?<maxage>\\d+))');
    const groups = matchArray?.groups;
    if (groups){
      this.authToken = groups['token'];
      const maxage = parseInt(groups['maxage']);
      setTimeout(() => {
        this.authToken = undefined;
        this.log.debug('auth-token invalid due to timeout');
      }, maxage * 1000);
    }
  }

  async getLoadState(id: number) : Promise<LoadState>{
    this.log.debug('getLoadstate for id ' + id);
    if (!this.authToken){
      await this.auth();
    }
    return await fetch(this.baseUrl + 'loads/' + id + '/state', {headers: {'Cookie': 'auth=' + this.authToken}}).then((response) => {
      this.log.debug('response', response);
      return response.json() as Promise<LoadState>;
    });
  }

}

