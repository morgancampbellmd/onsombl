import { StatusBarAlignment, StatusBarItem, window, Disposable } from 'vscode';
import { Activity, LiveShare } from 'vsls';
import { ColorPalette, ExtCommands, tc, EXT_ROOT } from './constants';
import { displayTime } from './displayTime';
import { note } from './utils';

export class Timer {
  private _bar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -3);

  constructor(
    private vsls: LiveShare
  ) {
  }

  readonly eventGroup = `${EXT_ROOT}/${this.constructor.name}`;
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
  get finished() {
    return this.getRemainingMs() <= 0;
  }

  start(duration: number) {
    this._bar.show();
    this._bar.command = ExtCommands.PAUSE_TIMER;
    this.duration = duration;
    this.triggerUpdates(this.start.name);
  }

  pause() {
    this.triggerUpdates(this.pause.name);
    this.haltUpdates();
    this._bar.command = ExtCommands.RESUME_TIMER;
  }

  resume() {
    this.duration = this.getRemainingMs();
    this.triggerUpdates(this.resume.name);
    this._bar.command = ExtCommands.PAUSE_TIMER;
  }

  stop() {
    this.haltUpdates();
    this._bar.command = ExtCommands.START_TIMER;
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

    if (!this.vsls.postActivity) {
      console.warn(`Unable to post activity ${action} for some reason`);
      return;
    }

    this.vsls.postActivity({
      name: `${this.eventGroup}/${action}`,
      data: {
        source: this.vsls.session.peerNumber,
      },
      timestamp: new Date()
    });
  }

  initActivityListener() {
    if (!this.vsls.onActivity) {
      console.warn('OnActivity listener could not be initialized for some reason');
      return;
    }

    this.#activityListenerRef ??= this.vsls.onActivity(this.activityHandler.bind(this));
  }

  activityHandler(event: Activity) {
    if (event.data?.source === this.vsls.session.peerNumber) {
      note.warning(`Saw my own update ${event.name}`);
      return;
    }
    else if (!event.name.startsWith(this.eventGroup)) {
      note.information('Non-timer event', JSON.stringify(event));
      return;
    }

    const newDuration = event.data?.duration || this.#duration;
    const name = event.name;

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
    this._bar.text = this.finished ? 'TAG OUT' : `${displayTime(this.getRemainingMs())} remaining`;
    const refreshRate = this.finished ? 1000 : 100;

    clearTimeout(this.#textUpdateRef);
    this.#textUpdateRef = setTimeout(() => { this.setText(); }, refreshRate);
  }

  private setColor() {
    if (!this.finished) {
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

