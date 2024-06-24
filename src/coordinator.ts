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
    await this.startHostService(e);
  
    if (e.session.role === vsls.Role.Host) {
      await this.askUserToShareServer();
    }

    // Host will also have a copy of guestServices
    await this.startGuestService();
  }

  async startHostService(e: vsls.SessionChangeEvent) {
    this.hostState = initialState;

    this.initializeHostSocket();


    this.server!.on('connection', (socket) => {
      this.initSocketEvents(socket);
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

    instrument(this.server!, { auth: false });
    this.server!.listen(this.mainPort);
  }


  private initializeHostSocket() {
    this.app = express();
    this.httpServer = http.createServer(this.app);

    this.server = new socketIOServer.Server(this.httpServer, { serveClient: false, });

    this.httpServer.listen(this.mainPort, '127.0.0.1', () => {
      console.log('onsombl server running at http://127.0.0.1:' + this.mainPort);
    });
  }

  private async askUserToShareServer() {
    const server = await this._vsls.shareServer({ port: this.mainPort, displayName: 'Onsombl Relay' });
    this.disposables.push(server);
    return;
  }

  async startGuestService() {
    this.client = socketIOClient.default('127.0.0.1', {
      port: this.mainPort,
    }).connect();

    this.client.on('message', (args) => {
      note.info(`client got message initial state ${JSON.stringify(args)}`);
    });

    this.client.on('welcome', (args) => {
      note.info(`got initial state ${JSON.stringify(args)}`);
      this.guestState = args;
    });

    this.initSocketEvents(this.client);
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
      console.log('Client Sent notification!', command);
    }
    if (this.server) {
      this.server.emit(command, body);
      console.log('Server Sent notification!', command);
    }
  }


  initSocketEvents(socket: socketIOServer.Socket | socketIOClient.Socket) {
    console.log('new connection', socket.id);
    socket.on('error', (args) => {
      console.log(`\ngot error ${JSON.stringify(args)}\n`);
    });

    socket.on('message', (args) => {
      console.log(`\ngot message ${JSON.stringify(args)}\n`);
    });

    for (const config of project.contributes.commands) {
      if (config.broadcast) {
        const command = formatCommandName(config.command);
        console.log('Spoke broadcast command listener:', command, socket.id);
  
        socket.on(command, this.handleBroadcast.bind(this));
      }
    }

    socket.emit('welcome', this.hostState);
  }

  handleBroadcast(notification: unknown) {
    if (this.isBroadcastPayload(notification)) {
      const {
        command, payload
      } = notification;
      console.log('Spoke saw command:', command);
      commands.getCommands().then((cmds) => {
        console.log(cmds);

        commands.executeCommand(
          command.startsWith(EXT_ROOT) ? command : `${EXT_ROOT}.${command}`,
          ...payload
        );
      });
    }

  }
  
  isBroadcastPayload(p: unknown): p is Notification  {
    if (!isObj(p)) {
      return false;
    }
    return has(p, 'payload', 'object')
      && has(p, 'timestamp', 'number')
      && has(p, 'command', 'string');
  }


  dispose() {
    this.server?.close();
    this.disposables.forEach(disposable => disposable.dispose());
  }
}

