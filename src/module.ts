import { LiveShare } from 'vsls';
import { Timer } from './timer';
import { Manager } from './manager';
import { Configuration } from './configuration';


export class ExtensionModule {
  Timer?: Timer;
  Manager?: Manager;
  Configuration?: Configuration;

  constructor(
    protected vsls: LiveShare
  ) {
    this.Configuration = new Configuration();
    this.Timer = new Timer(vsls);
    this.Manager = new Manager(vsls, this.Timer);
  }


  dispose() {
    this.Timer!.dispose();
    this.Manager!.dispose();
    delete this.Timer;
    delete this.Manager;
  }
}
