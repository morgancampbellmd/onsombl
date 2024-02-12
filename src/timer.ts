import { StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { LiveShare } from 'vsls';
import { ColorPalette, ExtCommands, tc, EXT_ROOT } from './constants';
import { displayTime } from './displayTime';
import { note } from './utils';

export class Timer {
  private _bar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -3);

  constructor(
    private vsls: LiveShare
  ) {
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

  readonly eventGroup = `${EXT_ROOT}/${this.constructor.name}`;

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


  public haltUpdates() {
    if (this.#textUpdateRef?.hasRef()) {
      clearTimeout(this.#textUpdateRef);
    }
    if (this.#colorUpdateRef?.hasRef()) {
      clearTimeout(this.#colorUpdateRef);
    }
    this.#textUpdateRef = this.#colorUpdateRef = undefined;
  }

  public triggerUpdates(event: string) {
    if (this.vsls.postActivity) {
      this.vsls.postActivity({
        name: `${this.eventGroup}/${event}`,
        data: {
          source: this.vsls.session.peerNumber,
        },
        timestamp: new Date()
      });
      note.information(`Posted activity!: ${event}`);
    }

    this.setText();
    this.setColor();
  }

  public start(duration: number) {
    this._bar.show();
    this._bar.command = ExtCommands.PAUSE_TIMER;
    this.duration = duration;
    this.triggerUpdates(this.start.name);
  }

  public pause() {
    this.triggerUpdates(this.pause.name);
    this.haltUpdates();
    this._bar.command = ExtCommands.RESUME_TIMER;
  }

  public resume() {
    this.duration = this.getRemainingMs();
    this.triggerUpdates(this.resume.name);
    this._bar.command = ExtCommands.PAUSE_TIMER;
  }

  public stop() {
    this.haltUpdates();
    this._bar.command = ExtCommands.START_TIMER;
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

  startRemoteListener() {
    if (this.vsls.onActivity) {
      this.vsls.onActivity((event) => {

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
      });
    }
  }

  public dispose() {
    this.haltUpdates();
    this._bar.dispose();
  }
}

