import { window } from 'vscode';
import { getApi as getVSLSApi } from 'vsls';
import { EXT_ROOT } from './constants';
import { ExtensionModule } from './module';


export async function init(extensionId: string): Promise<ExtensionModule> {
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
  warn: (message: string, ...items: string[]) => window.showWarningMessage(formatMessage(message), ...items)
};

interface Primitives {
  'any': any
  'string': string
  'number': number
  'bigint': bigint
  'boolean': boolean
  'symbol': symbol
  'undefined': undefined
  'object': object
  'unknown': unknown
}

export const isObj = (u: unknown): u is NonNullable<object> => typeof u === 'object' && u !== null;
export const has = <
O extends object,
P extends string | number | symbol,
T extends keyof Primitives = 'unknown'
>(
  o: O, p: P, t?: T
): o is O & Record<P, Primitives[T]> =>
has(o, p) && (!t || typeof o[p] === t);
