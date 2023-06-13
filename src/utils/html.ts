import { Attributes } from 'node-html-parser/dist/nodes/html';
import './polyfill';

export function camelToSnake(camelCaseString: string): string {
  return camelCaseString.replace(/[A-Z]/g, (match: string, offset: number) => {
    return (offset > 0 ? '_' : '') + match.toLowerCase();
  });
}

export function snakeToCamel(snakeCaseString: string): string {
  return snakeCaseString.replace(/_([a-z])/g, (match: string, capture: string) => {
    return capture.toUpperCase();
  });
}

const _bar = (x: string): string => camelToSnake(x).replace(/_/g, '-');
const _variant = (key: string) => [_bar(key), key, key.toLowerCase()];

export const createObject = <T extends object>(
  keys: Array<keyof T>,
  attrs: Attributes,
  cvrt?: ((key: keyof T, val: string) => T[keyof T]) | undefined,
  dflt?: T | undefined
): T => {
  const ret: T = { ...(dflt ?? {}) } as T;
  for (const key of keys) {
    const [key1, key2, key3] = _variant(String(key));
    const _val = attrs[key1] ?? attrs[key2] ?? attrs[key3];
    if (_val !== undefined)
      ret[key] = (cvrt !== undefined ? cvrt(key, _val) : _val) as T[keyof T];
  }
  return ret;
};


export const infuseObject = <T extends object>(
  keys: Array<keyof T>,
  obj: T, 
  attrs: Attributes,
  cvrt?: ((key: keyof T, val: T[keyof T]) => string | undefined) | undefined,
) => {
  const ret = { ...attrs };
  for (const key of keys) {
    const val = obj[key];
    const valStr = cvrt ? cvrt(key, val) : String(val ?? '');
    let flag = false;
    inner: for (const keyAttr of _variant(String(key))) {
      if (Object.keys(attrs).includes(keyAttr)){
        ret[keyAttr] = valStr ?? '';
        flag = true;
        break inner;
      }
    }
    if (!flag)
      ret[_bar(String(key))] = valStr ?? '';
  }
  return ret;
};