import { Attributes } from 'node-html-parser/dist/nodes/html';


function camelToSnake(camelCaseString: string): string {
  return camelCaseString.replace(/[A-Z]/g, (match: string, offset: number) => {
    return (offset > 0 ? '_' : '') + match.toLowerCase();
  });
}

function snakeToCamel(snakeCaseString: string): string {
  return snakeCaseString.replace(/_([a-z])/g, (match: string, capture: string) => {
    return capture.toUpperCase();
  });
}

const _bar = (x: string): string => camelToSnake(x).replace(/_/g, '-');

const createObject = <T extends object>(
  keys: Array<keyof T>,
  attrs: Attributes,
  cvrt: ((key: keyof T, val: string) => T[keyof T]) | undefined,
  dflt: T | undefined
): T => {
  const ret: T = dflt ?? {} as T;
  for (const key of keys) {
    const _key = _bar(String(key));
    const _val = attrs[_key] ?? attrs[key as string];
    if (_val !== undefined)
      ret[key] = (cvrt !== undefined ? cvrt(key, _val) : _val) as T[keyof T];
  }
  return ret;
};

/**
 * @template T extends object
 * @param {Array<keyof T>} keys
 * @param {Attributes | undefined} dflt
 * @param {((key: keyof T, val: T[keyof T]) => string | undefined) | undefined} cvrt
 * @param {T} obj
 * @return {Attributes}
 */
const createAttribute = <T extends object>(
  keys: Array<keyof T>,
  obj: T,
  cvrt: ((key: keyof T, val: T[keyof T]) => string | undefined) | undefined,
  dflt: Attributes | undefined
): Attributes => {
  const ret: Attributes = dflt ?? {};
  for (const key of keys) {
    const _key = _bar(String(key));
    const retKey = cvrt !== undefined ? cvrt(key, obj[key]) : String(obj[key]);
    if (retKey !== undefined)
      ret[_key] = retKey;
  }
  return ret;
};

export {
  camelToSnake,
  snakeToCamel,
  createObject,
  createAttribute,
};
