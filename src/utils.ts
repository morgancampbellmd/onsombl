import { window, workspace } from 'vscode';
import { getApi as getVSLSApi } from 'vsls';
import { EXT_ROOT } from './constants';
import { IConfig, InviteType, SlackRequestBody } from './configuration';
import { ExtensionModule } from './module';
import pkg from '../package.json';


export async function init(): Promise<ExtensionModule> {
  const liveShareApi = await getVSLSApi();

  if (!liveShareApi) {
    throw new Error(`${EXT_ROOT}: Failed to get Live Share Extension API`);
  }

  return new ExtensionModule(liveShareApi);
}


const formatMessage = (message: string) => `${EXT_ROOT}: ${message}`;


export const note = {
  info: (message: string, ...items: string[]) => window.showInformationMessage(formatMessage(message), ...items),
  error: (message: string, ...items: string[]) => window.showErrorMessage(formatMessage(message), ...items),
  warn: (message: string, ...items: string[]) => window.showWarningMessage(formatMessage(message), ...items),
};


export async function dispatchInviteEvent(id: string | null, hostEmail?: string | null) {
//   const propertyNames = Object.keys(pkg.contributes.configuration.properties);

//   const inviteConfig: IConfig = workspace.getConfiguration('onsombl.inviteConfig');

//   if (!inviteConfig) {
//     note.error('Failed to find extension configuration');
//     return;
//   } else if (!inviteConfig.webhookType) {
//     note.info('Unable to send invitation: Invite Type not specified in settings');
//     return;
//   } else if (!inviteConfig.webhookUrl) {
//     note.info('Unable to send invitation: Invite URL not specified in settings');
//     return;
//   } else if (!id) {
//     note.error('Invite dispatch failed: No session ID has been created yet');
//     return;
//   } else if (!hostEmail) {
//     note.error('Invite dispatch failed: No host email found');
//     return;
//   }

//   const requestInit: RequestInit = {};

//   switch (inviteConfig.webhookType) {
//     case InviteType.SLACK:
//       const body: SlackRequestBody = {
//         host: hostEmail,
//         message: 'is forming a raid party!',
//         url: `https://prod.liveshare.vsengsaas.visualstudio.com/join?${id}`
//       };
//       requestInit.body = JSON.stringify(body);
//       break;
//     case InviteType.EMAIL:
//       break;
//     default:
//       throw new Error(`Unexpected default case for inviteType when opening RaidBar: ${inviteConfig.webhookType}`);
//   }

//   // await fetch(inviteConfig.inviteUrl, requestInit);
}
