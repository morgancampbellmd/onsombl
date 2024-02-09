import { WorkspaceConfiguration } from 'vscode';

export enum InviteType {
  SLACK = 'slack',
  EMAIL = 'email',
}

export interface SlackRequestBody {
  message: string;
  host: string;
  url: string;
}

export interface RaidConfiguration extends WorkspaceConfiguration {
  readonly inviteType?: InviteType | null;
  readonly inviteUrl?: string | null;
}

export class ConfigurationManager {
  
}