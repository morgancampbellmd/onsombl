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

export class Coordinator {
  disposables: Disposable[] = [];
  registeredCommands: string[] = [];

  hostState: State | undefined;
  guestState: State | undefined;

  app?: express.Express;
  httpServer?: http.Server;

  spoke?: socketIOClient.Socket;
  hub?: socketIOServer.Server;

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

    await this.startGuestService();
  }

  async startHostService(e: vsls.SessionChangeEvent) {
    this.hostState = initialState;

    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.hub = new socketIOServer.Server(this.httpServer, {
      serveClient: false,
    });

    this.app.get('/', (req, res) => {
      res.send(this.hostState);
    });

    this.httpServer.listen(this.mainPort, '127.0.0.1', () => {
      console.log('server running at http://localhost:' + this.mainPort);
    });
  
    return this._vsls
      .shareServer({ port: this.mainPort, displayName: 'Onsombl Relay' })
      .then((ref) => {
        this.hub!.on('connection', (socket) => {
          console.log('new connection', socket.id, socket.nsp);
    
          socket.emit('welcome', this.hostState);
          this.initSocketEvents(socket);
        });

        for (const config of project.contributes.commands) {
          if (config.broadcast) {
            const command = formatCommandName(config.command);
            this.registeredCommands.push(command);
            console.log('Hub broadcast command listener:', command);
      
            this.hub!.on(command, (args) => {
              console.log('Hub saw command', command);
              this.hub!.of('/').emit(command, args);
            });
          }
        }
    
        instrument(this.hub!, { auth: false, });
    
        this.hub!.listen(this.mainPort);

        this.disposables.push(ref);
      })
      .catch((err) => console.error('Failed to share server: ', err));
  }


  async startGuestService() {
    this.spoke = socketIOClient.default({
      port: this.mainPort,
      host: '127.0.0.1',
    });

    this.spoke.on('message', (args) => {
      note.info(`client got message initial state ${JSON.stringify(args)}`);
    });

    this.spoke.on('welcome', (args) => {
      note.info(`got initial state ${JSON.stringify(args)}`);
      this.guestState = args;
    });

    this.initSocketEvents(this.spoke);

    this.spoke.connect();
  }



  handleBroadcast(notification: Notification) {
    commands.executeCommand(notification.command, ...notification.payload);
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

    if (this.spoke) {
      this.spoke.emit(command, body);
      this.hub!.emit(command, body);
      console.log('Sent notification!', command);
    }
  }


  dispose() {
    this.hub?.close();
    this.disposables.forEach(disposable => disposable.dispose());
  }

  initSocketEvents(socket: socketIOServer.Socket | socketIOClient.Socket) {
    socket.onAny((eventNames, ...args) => {
      console.log(`Saw ${eventNames} with args ${args}`);
    });
    socket.on('error', (args) => {
      console.log(`\ngot error ${JSON.stringify(args)}\n`);
    });

    for (const config of project.contributes.commands) {
      if (config.broadcast) {
        const command = formatCommandName(config.command);
        console.log('Spoke broadcast command listener:', command, socket.id);
  
        socket.on(command, (args) => {
          console.log('Spoke saw command:', command);

          if (this.isBroadcastPayload(args)) {
            this.handleBroadcast(args);
          }
        });
      }
    }
  }
  
  isBroadcastPayload(p: unknown): p is Notification  {
    return isObj(p)
      && has(p, 'payload', 'object')
      && has(p, 'timestamp', 'string')
      && has(p, 'command', 'string')
      && this.registeredCommands.includes(p.command);
  }

}

