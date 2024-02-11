import { Uri, extensions, window, workspace } from 'vscode';
import { LiveShare, LiveShareExtension } from 'vsls';
import { Manager } from './manager';
import { VSLS_EXT_ID, VSLS_VERSION, EXT_ROOT } from './contants';
import { RaidConfiguration, InviteType, SlackRequestBody } from './configuration';
import { Timer } from './timer';


export async function initApi(): Promise<LiveShare | null> {
  const liveShareExtRef = extensions.getExtension<LiveShareExtension>(VSLS_EXT_ID);
  if (!liveShareExtRef) {
    console.warn('GetReference for Live Share Extension failed');
    return null;
  }
  const liveShareApi = await liveShareExtRef.exports.getApi(VSLS_VERSION);

  if (!liveShareApi) {
    console.warn('GetApi for Live Share Extension failed');
    return null;
  }

  return liveShareApi;
};

export async function init(): Promise<boolean> {
  if (Manager.ready && Timer.ready) {
    return true;
  }

  const api = await initApi();
  if (!api) {
    window.showErrorMessage(`${EXT_ROOT}: Failed to get Live Share Extension API`);
    return false;
  }

  Manager.init(api);
  Timer.init(api);
  return true;
}

export async function dispatchInviteEvent(id: string | null, hostEmail?: string | null) {
  
  const inviteConfig: RaidConfiguration = workspace.getConfiguration('onsombl.inviteConfig');

  if (!inviteConfig?.inviteType) {
      window.showInformationMessage('Unable to send invitation: Invite Type not specified in settings');
      return;
  } else if (!inviteConfig?.inviteUrl) {
      window.showInformationMessage('Unable to send invitation: Invite URL not specified in settings');
      return;
  } else if (!id) {
      window.showErrorMessage('Invite dispatch failed: No session ID has been created yet');
      return;
  } else if (!hostEmail) {
      window.showErrorMessage('Invite dispatch failed: No host email found');
      return;
  }

  const requestInit: RequestInit = {};

  switch (inviteConfig.inviteType) {
      case InviteType.SLACK:
          const body: SlackRequestBody = {
              host: hostEmail,
              message: 'is forming a raid party!',
              url: `https://prod.liveshare.vsengsaas.visualstudio.com/join?${id}`
          };
          requestInit.body = JSON.stringify(body);
          break;
      case InviteType.EMAIL:
          break;
      default:
          throw new Error(`Unexpected default case for inviteType when opening RaidBar: ${inviteConfig.inviteType}`);
  }

  await fetch(inviteConfig.inviteUrl, requestInit);
}

