import { LiveShare, Role, SharedService, SharedServiceProxy, SessionChangeEvent, Server as VslsServer } from 'vsls';
import { EXT_ROOT, ServiceName } from './constants';
import { Disposable, commands } from 'vscode';
import project from '../package.json';
import { has, isObj } from './utils';
import { log } from 'console';
import { Server as NodeServer, createServer } from 'node:http';

interface Notification {
  sourceId: string | undefined // userId
  payload: any[]
}

export class Coordinator {
  service: SharedService | SharedServiceProxy | null = null;
  disposables: Disposable[] = [];
  server: NodeServer | null = null;

  constructor (
    private readonly _vsls: LiveShare
  ) {
    
    _vsls.onDidChangeSession(
      async (event) => {
        log('Session change event');
        await this.initService(event.session.role);
      },
      this.disposables
    );
  }

  async initService(role: Role) {
    const hostname = '127.0.0.1';
    const port = 3000;

    if (role === Role.Host) {
      const server = createServer((req, res) => {
        res.statusCode = 200;
      });
      this.server = server;
    
      this.server!.listen(port, hostname, () => {
        log(`Server listening on http://${hostname}:${port}/`);
      });
    } else {
      const svc = await this._vsls.getSharedService('onsombl server');
      const svr = await this._vsls.services.guestChannelService?.connectToChannel('onsombl server');
      const brk = await this._vsls.presenceProviders;
      log('Getting shared service');
    }

    log('Sharing service');
    this.disposables.push(await this._vsls.shareServer({ port, displayName: 'onsombl server' }));

    this.initListener();
  }

  dispose() {
    this.disposables.forEach(disposable => disposable.dispose());
  }


  async getService(role: Role) {
    try {
    } catch (e) {
      console.error(e);
    }
  }


  getServiceFactory(role: Role) {
  }


  initListener() {

    this.server!.on('request', (req, res) => {
      const stream = req.read();
      log(stream);
    });

    for (const { command, broadcast } of project.contributes.commands) {
      if (broadcast) {
        this.service?.onNotify(command, this.handleBroadcast.bind(this, command));
      }
    }
  }


  handleBroadcast(name: string, notification: object) {
    console.log('Received notification!', name);
    if (
      isCoordinatorPayload(notification)
      && isBroadcastCommand(name)
      && notification.sourceId !== this._vsls.session.user?.id
    )
    {
      console.log('Coordinator payload!', notification);
      const args = notification.payload;

      commands.executeCommand(name.split('.').at(-1)!, ...args);
    }
    else
    {
      console.log('Discarded irrelevant notification...');
    }
  }


  registerBroadcast: typeof commands.registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable => {
    return commands.registerCommand(command, (...args: any[]) => {
      console.log('Saw wrapped command');
      this.send(command, args);
      return callback(args);
    }, thisArg);
  };


  send(name: string, args: any) {
    if (!this.service?.isServiceAvailable) {
      return;
    }

    const body: Notification = {
      payload: Array.isArray(args) ? args : [args],
      sourceId: this._vsls.session.user?.id
    };

    this.service.notify(formatBroadcastCommand(name), body);
    console.log('Sent notification!', formatBroadcastCommand(name));
  }

}


const formatBroadcastCommand = (name: string): string => [EXT_ROOT, ServiceName.COORDINATOR, name].join('.');
const isBroadcastCommand = (name: unknown): name is string => typeof name === 'string' && name.split('.').length > 2 && name.split('.')[0] === EXT_ROOT && name.split('.')[1] === ServiceName.COORDINATOR;
const isCoordinatorPayload = (n: unknown): n is Notification => isObj(n) && has(n, 'payload', 'object') && Array.isArray(n.payload) && has(n, 'origin', 'string');