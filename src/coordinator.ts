import express from 'express';
import * as http from 'http';
import socketIOServer from 'socket.io';
import * as socketIOClient from 'socket.io-client';
import { Disposable, commands } from 'vscode';
import * as vsls from 'vsls';
import project from '../package.json';
import { State } from './state';
import { formatCommandName, has, isObj, note } from './utils';
import { instrument } from '@socket.io/admin-ui';
import { EXT_ROOT, MobPhase } from './constants';


export class Notification {
  timestamp: number = Date.now();
  constructor(
    public command: string,
    public payload: any[]
  ) {}
}

const initialState: State = {
  session: {
    participants: new Set(),
    phase: MobPhase.INACTIVE,
    activeUser: undefined,
    timestamp: Date.now()
  },
  settings: {
    turnDuration: 0
  },
};

export class Coordinator {
  disposables: Disposable[] = [];
  registeredCommands: string[] = [];

  hostState: State | undefined;
  guestState: State | undefined;

  app?: express.Express;
  httpServer?: http.Server;

  client?: socketIOClient.Socket;
  server?: socketIOServer.Server;

  readonly mainPort = 4236;

  constructor (
    private readonly _vsls: vsls.LiveShare
  ) {
    this._vsls.onDidChangeSession(this.handleSessionChange.bind(this), this.disposables);
  }

  async handleSessionChange(e: vsls.SessionChangeEvent) {

    switch (e.session.role) {
      case vsls.Role.Host:
        await this.startHostService(e);
        break;
      case vsls.Role.Guest:
      case vsls.Role.None:
    }

    // Host will also have a copy of guestServices
    await this.startGuestService();
  }

  async startHostService(e: vsls.SessionChangeEvent) {
    this.hostState = initialState;

    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.server = new socketIOServer.Server(this.httpServer, {
      serveClient: false,
    });

    // this.app.get('/', (req, res) => {
    //   res.send(this.hostState);
    // });

    this.httpServer.listen(this.mainPort, '127.0.0.1', () => {
      console.log('server running at http://localhost:' + this.mainPort);
    });
  
    const vslsServer = await this._vsls.shareServer({ port: this.mainPort, displayName: 'Onsombl Relay' });

    this.server!.on('connection', (socket) => {
      console.log('new connection', socket.id);
      this.initSocketEvents(socket);

      socket.emit('welcome', this.hostState);
    });

    for (const config of project.contributes.commands) {
      if (config.broadcast) {
        const command = formatCommandName(config.command);
        this.registeredCommands.push(command);
        console.log('Hub broadcast command listener:', command);
  
        this.server!.on(command, (args) => {
          console.log('Hub saw command', command);
          this.server!.of('/').emit(command, args);
        });
      }
    }
    instrument(this.server!, { auth: false, });
    this.server!.listen(this.mainPort);

    this.disposables.push(vslsServer);
  }


  async startGuestService() {
    this.client = socketIOClient.default({
      port: this.mainPort,
      host: '127.0.0.1',
    });

    this.client.on('message', (args) => {
      note.info(`client got message initial state ${JSON.stringify(args)}`);
    });

    this.client.on('welcome', (args) => {
      note.info(`got initial state ${JSON.stringify(args)}`);
      this.guestState = args;
    });

    this.initSocketEvents(this.client);
    this.client.connect();
  }



  handleBroadcast(notification: unknown) {

    if (this.isBroadcastPayload(notification)) {
      const {
        command, payload
      } = notification;
      console.log('Spoke saw command:', command);
      commands.executeCommand(
        command.startsWith(EXT_ROOT) ? command : `${EXT_ROOT}.${command}`,
        ...payload
      );
    }
  }


  registerBroadcast: typeof commands.registerCommand = (command, cb, thisArg?) => {
    return commands.registerCommand(command, (...args: any[]) => {
      this.send(command, args);
      return cb(args);
    }, thisArg);
  };


  send(name: string, args: any) {
    const command = formatCommandName(name);
    const payload = Array.isArray(args) ? args : [args];

    const body = new Notification(command, payload);

    if (this.client) {
      this.client.emit(command, body);
      this.server!.emit(command, body);
      console.log('Sent notification!', command);
    }
  }


  dispose() {
    this.server?.close();
    this.disposables.forEach(disposable => disposable.dispose());
  }

  initSocketEvents(socket: socketIOServer.Socket | socketIOClient.Socket) {
    socket.on('error', (args) => {
      console.log(`\ngot error ${JSON.stringify(args)}\n`);
    });

    for (const config of project.contributes.commands) {
      if (config.broadcast) {
        const command = formatCommandName(config.command);
        console.log('Spoke broadcast command listener:', command, socket.id);
  
        socket.on(command, this.handleBroadcast.bind(this));
      }
    }
  }
  
  isBroadcastPayload(p: unknown): p is Notification  {
    if (!isObj(p)) {
      return false;
    }
    return has(p, 'payload', 'object')
      && has(p, 'timestamp', 'string')
      && has(p, 'command', 'string');
  }

}

