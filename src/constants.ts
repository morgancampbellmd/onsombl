import { ThemeColor } from 'vscode';
import project from '../package.json';

export const EXT_ROOT = project.name;

export enum ServiceName {
  COORDINATOR = 'coordinator'
}

export interface ColorPalette {
  background: ThemeColor;
  foreground: ThemeColor;
}

export const themeColors: Record<string, ColorPalette> = {
  def: {
    background: new ThemeColor('statusBarItem.prominentBackground'),
    foreground: new ThemeColor('statusBarItem.prominentForeground')
  },
  pos: {
    background: new ThemeColor('statusBarItem.remoteBackground'),
    foreground: new ThemeColor('statusBarItem.remoteForeground')
  },
  neg: {
    background: new ThemeColor('statusBarItem.errorBackground'),
    foreground: new ThemeColor('statusBarItem.errorForeground')
  }
};

export const ExtCommands = {
	OPEN_SESSION: `${EXT_ROOT}.sessionOpen`,
	SEND_INVITE: `${EXT_ROOT}.sessionSendInviteNotification`,
	BEGIN_SESSION: `${EXT_ROOT}.sessionBegin`,
	END_SESSION: `${EXT_ROOT}.sessionEnd`,
  ROTATE_ACTIVE_USERS: `${EXT_ROOT}.peerRotation`,
	PAUSE_TIMER: `${EXT_ROOT}.timerPause`,
	RESUME_TIMER: `${EXT_ROOT}.timerResume`,
  START_TIMER: `${EXT_ROOT}.timerStart`,
  STOP_TIMER: `${EXT_ROOT}.timerStop`
};


