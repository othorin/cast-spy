const Client                = require('castv2-client').Client;
const mdns                  = require('mdns');
const http                  = require('http');

const spy = new class CastSpy {
  constructor() {
    this.connections = [];
    this.browser = mdns.createBrowser(mdns.tcp('googlecast'));

    this.browser.on('serviceUp', (service) => {
      console.log('device', service.name);
      this.connections.push(new CastConnection(service));
      this.browser.stop();
    });
    this.browser.start();
  }
  getInfo() {
    return this.connections.map(connection => connection.getInfo());
  }
}

class CastConnection {
  constructor(service) {
    this.service = service;
    this.status = {};
    this.client = new Client();
    this.client.on('status', this.onStatus.bind(this));
    this.client.on('error', this.onError.bind(this));
    this.client.connect(service.addresses[0], this.onConnected.bind(this));
  }
  getInfo() {
    return {
      service: this.service,
      status: this.status,
    }
  }
  onConnected() {
    console.log('connected', this.service.name);
  }
  onStatus(status) {
    Object.assign(this.status, status);
    const active =
      this.status.applications &&
      this.status.applications[0] &&
      !this.status.applications[0].isIdleScreen;
    console.log('status', `${this.service.name}: ${active}`);
  }
  onError(error) {
    console.log('error', error.message);
  }
}

http
  .createServer((request, response) => response.end(JSON.stringify(spy.getInfo())))
  .listen(8001, () => console.log('server up'));
