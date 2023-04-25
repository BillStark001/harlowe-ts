#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { parse } = require('node-html-parser');
const utils = require('./utils');

/**
 * @typedef {import('../dist/src/project').StoryData} StoryData
 * @typedef {import('../dist/src/project').PassageDescriptor} PassageDescriptor
 * @typedef {import('../dist/src/project').PassageContentDescriptor} PassageContentDescriptor
 */

/** @param {string} x */
const _bar = (x) => utils.camelToSnake(x).replace(/_/g, '-');
/** @param {string} x */
const _nobar = (x) => utils.snakeToCamel(x.replace(/-/g, '_'));



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
    },
    tags: [],
    passages: [],
    contents: [],
  };

  // form options
  (attrs.tags || '')
    .split(/\s/)
    .filter((x) => !!x)
    .forEach((b) => {
      if (!ret.desc.options) ret.desc.options = {};
      if (b === 'uncompressed-pure-values' || b === 'uncompressed-saves')
        ret.desc.options.uncompressedPureValues = true;
      if (b === 'uncompressed-structures' || b === 'uncompressed-saves')
        ret.desc.options.uncompressedStructures = true;
    });

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

const exampleStory = `
<tw-storydata startnode=1 options=debug>
<tw-passagedata pid=1 name=Start>

(enchant:?Page,(background:white)+(color:black))[[Next]]
&lt;&gt;
[[Strange...where am I?-&gt;Where am I?]]
123456
</tw-passagedata>
<tw-passagedata pid=2 name=Next  tags="" position="330,618" size="100,100">[[Last]]</tw-passagedata>
<tw-passagedata pid=3 name=Last>**Success**</tw-passagedata>
</tw-storydata>
`;

const cvrt = convertToStoryForm(exampleStory);
console.log(cvrt?.passages, cvrt?.contents, cvrt?.tags);
