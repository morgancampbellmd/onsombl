import { ThemeColor } from 'vscode';
import * as project from '../package.json';

export const EXT_ROOT = project.name;

export enum ServiceName {
  COORDINATOR = 'coordinator'
}

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

export const ExtCommands = {
	OPEN_SESSION: `${EXT_ROOT}.sessionOpen`,
	SEND_INVITE: `${EXT_ROOT}.sessionSendInviteNotification`,
	BEGIN_SESSION: `${EXT_ROOT}.sessionBegin`,
	END_SESSION: `${EXT_ROOT}.sessionEnd`,
  ROTATE_ACTIVE_USERS: `${EXT_ROOT}.peerRotation`,
	PAUSE_TIMER: `${EXT_ROOT}.timerPause`,
	RESUME_TIMER: `${EXT_ROOT}.timerResume`,
  START_TIMER: `${EXT_ROOT}.timerStart`,
  STOP_TIMER: `${EXT_ROOT}.timerStop`,
};


