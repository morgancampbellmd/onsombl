import * as vsls from 'vsls';
import { EXT_ROOT, ServiceName } from './constants';
import { Disposable, commands } from 'vscode';
import project from '../package.json';
import { has, isObj } from './utils';
import * as http from 'http';
import * as net from 'net';


const formatBroadcastCommand = (name: string): string => name.startsWith(EXT_ROOT) ? name : [EXT_ROOT, name].join('.');
const isBroadcastCommand = (name: unknown): name is string =>
  typeof name === 'string'
  && name.split('.').length > 2
  && name.split('.')[0] === EXT_ROOT
  && name.split('.')[1] === ServiceName.COORDINATOR;

const isCoordinatorPayload = (p: unknown): p is Notification => isObj(p)
  && has(p, 'payload', 'object')
  && has(p, 'sourceId', 'string');

const isExternal = (notification: Notification, currentUser: vsls.UserInfo | null) => notification.userId !== currentUser?.id;

const host = '127.0.0.1';
const hostPort = 4236;
const guestPort = hostPort + 1;
const url = `http://${host}:${hostPort}/`;
const hostConnection: net.SocketConnectOpts = {
  port: hostPort,
  keepAlive: true,
  host,
};

export interface Notification {
  userId: string | undefined;
  timestamp: number;
  command: string;
  payload: any[];
}

export class Coordinator {
  service: vsls.SharedService | vsls.SharedServiceProxy | null = null;
  disposables: Disposable[] = [];
  server: http.Server | null = null;
  history: Notification[] = [];
  myPort?: number;

  connections: net.Socket[] = [];

  decoder = new TextDecoder();
  encoder = new TextEncoder();
  
  constructor (
    private readonly _vsls: vsls.LiveShare
  ) {
    this._vsls.onDidChangeSession(this.initService.bind(this), this.disposables);
  }

  async initService(e: vsls.SessionChangeEvent) {
    this.myPort = e.session.role === vsls.Role.Host ? hostPort : guestPort;
    this.server = new http.Server({
      keepAlive: true
    });
    const sock = this.server.listen(this.myPort, host);
    if (!this.server) {
      console.error('Failed to initialize server');
      return;
    }
    this.initListener(this.server);

    if (e.session.role === vsls.Role.Host) {
      console.log('Getting shared service');
      const vslsServer = await this._vsls.shareServer({ port: hostPort, displayName: 'Onsombl Relay' });
      this.disposables.push(vslsServer);
    } else {

    }
  }


  initListener(server: http.Server) {
    server.on('request', this.handleHTTPRequest.bind(this));
    server.on('connection', this.handleConnection.bind(this));
    setInterval(() => {
      console.log('Current connections', this.server!.connections);
    }, 3000);
  }

  handleConnection = (socket: net.Socket) => {
    const address = socket.address();
    this.connections.push(socket);
    console.log('Connecting', address);
    let _data = '';


    socket.on('data', (data) => {
      _data += data.toString();
    });
    socket.on('end', () => {
      this.parseMessage(_data);
      _data = '';
    });
    socket.on('close', (e) => {
      if (e) {
        console.error(`Connection ${address} closed with error`);
      }
    });
    

    // send status of rotations
    // add user to rotation?
  };

  handleHTTPRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (!req.headers.authorization) {
      console.debug(`Received smelly request: ${req.headers.authorization}`);
      res.writeHead(400, 'Unauthorized', {});
      res.end('Unauthorized');
      console.log('Rejected request');
    } else {
      req.on('data', this.parseMessage.bind(this));
      req.on('end', () => {
        res.writeHead(200, 'OK', {});
        res.end('OK');
        console.log('Resolved request');
      });
    }
  };

  parseMessage(data: any) {
    let parsed;

    try {
      parsed = JSON.parse(this.decoder.decode(data));
      this.handleBroadcast(parsed);
    } catch (e) {
      console.log('Failed to parse incoming request', e, data);
      return;
    }
  }

  handleBroadcast(notification: object) {
    if (isCoordinatorPayload(notification) && isBroadcastCommand(notification.payload[0].name)) {
      const name = notification.command;
      const args = notification.payload;
      console.log('Coordinator payload!', notification);
      if (isExternal(notification, this._vsls.session.user)) {
        commands.executeCommand(name.split('.').at(-1)!, ...args);
        
      }
    }
  }


  registerBroadcast: typeof commands.registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable => {
    return commands.registerCommand(command, (...args: any[]) => {
      this.send(command, args);
      return callback(args);
    }, thisArg);
  };


  send(name: string, args: any) {
    const fullCommand = formatBroadcastCommand(name);
    const body: Notification = {
      command: fullCommand,
      timestamp: Date.now(),
      payload: Array.isArray(args) ? args : [args],
      userId: this._vsls.session.user?.id
    };
    const payload = this.encoder.encode(JSON.stringify(body));


    this.writeConnections.forEach((socket) => {
      socket.write(payload, (error) => {
        if (error) {
          console.error('Failed while trying to send update to', socket.address());
        } else {
          // console.log('Successfully wrote')
        }
        socket.end();
      });
    });

    console.log('Sent notification!', fullCommand);
    // commands.executeCommand(fullCommand);
  }

  get writeConnections() {
    switch (this._vsls.session.role) {
      case vsls.Role.Host:
        return this.connections;

      case vsls.Role.Guest:
        return [this.connections[0]];

      case vsls.Role.None:
      default:
        console.error('Not in a session somehow?');
        return [];
    }
  }


  dispose() {
    this.server?.close();
    this.connections.forEach(socket => socket.destroy());
    this.disposables.forEach(disposable => disposable.dispose());
  }
}
