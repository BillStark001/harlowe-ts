import { CodePiece } from './slicer';
import * as fs from 'fs'; 
import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseHtml } from 'node-html-parser';
import { hasUtf8Bom } from '../utils/object';

export type ProperNounForm = {
  form: string,
  literal: string | RegExp,
  target?: string,
};

export type ProperNounDefinition = {
  name: string,
  forms: ProperNounForm[],
};

export type PositionedProperNoun = CodePiece & {
  name: string,
  form: string,
};

// proper noun tagging

export const compareNoun = (a: PositionedProperNoun, b: PositionedProperNoun): number => {
  if (a.start !== b.start)
    return a.start - b.start;
  if (a.end !== b.end)
    return b.end - a.end;
  if (a.name !== b.name)
    return a.name.localeCompare(b.name);
  if (a.form !== b.form)
    return a.form.localeCompare(b.form);
  return a.text.localeCompare(b.text);
};

export const findProperNouns = (
  text: string,
  glossary: ProperNounDefinition[]
) => {
  const res: PositionedProperNoun[] = [];
  for (const { name, forms } of glossary) {
    for (const { form, literal } of forms) {
      const pattern = typeof literal == 'string' ?
        new RegExp(`\\b${literal}\\b`, 'gi') : // case insensitive bu default
        new RegExp(literal.source, literal.flags +
          (literal.flags.includes('g') ? '' : 'g')
        );
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text))) {
        const start = match.index;
        const end = start + match[0].length;
        res.push({ start, end, text: match[0], name, form });
      }
    }
  }
  return res;
};

export const stripOverlay = (nouns: PositionedProperNoun[]) => {
  const sorted = nouns.filter(x => x.end > x.start).sort(compareNoun);
  let index = 0;
  while (index < sorted.length - 1) {
    while (index < sorted.length - 1 && (
      sorted[index].start === sorted[index + 1].start ||
      sorted[index].end > sorted[index + 1].start))
      sorted.splice(index + 1, 1);
    ++index;
  }
  return sorted;
};

export const fenceProperNouns = (
  text: string,
  glossary: ProperNounDefinition[]
): string => {

  const nouns = stripOverlay(findProperNouns(text, glossary));
  nouns.sort((x, y) => y.start - x.start);

  let replacedText = text;

  for (const noun of nouns) {
    replacedText = replacedText.substring(0, noun.start) +
      `<span name="${noun.name}" form="${noun.form}" literal="${noun.text}">${noun.text}</span>` +
      replacedText.substring(noun.end);
  }

  return replacedText;
};

export const restoreProperNouns = (
  text: string, 
  replacements: Map<string, string>
): string => {
  const html = parseHtml(text);
  const spanNodes = html.querySelectorAll('span');
  spanNodes.forEach((node) => {
    const name = node.attrs.name;
    const form = node.attrs.form;
    if (name == undefined || form == undefined)
      return;
    const key = getNounNameFormKey(name, form);
    node.replaceWith(replacements.get(key) || node.innerText);
  });
  return html.toString();
};

type _row = {
  name: string, form: string, type: string, literal: string, target: string
};

export const getNounNameFormKey = (name: string, form: string) => `${name}.${form}`;

export const readGlossaryFile = (path: string, encoding?: BufferEncoding): [
  ProperNounDefinition[],
  Map<string, string>
] => {
  let buffer = fs.readFileSync(path, { encoding });
  if (hasUtf8Bom(buffer))
    buffer = buffer.slice(typeof buffer === 'string' ? 1 : 3);
  const rows: _row[] = parseCsv(buffer, { columns: true, skip_empty_lines: true });
  const resultMap: Map<string, ProperNounForm[]> = new Map();
  const targetMap: Map<string, string> = new Map();
  rows.forEach((row) => {
    const { name, form, type, literal, target } = row;
    if (!name)
      return;
    if (!resultMap.has(name))
      resultMap.set(name, []);
    const realLiteral: string | RegExp = type == 'S' ? new RegExp(`\\b${literal}\\b`, 'g') :
      type?.toLowerCase() == 'r' ? new RegExp(literal, type == 'R' ? 'g' : 'gi') :
        literal;
    resultMap.get(name)!.push({
      form,
      literal: realLiteral
    });
    const key = getNounNameFormKey(name, form);
    if (!targetMap.has(key))
      targetMap.set(key, target);
  });
  const results: ProperNounDefinition[] = [];
  resultMap.forEach((value, key) => {
    results.push({
      name: key,
      forms: value,
    });
  });
  return [results, targetMap];
};

// txt record builder

const shouldSkip = (text: string) => /^\s*$/.test(text);

export const extractOrderedTextPhrases = <T=void>(pieces: CodePiece<T>[]) => {
  const set = new Set<string>();
  const ret: string[] = [];
  for (const { text } of pieces) {
    if (shouldSkip(text))
      continue;
    if (!set.has(text)) {
      ret.push(text);
      set.add(text);
    }
  }
  return ret;
};

export const replaceOrderedTextPhrases = <T=void>(pieces: CodePiece<T>[], replacements: string[]) => {
  const phrases = extractOrderedTextPhrases(pieces);
  const map = new Map<string, number>();
  phrases.forEach((p, i) => map.set(p, i));
  const ret: CodePiece<T>[] = pieces.map((p) => ({
    ...p, 
    text: replacements[map.get(p.text) ?? -1] ?? p.text
  }));
  return ret;
};
