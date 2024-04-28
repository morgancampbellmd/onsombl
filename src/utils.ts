import { window } from 'vscode';
import { EXT_ROOT } from './constants';


const formatMessage = (message: string) => `${EXT_ROOT}: ${message}`;

export const note = {
  info: (message: string, ...items: string[]) => window.showInformationMessage(formatMessage(message), ...items),
  error: (message: string, ...items: string[]) => window.showErrorMessage(formatMessage(message), ...items),
  warn: (message: string, ...items: string[]) => window.showWarningMessage(formatMessage(message), ...items)
};

interface Primitives {
  'any': any;
  'bigint': bigint;
  'boolean': boolean;
  'number': number;
  'object': object;
  'string': string;
  'symbol': symbol;
  'undefined': undefined;
  'unknown': unknown;
}
type PrimitivesArray = {
  [key in keyof Primitives]: Array<Primitives[key]>;
};

type PrimitivesS<K extends keyof Primitives> = `${K}[]`;


export const isObj = (u: unknown): u is NonNullable<object> => typeof u === 'object' && u !== null;
export const has = <
O extends object,
P extends string | number | symbol,
T extends keyof Primitives = 'unknown'
>(
  o: O, p: P, t?:  T
): o is O & Record<P, T> => {
  const v = Object.getOwnPropertyDescriptor(o, p)?.value;
  if (v) {
    if (!t || typeof v === t) {
      return true;
    }
  }
  return false;
};
