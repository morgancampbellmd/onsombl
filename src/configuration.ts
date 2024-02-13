import { WorkspaceConfiguration, workspace } from 'vscode';

export enum InviteType {
  SLACK = 'slack',
  EMAIL = 'email',
}

export interface SlackRequestBody {
  message: string;
  host: string;
  url: string;
}

export interface IConfig {
  webhookType?: InviteType;
  webhookUrl?: string;
}

export class Configuration {
  readonly webhookType?: InviteType;
  readonly webhookUrl?: string;

  constructor() {
    const extConfig: WorkspaceConfiguration = workspace.getConfiguration('onsombl');
    if (!extConfig.has('inviteConfig')) {
      throw new Error('No configuration for extension found');
    }
    this.webhookType = extConfig.get<InviteType>('inviteConfig.webhookType');
    this.webhookUrl = extConfig.get<string>('inviteConfig.webhookUrl');

  }
}
