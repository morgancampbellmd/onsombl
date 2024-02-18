import { LiveShare, Role, SharedService, SharedServiceProxy, SessionChangeEvent } from 'vsls'
import { EXT_ROOT, ServiceName } from './constants'
import { Disposable, commands } from 'vscode'
import project from '../package.json'
import { has, isObj } from './utils'
import { log } from 'console'

interface Notification {
  sourceId: string | undefined // userId
  payload: any[]
}

export class Coordinator {
  service: SharedService | SharedServiceProxy | null = null
  disposables: Disposable[] = []

  constructor (
    private readonly _vsls: LiveShare
  ) {
    _vsls.onDidChangeSession(
      async (event) => {
        log('Session change event')
        await this.initService(event.session.role)
      },
      this,
      this.disposables
    )
  }

  async initService(role: Role) {

    let sharedService: SharedService | SharedServiceProxy | null
    const broker = await this._vsls.services.getRemoteServiceBroker()
    broker?.getProxy({''})
    if (role === Role.Host) {
      log('Sharing service')
      sharedService = await this._vsls.shareService(ServiceName.COORDINATOR)
    } else {
      log('Getting shared service')
      sharedService = await this._vsls.getSharedService(ServiceName.COORDINATOR)
    }
    log('Got service', sharedService)
    this.service = sharedService
    this.initListener()
  }

  dispose() {
    this.disposables.forEach(disposable => disposable.dispose())
  }


  async getService(role: Role) {
    try {
    } catch (e) {
      console.error(e)
    }
  }


  getServiceFactory(role: Role) {
  }


  initListener() {
    for (const { command, broadcast } of project.contributes.commands) {
      if (broadcast) {
        this.service?.onNotify(command, this.handleBroadcast.bind(this, command))
      }
    }
  }


  handleBroadcast(name: string, notification: object) {
    console.log('Received notification!', name)
    if (isCoordinatorPayload(notification) && isBroadcastCommand(name) && notification.sourceId !== this._vsls.session.user?.id) {
      console.log('Coordinator payload!', notification)
      const args = notification.payload

      commands.executeCommand(name.split('.').at(-1)!, ...args)
    } else {
      console.log('Discarded irrelevant notification...')
    }
  }


  registerBroadcast: typeof commands.registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable => {
    return commands.registerCommand(command, (...args: any[]) => {
      console.log('Saw wrapped command')
      this.send(command, args)
      return callback(args)
    }, thisArg)
  }


  send(name: string, args: any) {
    if (!this.service?.isServiceAvailable) {
      return
    }

    const body: Notification = {
      payload: Array.isArray(args) ? args : [args],
      sourceId: this._vsls.session.user?.id
    }

    this.service.notify(formatBroadcastCommand(name), body)
    console.log('Sent notification!', formatBroadcastCommand(name))
  }

}


const formatBroadcastCommand = (name: string): string => [EXT_ROOT, ServiceName.COORDINATOR, name].join('.')
const isBroadcastCommand = (name: unknown): name is string => typeof name === 'string' && name.split('.').length > 2 && name.split('.')[0] === EXT_ROOT && name.split('.')[1] === ServiceName.COORDINATOR
const isCoordinatorPayload = (n: unknown): n is Notification => isObj(n) && has(n, 'payload', 'object') && Array.isArray(n.payload) && has(n, 'origin', 'string')