import express from 'express';
import * as http from 'http';
import socketIOServer from 'socket.io';
import { Disposable, commands } from 'vscode';
import * as vsls from 'vsls';
import project from '../package.json';
import { State } from './state';
import { has, isObj } from './utils';
import { instrument } from '@socket.io/admin-ui';
import { MobPhase } from './constants';


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

const port = 4236;

export class Coordinator {
  disposables: Disposable[] = [];

  hostState: State = initialState;
  guestState: State | undefined;

  app?: express.Express;
  httpServer?: http.Server;

  server?: socketIOServer.Server;

  constructor (
    private readonly _vsls: vsls.LiveShare
  ) {
    this._vsls.onDidChangeSession(this.handleSessionChange.bind(this), this.disposables);
  }

  async handleSessionChange(e: vsls.SessionChangeEvent) {
    await this.startHostService();
  
    if (e.session.role === vsls.Role.Host) {
      await this.askUserToShareServer();
    }
  }

  async startHostService() {
    const server = this.initializeHostSocket();
    if (!server) return;


    server.on('connection', (socket) => {
      socket.emit('welcome', this.hostState);
      this.initSocketEvents(socket);
    });

    for (const { broadcast, command } of project.contributes.commands) {
      if (broadcast) {
  
        server.on(command, (args) => {
          console.log('Hub saw command', command);
          server.emit(command, args);
        });
      }
    }

    instrument(server, { auth: false });

    server.listen(port);
  }


  initializeHostSocket() {
    const app = express();
    const httpServer = http.createServer(app);

    const server = new socketIOServer.Server(httpServer, { serveClient: false, allowUpgrades: true });

    httpServer.listen(port, 'localhost', () => {
      console.log(`onsombl server running at http://127.0.0.1:${port}`);
    });

    return server;
  }

  async askUserToShareServer() {
    const server = await this._vsls.shareServer({ port });
    this.disposables.push(server);
    return;
  }



  registerBroadcast: typeof commands.registerCommand = (command, cb, thisArg?) => {
    return commands.registerCommand(command, (...args: any[]) => {
      this.send(command, args);
      return cb(args);
    }, thisArg);
  };


  send(command: string, args: any) {
    const payload = [args].flat();

    const body = new Notification(command, payload);

    if (this.server) {
      this.server.emit(command, body);
      console.log('Server Sent notification!', command);
    }
  }


  initSocketEvents(socket: socketIOServer.Socket) {
    console.log('new connection', socket.id);
    socket.on('error', (args) => {
      console.log(`\ngot error ${JSON.stringify(args)}\n`);
    });

    socket.on('message', (args) => {
      console.log(`\ngot message ${JSON.stringify(args)}\n`);
    });

    for (const { broadcast, command } of project.contributes.commands) {
      if (broadcast) {
        console.log('Spoke broadcast command listener:', command, socket.id);
  
        socket.on(command, this.handleBroadcast.bind(this));
      }
    }
  }

  handleBroadcast(notification: unknown) {
    if (this.isBroadcastPayload(notification)) {
      const { command, payload } = notification;

      console.log('Spoke saw command:', command);

      commands.executeCommand(command, ...payload);
    }
  }
  
  isBroadcastPayload(p: unknown): p is Notification  {
    if (!isObj(p)) {
      return false;
    }
    return has(p, 'payload', 'object')
      && has(p, 'command', 'string');
  }


  dispose() {
    this.server?.close();
    this.disposables.forEach(disposable => disposable.dispose());
  }
}

