import { window } from 'vscode';
import { getApi as getVSLSApi } from 'vsls';
import { EXT_ROOT } from './constants';
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
  info: (message: string, ...items: string[]) => window.showInformationMessage(formatMessage(message), ...items),
  error: (message: string, ...items: string[]) => window.showErrorMessage(formatMessage(message), ...items),
  warn: (message: string, ...items: string[]) => window.showWarningMessage(formatMessage(message), ...items),
};
