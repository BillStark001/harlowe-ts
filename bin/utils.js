/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @param {string} camelCaseString 
 * @returns {string}
 */
function camelToSnake(camelCaseString) {
  return camelCaseString.replace(/[A-Z]/g, (match, offset) => {
    return (offset > 0 ? '_' : '') + match.toLowerCase();
  });
}

/**
 * @param {string} snakeCaseString 
 * @returns {string}
 */
function snakeToCamel(snakeCaseString) {
  return snakeCaseString.replace(/_([a-z])/g, (match, capture) => {
    return capture.toUpperCase();
  });
}


/**
 * @typedef {import('node-html-parser/dist/nodes/html').Attributes} A
 */

/** @param {string} x */
const _bar = (x) => camelToSnake(x).replace(/_/g, '-');

/**
 * @template T extends object
 * @param {Array<keyof T>} keys
 * @param {A} attrs
 * @param {((key: keyof T, val: string) => T[keyof T]) | undefined} cvrt
 * @param {T | undefined} dflt
 * @return {T}
 */
const createObject = (keys, attrs, cvrt, dflt) => {
  /** @type {T} */
  // @ts-ignore
  const ret = dflt ?? {};
  for (const key of keys) {
    const _key = _bar(String(key));
    // @ts-ignore
    const _val = attrs[_key] ?? attrs[key];
    if (_val !== undefined)
      // @ts-ignore
      ret[key] = cvrt !== undefined ? cvrt(key, _val) : _val;
  }
  return ret;
};

/**
 * @template T extends object
 * @param {Array<keyof T>} keys
 * @param {A | undefined} dflt
 * @param {((key: keyof T, val: T[keyof T]) => string | undefined) | undefined} cvrt
 * @param {T} obj
 * @return {A}
 */
const createAttribute = (keys, obj, cvrt, dflt) => {
  const ret = dflt ?? {};
  for (const key of keys) {
    const _key = _bar(String(key));
    const retKey = cvrt !== undefined ? cvrt(key, obj[key]) : String(obj[key]);
    if (retKey !== undefined) 
      ret[_key] = retKey;
  }
  return ret;
};

module.exports = {
  camelToSnake, 
  snakeToCamel,
  createObject,
  createAttribute,
};