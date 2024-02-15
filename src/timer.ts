import { StatusBarAlignment, StatusBarItem, window, Disposable } from 'vscode';
import { Activity, LiveShare } from 'vsls';
import { ColorPalette, ExtCommands, tc, EXT_ROOT } from './constants';
import { displayTime } from './displayTime';
import { note } from './utils';

export class Timer {
  readonly eventGroup = `${EXT_ROOT}/${this.constructor.name}`;
  readonly _bar: StatusBarItem;
  readonly _vsls: LiveShare;

  constructor(
    vsls: LiveShare
  ) {
    this._vsls = vsls;
    this._bar = window.createStatusBarItem(StatusBarAlignment.Left, -3);
  }

  get color(): Partial<ColorPalette> {
    return {
      bg: this._bar.backgroundColor,
      fg: this._bar.color,
    };
  }
  set color(c: ColorPalette) {
    this._bar.backgroundColor = c.bg;
    this._bar.color = c.fg;
  }

  #textUpdateRef: NodeJS.Timeout | undefined;
  #colorUpdateRef: NodeJS.Timeout | undefined;
  #endTime = Date.now();
  #duration = 0;
  #remainingMs = 0;
  #activityListenerRef: Disposable | undefined;


  getRemainingMs() {
    if (this.#textUpdateRef) {
      this.#remainingMs = this.#endTime - Date.now();
    }
    return this.#remainingMs;
  }

  get duration() {
    return this.#duration;
  }
  set duration(ms: number) {
    this.#duration = ms;
    this.#endTime = ms + Date.now();
  }

  start(duration: number) {
    this._bar.show();
    this._bar.command = ExtCommands.PAUSE_TIMER;
    this.duration = duration;
    this.triggerUpdates(this.start.name);
  }

  pause() {
    this._bar.show();
    this._bar.command = ExtCommands.RESUME_TIMER;
    this.triggerUpdates(this.pause.name);
    this.haltUpdates();
  }

  resume() {
    this.duration = this.getRemainingMs();
    this._bar.show();
    this._bar.command = ExtCommands.PAUSE_TIMER;
    this.triggerUpdates(this.resume.name);
  }

  stop() {
    this._bar.show();
    this._bar.command = ExtCommands.START_TIMER;
    this.haltUpdates();
  }

  haltUpdates() {
    if (this.#textUpdateRef?.hasRef()) {
      clearTimeout(this.#textUpdateRef);
    }
    if (this.#colorUpdateRef?.hasRef()) {
      clearTimeout(this.#colorUpdateRef);
    }
    this.#textUpdateRef = this.#colorUpdateRef = undefined;
  }

  triggerUpdates(action: string) {
    this.dispatchAction(action);

    this.setText();
    this.setColor();
  }

  dispatchAction(action: string) {
    this.initActivityListener();

    if (!this._vsls.postActivity) {
      console.warn(`Unable to post activity ${action} for some reason`);
      return;
    }

    this._vsls.postActivity({
      name: `${this.eventGroup}/${action}`,
      data: {
        source: this._vsls.session.peerNumber,
      },
      timestamp: new Date()
    });
  }

  initActivityListener() {
    if (!this._vsls.onActivity) {
      console.warn('OnActivity listener could not be initialized for some reason');
      return;
    }

    this.#activityListenerRef ??= this._vsls.onActivity(this.activityHandler.bind(this));
  }

  activityHandler(event: Activity) {
    if (event.data?.source === this._vsls.session.peerNumber) {
      note.warn(`Saw my own update ${event.name}`);
      return;
    }
    else if (!event.name.startsWith(this.eventGroup)) {
      note.info('Non-timer event', JSON.stringify(event));
      return;
    }

    const newDuration = event.data?.duration || this.#duration;

    // name shape will look like onsombl/timer/start
    const name = event.name.split('/').at(-1);

    switch (name) {
      case 'resume':
        return this.resume();
      case 'pause':
        return this.pause();
      case 'start':
        return this.start(newDuration);
      case 'stop':
        return this.stop();
      default:
        throw new Error(`Unexpected default case in Timer.startRemoteListener.onActivity ${JSON.stringify(event)}`);
    }
  }


  dispose() {
    this.haltUpdates();
    this._bar.dispose();
    this.#activityListenerRef && this.#activityListenerRef.dispose();
  }

  private setText() {
    const remainingMs = this.getRemainingMs();
    const refreshRate = remainingMs <= 0 ? 1000 : 100;

    if (remainingMs <= 0) {
      this._bar.command = ExtCommands.ROTATE_ACTIVE_USERS;
    }

    switch (this._bar.command) {
      case ExtCommands.START_TIMER:
        this._bar.text = 'STOPPED (restart)';
        break;
      case ExtCommands.RESUME_TIMER:
        this._bar.text = `${displayTime(remainingMs)} remaining (resume)`;
        break;
      case ExtCommands.PAUSE_TIMER:
        this._bar.text = `${displayTime(remainingMs)} remaining (pause)`;
        break;
      case ExtCommands.ROTATE_ACTIVE_USERS:
        this._bar.text = `TIME'S UP (rotate)`;
    }

    clearTimeout(this.#textUpdateRef);
    this.#textUpdateRef = setTimeout(() => { this.setText(); }, refreshRate);
  }

  private setColor() {
    if (this._bar.command !== ExtCommands.ROTATE_ACTIVE_USERS) {
      this.color = tc.def;
    } else if (this.color.bg === tc.neg.bg) {
      this.color = tc.pos;
    } else {
      this.color = tc.neg;
    }

    clearTimeout(this.#colorUpdateRef);
    this.#colorUpdateRef = setTimeout(() => { this.setColor(); }, 1000);
  }
}

