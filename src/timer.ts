import { StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { LiveShare } from 'vsls';
import { ColorPalette, ExtCommands, tc } from './contants';
import { displayTime } from './utils';

export class Timer {
  private _bar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -3);
  static #instance: Timer | undefined;
  static init(vsls: LiveShare) {
    this.#instance = new Timer(vsls);
  }

  constructor(private vsls: LiveShare) {
  }

  static get instance() {
    if (!Timer.#instance) {
      throw new TypeError('Tried to access timer after it was disposed');
    }
    return Timer.#instance;
  }

  get color(): Partial<ColorPalette> {
    return {
      fg: this._bar.color,
      bg: this._bar.backgroundColor
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

  get remainingMs() {
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
    return this.remainingMs <= 0;
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
        name: event,
        timestamp: new Date()
      });
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
    this.duration = this.remainingMs;
    this.triggerUpdates(this.resume.name);
    this._bar.command = ExtCommands.PAUSE_TIMER;
  }

  public stop() {
    this.haltUpdates();
    this._bar.command = ExtCommands.START_TIMER;
  }

  private setText() {
    this._bar.text = this.finished ? 'TAG OUT' : `${displayTime(this.remainingMs)} remaining`;
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
        const data = event.data || this.#duration;
        const name = event.name;
        switch (name) {
          case 'resume':
            this.resume(); break;
          case 'pause':
            this.pause(); break;
          case 'start':
            this.start(data); break;
          case 'stop':
            this.stop(); break;
          default:
            console.log('Non-timer event', JSON.stringify(event));
        }
      });
    }
  }

  public dispose() {
    this.haltUpdates();
    this._bar.dispose();
    Timer.#instance = undefined;
  }
}

