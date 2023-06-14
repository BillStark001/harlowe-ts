import { parse } from 'node-html-parser';
import { StoryData } from '../project';
import { Attributes } from 'node-html-parser/dist/nodes/html';
import { createObject } from '../utils/html';

import 'css.escape';

const parseNumberPair = (inStr: string | undefined): [number, number] | undefined => {
  const ret = inStr?.trim().split(/,\s*/);
  if (ret == undefined || ret.length == 0 || (ret.length == 1 && ret[0] == ''))
    return undefined;
  const retNum = ret
    .map((x) => Number(x))
    .map((x) => (isNaN(x) || !isFinite(x) ? 0 : x));
  return [retNum[0] ?? 0, retNum[1] ?? 0];
};

export const loadHtmlProject = (html: string): StoryData | undefined => {
  const root = parse(html);

  // prepare data
  const storyRoot = root.querySelector('tw-storydata');
  if (!storyRoot) {
    return undefined;
  }
  const attrs = storyRoot.attrs;
  const startNode = Number(attrs.startnode ?? attrs['start-node'] ?? attrs.startNode);
  const tags = storyRoot.querySelectorAll('tw-tag');
  const passages = storyRoot.querySelectorAll('tw-passagedata');

  const ret: StoryData = {
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
        (acc, curr) => ((acc[curr] = ''), acc),
        {} as Attributes
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
    const pid = attrs.pid ? Number(attrs.pid) : undefined;

    if (startNode == pid)
      ret.desc.startPassage = name;

    ret.passages.push({
      name: name,
      pid: pid,
      tags: attrs.tags?.split(/\s/).filter((x) => !!x),
      position: parseNumberPair(attrs.position),
      size: parseNumberPair(attrs.size),
    });
    ret.contents.push({
      name: name,
      pid: pid,
      content: content,
    });
  });

  return ret;
};

export const saveHtmlProject = (html: string, proj: StoryData): string => {
  const root = parse(html);
  const storyRoot = root.querySelector('tw-storydata');
  if (!storyRoot)
    return html;
  const { /*desc, debugOptions, tags, passages, */contents } = proj;
  // TODO desc, debug options, tags

  // passages
  // TODO passage data themselves

  // passage contents
  for (const { name, pid, content } of contents) {
    const passage = storyRoot.querySelector(`tw-passagedata[pid="${pid}"][name="${CSS.escape(name)}"]`) ??
      storyRoot.querySelector(`tw-passagedata[pid="${pid}"]`) ??
      storyRoot.querySelector(`tw-passagedata[name="${CSS.escape(name)}"]`);
    if (passage != undefined)
      passage.set_content(content);
  }
  return root.toString();
};