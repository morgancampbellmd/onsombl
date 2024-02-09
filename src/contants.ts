import { ThemeColor } from 'vscode';

export const EXT_ROOT = 'onsombl';
export const VSLS_VERSION = '1.0.4753';
export const VSLS_EXT_ID = 'ms-vsliveshare.vsliveshare';

export interface ColorPalette {
  bg: ThemeColor,
  fg: ThemeColor
}

export const tc: Record<string, ColorPalette> = {
  def: {
    bg: new ThemeColor('statusBarItem.prominentBackground'),
    fg: new ThemeColor('statusBarItem.prominentForeground'),
  },
  pos: {
    bg: new ThemeColor('statusBarItem.remoteBackground'),
    fg: new ThemeColor('statusBarItem.remoteForeground')
  },
  neg: {
    bg: new ThemeColor('statusBarItem.errorBackground'),
    fg: new ThemeColor('statusBarItem.errorForeground')
  }
};

export enum ExtCommands {
	OPEN_SESSION = `${EXT_ROOT}.session.open`,
	SEND_INVITE = `${EXT_ROOT}.session.sendInviteNotification`,
	BEGIN_SESSION = `${EXT_ROOT}.session.begin`,
	END_SESSION = `${EXT_ROOT}.session.end`,
	PAUSE_TIMER = `${EXT_ROOT}.timer.pause`,
	RESUME_TIMER = `${EXT_ROOT}.timer.resume`,
  START_TIMER = `${EXT_ROOT}.timer.start`,
  STOP_TIMER = `${EXT_ROOT}.timer.stop`,
}

