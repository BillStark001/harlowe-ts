#!/usr/bin/env node
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { parse } = require('node-html-parser');
const { createObject } = require('./utils');

/**
 * @typedef {import('node-html-parser/dist/nodes/html').Attributes} A
 */

/**
 * @typedef {import('../dist/src/project').StoryData} StoryData
 * @typedef {import('../dist/src/project').PassageDescriptor} PassageDescriptor
 * @typedef {import('../dist/src/project').PassageContentDescriptor} PassageContentDescriptor
 */

/**
 * @param {string | undefined} inStr
 * @returns {[number, number] | undefined}
 */
const parseNumberPair = (inStr) => {
  const ret = inStr?.trim().split(/,\s*/);
  if (ret == undefined || ret.length == 0 || (ret.length == 1 && ret[0] == ''))
    return undefined;
  const retNum = ret
    .map((x) => Number(x))
    .map((x) => (isNaN(x) || !isFinite(x) ? 0 : x));
  return [retNum[0] ?? 0, retNum[1] ?? 0];
};

/**
 * @param {string} html
 * @return {StoryData | undefined}
 */
const convertToStoryForm = (html) => {
  const root = parse(html);

  // prepare data
  const storyRoot = root.querySelector('tw-storydata');
  if (!storyRoot) {
    return undefined;
  }
  const attrs = storyRoot.attrs;
  const tags = storyRoot.querySelectorAll('tw-tag');
  const passages = storyRoot.querySelectorAll('tw-passagedata');

  /** @type {StoryData} */
  const ret = {
    desc: {
      name: '',
      ifid: attrs.ifid,
      startPassage: '',
      meta: {},
      options: {},
    },
    debugOptions: {},
    tags: [],
    passages: [],
    contents: [],
  };

  // form options
  const attrTags = (attrs.tags || '').split(/\s/).filter((x) => !!x);
  attrTags.forEach((b) => {
    if (!ret.desc.options) ret.desc.options = {};
    if (b === 'uncompressed-pure-values' || b === 'uncompressed-saves')
      ret.desc.options.uncompressedPureValues = true;
    if (b === 'uncompressed-structures' || b === 'uncompressed-saves')
      ret.desc.options.uncompressedStructures = true;
  });

  // form debug options
  createObject(
    [
      'debug',
      'evalReplay',
      'ignoreClickEvents',
      'ignoreGotos',
      'speedMultiplier',
    ],
    (attrs.options || '')
      .split(/\s/)
      .reduce(
        (/** @type {A} */ acc, curr) => ((acc[curr] = ''), acc),
        /** @type {A} */ {}
      ),
    (k, v) => (k === 'speedMultiplier' ? Number(v) : true),
    ret.debugOptions
  );

  // form meta
  createObject(
    ['creator', 'creatorVersion', 'format', 'formatVersion'],
    attrs,
    undefined,
    ret.desc.meta
  );

  if (attrs.zoom && ret.desc.options !== undefined)
    ret.desc.options.zoom = Number(attrs.zoom);

  // build passage record
  tags.forEach((tag) => {
    ret.tags.push({
      name: tag.attrs.name || '',
      color: tag.attrs.color || tag.attrs.colour,
    });
  });
  passages.forEach((passage) => {
    const attrs = passage.attrs;
    const content = passage.text;
    const name = attrs.name ?? (attrs.pid && `#${attrs.pid}`) ?? '';

    ret.passages.push({
      name: name,
      pid: attrs.pid ? Number(attrs.pid) : undefined,
      tags: attrs.tags?.split(/\s/).filter((x) => !!x),
      position: parseNumberPair(attrs.position),
      size: parseNumberPair(attrs.size),
    });
    ret.contents.push({
      name: name,
      content: content,
    });
  });

  return ret;
};

module.exports = {
  convertToStoryForm,
};
