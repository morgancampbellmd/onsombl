import { extensions, window, workspace } from 'vscode';
import { LiveShare, LiveShareExtension } from 'vsls';
import { VSLS_EXT_ID, VSLS_VERSION, EXT_ROOT } from './constants';
import { RaidConfiguration, InviteType, SlackRequestBody } from './configuration';
import { ExtensionModule } from './module';


export async function initApi(): Promise<LiveShare | null> {
  const liveShareExtRef = extensions.getExtension<LiveShareExtension>(VSLS_EXT_ID);
  if (!liveShareExtRef) {
    note.warning('getReference for Live Share Extension failed');
    return null;
  }
  const liveShareApi = await liveShareExtRef.exports.getApi(VSLS_VERSION);

  if (!liveShareApi) {
    note.warning('getApi for Live Share Extension failed');
    return null;
  }

  return liveShareApi;
};


export async function init(): Promise<ExtensionModule> {
  const api = await initApi();
  if (!api) {
    throw new Error(`${EXT_ROOT}: Failed to get Live Share Extension API`);
  }

  return new ExtensionModule(api);
}


const formatMessage = (message: string) => `${EXT_ROOT}: ${message}`;


export const note = {
  information: (message: string, ...items: string[]) => window.showInformationMessage(formatMessage(message), ...items),
  error: (message: string, ...items: string[]) => window.showErrorMessage(formatMessage(message), ...items),
  warning: (message: string, ...items: string[]) => window.showWarningMessage(formatMessage(message), ...items),
};


export async function dispatchInviteEvent(id: string | null, hostEmail?: string | null) {
  const inviteConfig: RaidConfiguration = workspace.getConfiguration('onsombl.inviteConfig');

  if (!inviteConfig?.inviteType) {
    note.information('Unable to send invitation: Invite Type not specified in settings');
    return;
  } else if (!inviteConfig?.inviteUrl) {
    note.information('Unable to send invitation: Invite URL not specified in settings');
    return;
  } else if (!id) {
    note.error('Invite dispatch failed: No session ID has been created yet');
    return;
  } else if (!hostEmail) {
    note.error('Invite dispatch failed: No host email found');
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
