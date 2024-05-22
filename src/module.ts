import { LiveShare, getApi as getVSLSApi } from 'vsls';
import { Timer } from './timer';
import { Manager } from './manager';
import { Configuration } from './configuration';
import { Coordinator } from './coordinator';
import { EXT_ROOT, ExtCommands } from './constants';


export namespace ext {
  export let timer: Timer;
  export let manager: Manager;
  export let coordinator: Coordinator;
  export let configuration: Configuration;
  export let vsls: LiveShare;

  export const cmd = ExtCommands;

  export async function init(extensionId: string) {
    const liveShareApi = await getVSLSApi(extensionId);
  
    if (!liveShareApi) {
      throw new Error(`${EXT_ROOT}: Failed to get Live Share Extension API`);
    }

    vsls = liveShareApi;
    configuration = new Configuration();
    coordinator = new Coordinator(vsls);
    timer = new Timer(vsls);
    manager = new Manager(vsls, timer, coordinator);
  }


  export function dispose() {
    coordinator.dispose();
    timer.dispose();
    manager.dispose();
  }
}
