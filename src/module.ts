import { LiveShare } from 'vsls'
import { Timer } from './timer'
import { Manager } from './manager'
import { Configuration } from './configuration'
import { Coordinator } from './coordinator'


export class ExtensionModule {
  Timer?: Timer
  Manager?: Manager
  Coordinator?: Coordinator
  Configuration?: Configuration

  constructor(
    protected vsls: LiveShare
  ) {
    this.Configuration = new Configuration()
    this.Coordinator = new Coordinator(vsls)
    this.Timer = new Timer(vsls)
    this.Manager = new Manager(vsls, this.Timer, this.Coordinator)
  }


  dispose() {
    this.Timer!.dispose()
    this.Manager!.dispose()
    delete this.Timer
    delete this.Manager
  }
}
