/* eslint-disable @typescript-eslint/no-explicit-any */
const pAssign = <T extends object, U>(target: T, ...sources: U[]): T & U => {
  if (target === undefined || target === null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const output = Object(target);
  for (let index = 1; index < sources.length; index++) {
    const source = sources[index];
    if (source !== undefined && source !== null) {
      for (const nextKey in source) {
        if (Object.hasOwnProperty.call(source, nextKey)) {
          output[nextKey] = source[nextKey];
        }
      }
    }
  }
  return output;
};

const pIsNaN = (value: any): boolean => {
  return value !== null // Number(null) => 0
    && (value != value // NaN != NaN
      || +value != value // Number(falsy) => 0 && falsy == 0...
    );
};

const pIsFinite = (value: any) => {
  // 1. If Type(number) is not Number, return false.
  if (!(value instanceof Number) || typeof value !== 'number') {
    return false;
  }
  // 2. If number is NaN, +∞, or −∞, return false.
  if (value !== value || value === Infinity || value === -Infinity) {
    return false;
  }
  // 3. Otherwise, return true.
  return true;
};

const pObjIs = (x: any, y: any) => {
  if (x === y) {
    // 0 === -0, but they are not identical
    return x !== 0 || 1 / x === 1 / y;
  }

  // NaN !== NaN, but they are identical.
  // NaNs are the only non-reflexive value, i.e., if x !== x,
  // then x is a NaN.
  // isNaN is broken: it converts its argument to number, so
  // isNaN("foo") => true
  return x !== x && y !== y;
};

const pInclude = function <T>(this: T[], searchElement: T, fromIndex = 0): boolean {
  if (!Number.isNaN(searchElement) && Number.isFinite(fromIndex) && typeof searchElement !== 'undefined') {
    return this.indexOf.call(this, searchElement, fromIndex) > -1;
  }

  const O = Object(this), length = parseInt(O.length);
  if (length <= 0) {
    return false;
  }
  let k = fromIndex >= 0 ? fromIndex : Math.max(0, length + fromIndex);
  while (k < length) {
    if (Object.is(searchElement, O[k])) {
      return true;
    }
    k += 1;
  }
  return false;
};

const pStartsWith = function(this: string, search: string, pos?: number): boolean {
  pos = !pos || pos < 0 ? 0 : +pos;
  return this.substring(pos, pos + search.length) === search;
};


declare global {
  interface NumberConstructor {
    isNaN(elem: any): boolean;
    isFinite(elem: any): boolean;
  }
  interface ObjectConstructor {
    is(x: any, y: any): boolean;
    assign<T extends object, U>(target: T, ...sources: U[]): T & U;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Array<T> {
    include<T>(this: T[], searchElement: T, fromIndex?: number): boolean;
  }
  interface String {
    startsWith(this: string, search: string, pos?: number): boolean;
  }
}

const _f = <T>(target: T, key: keyof T, value: T[keyof T]) => {
  if (!target[key])
    Object.defineProperty(target, key, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true,
    });
};

_f(Number, 'isNaN', pIsNaN);
_f(Number, 'isFinite', pIsFinite);
_f(Object, 'is', pObjIs);
_f(Object, 'assign', pAssign);
_f(Array.prototype, 'include', pInclude);
_f(String.prototype, 'startsWith', pStartsWith);

export default {};