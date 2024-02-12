import { LiveShare } from 'vsls';
import { Timer } from './timer';
import { Manager } from './manager';


export class ExtensionModule {
  Timer?: Timer;
  Manager?: Manager;

  constructor(
    protected vsls: LiveShare
  ) {
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