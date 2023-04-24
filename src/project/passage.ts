import Markup, { TokenData } from '../markup';
import { PassageSpan, StoryOptions } from './types';

const rePassageLeading = /^(\s*)@(\s*)/;
const reTagLeading = /^(\s*)#/;
const reSpaceTrailing = /\s+$/;

const tryGetInfo = (str: string) => {
  let exec: RegExpExecArray | null;
  rePassageLeading.lastIndex = reTagLeading.lastIndex = reSpaceTrailing.lastIndex = 0;
  if ((exec = rePassageLeading.exec(str))) {
    const execLen = exec[0].length;
    const lSpace = exec[1].length;
    const ltSpace = exec[2].length;
    const tSpace = reSpaceTrailing.exec(str)?.[0]?.length ?? 0;
    const startStrip = ltSpace >= lSpace ? execLen - ltSpace + lSpace : execLen - ltSpace;
    const endStrip = tSpace >= lSpace ? lSpace : 0;
    return str.substring(startStrip, str.length - endStrip);
  } else if ((exec == reTagLeading.exec(str))) {
    return str.split(/\s+/);
  }
  return undefined;
};

export type PassageDescriptorSpan = {
  start: number;
  end: number;
  name: string;
  tags: string[];
};


export const filterPassage = (ast: TokenData | TokenData[] | string) => {
  const nodes: TokenData[] = typeof ast === 'string' ?
    Markup.lex(ast).children :
    ast instanceof Array ?
      ast :
      ast.children ?? [];
  return nodes;
};

export const getSpansFromPassage = (
  ast: TokenData | TokenData[] | string,
  lead?: number,
  trail?: number
) => {
  const nodes = filterPassage(ast);
  lead = (!lead || lead < 0) ? 0 : lead;
  trail = (!trail || trail < 0) ? 0 : trail;

  const spans: PassageDescriptorSpan[] = [];
  let lastReturn = 0;
  let i = 0;
  let lastPassage: PassageDescriptorSpan | undefined = undefined;

  const pushSpan = () => {
    if (lastPassage !== undefined) {
      if (lastPassage.end < 0)
        lastPassage.end = i;
      spans.push(lastPassage);
      lastPassage = undefined;
    }
  };

  const addNewSpan = (name: string): PassageDescriptorSpan => {
    pushSpan();
    return {
      start: i - Math.min(lastReturn, lead ?? 0),
      end: -1,
      name: name,
      tags: []
    };
  };


  for (i = 0; i < nodes.length; ++i) {
    const curType = nodes[i]?.type ?? '';
    // update lastReturn
    if (curType === 'br') {
      lastReturn += 1;
    }

    // parse context
    // leading br's & name comment & []
    if (curType === 'comment') {
      const info = tryGetInfo(nodes[i]?.innerText ?? '');
      if (typeof info === 'string') {
        lastPassage = addNewSpan(info);
      } else if (lastPassage !== undefined && info instanceof Array) {
        lastPassage.tags = [...lastPassage.tags, ...info];
      }
    } else if (lastPassage !== undefined) {
      const canSkip = curType === 'br' || (curType === 'text' && /\s*/.test(nodes[i]?.text ?? ''));
      if (!canSkip) {
        pushSpan();
      } else if (lastReturn > trail ?? 0) {
        pushSpan();
      }
    }

    // clear lastReturn if necessary
    if (curType !== 'br') {
      lastReturn = 0;
    }
  }

  // the parsing result above could include trailing text nodes
  // those nodes are to be stripped
  spans.forEach(span => {
    let textFlag = false;
    let lastBr = -1;
    for (let i = span.start; i < span.end; ++i) {
      if (nodes[i]?.type === 'comment') {
        textFlag = false;
        lastBr = i;
      }
      else if (nodes[i]?.type === 'br') {
        if (!textFlag)
          lastBr = i;
      }
      else {
        textFlag = true;
      }
    }
    if (textFlag) {
      span.end = lastBr + 1;
    }
  });

  return spans;
};

export const separatePassageWithSpan = (
  nodes: TokenData[],
  spans: PassageDescriptorSpan[],
  defaultName: string,
): PassageSpan[] => {
  // if no span is detected, just return itself
  if (!spans || spans.length == 0) {
    return [{
      name: defaultName,
      tags: [],
      ast: [...nodes]
    }];
  }
  const ret: PassageSpan[] = [];

  // handle starter nodes
  const starterNodes = nodes.slice(0, spans[0].start);
  let withStarterNodes = false;
  for (const n of starterNodes) {
    const canSkip = n.type === 'br' || (n.type === 'text' && /\s*/.test(n?.text ?? ''));
    if (!canSkip) {
      withStarterNodes = true;
      break;
    }
  }
  if (withStarterNodes) {
    ret.push({
      name: defaultName,
      tags: [],
      ast: starterNodes
    });
  }

  // handle normal nodes
  for (let i = 0; i < spans.length; ++i) {
    const startIndex = spans[i].end;
    const endIndex = i === spans.length - 1 ? nodes.length : spans[i + 1].start;
    ret.push({
      name: spans[i].name,
      tags: [...spans[i].tags],
      ast: nodes.slice(startIndex, endIndex),
    });
  }
  return ret;
};

export const separatePassage = (
  ast: TokenData | TokenData[] | string,
  path?: string,
  options?: StoryOptions,
) => {
  options = (options ?? {}) as StoryOptions;
  const nodes = filterPassage(ast);
  const name = path ? (options.defaultNameWithPath ? path : path.split(/\\\//g).slice(-1)[0] ?? '') : '';
  const spans = getSpansFromPassage(
    nodes,
    options.escapeLeadingReturns ?? 0,
    (options.escapeTrailingReturns ?? 0) + Number(options.escapeSameLineTrailingReturn ?? true),
  );
  return separatePassageWithSpan(nodes, spans, name);
};