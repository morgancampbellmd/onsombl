import { window, workspace } from 'vscode';
import { getApi as getVSLSApi } from 'vsls';
import { EXT_ROOT } from './constants';
import { RaidConfiguration, InviteType, SlackRequestBody } from './configuration';
import { ExtensionModule } from './module';


export async function init(): Promise<ExtensionModule> {
  const liveShareApi = await getVSLSApi();

  if (!liveShareApi) {
    throw new Error(`${EXT_ROOT}: Failed to get Live Share Extension API`);
  }

  return new ExtensionModule(liveShareApi);
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
