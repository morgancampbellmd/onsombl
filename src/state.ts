import { MobPhase } from './constants';

export interface State {
  session: {
    participants: Set<string>;
    phase: MobPhase,
    activeUser?: string;
    timestamp: number;
  };
  settings: {
    turnDuration: number;
  };
}
