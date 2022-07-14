const { HomebridgePluginUiServer, RequestError} = require('@homebridge/plugin-ui-utils');
const mdns = require('mdns');
const http = require('http');
var browserTimeout = undefined;


class FellerWiserPluginUiServer extends HomebridgePluginUiServer {

  foundDevices = [];

  constructor(){
    super();

    this.onRequest('/getAuthToken', this.getAuthToken.bind(this));
    this.onRequest('/findWiserDevice', this.findWiserDevices.bind(this));

    // this.ready() must be called to let the UI know you are ready to accept api calls
    this.ready();
  }

  


  async findWiserDevices() {

    return new Promise((resolve,reject) => {
      const browser = mdns.createBrowser(mdns.tcp('http'));
      browser.on('serviceUp', service => {
        if (service.name.startsWith('wiser')){
          resolve(service);
        }
      });
      browser.start();
      setTimeout(() => {
        reject();
      }, 5000);
    });
  }

  async getAuthToken(ipAddress){
    return new Promise((resolve, reject) => {
      console.log("gain auth token");
      const data = JSON.stringify({
        'username': 'homebridge-wiser'
      });
      const request = http.request(
        {
          host: ipAddress,
          port: 80,
          path: '/api/account/claim',
          method: 'POST',
          headers:{
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        },
        function(response) {
          console.log(response);
        }

      );
      request.write(data);
      request.end();
      resolve();
    });
  }
}

// start the instance of the class
(() => {
  return new FellerWiserPluginUiServer;
})();
