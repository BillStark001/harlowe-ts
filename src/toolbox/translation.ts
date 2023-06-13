import { MiniCodePiece } from './slicer';

export type ProperNounForm = {
  form: string,
  literal: string | RegExp,
};

export type ProperNounDefinition = {
  name: string, 
  forms: ProperNounForm[],
};

export type PositionedProperNoun = MiniCodePiece & {
  name: string,
  form: string,
};

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
        new RegExp(`\\b${literal}\\b`, 'gi') : 
        new RegExp(literal.source, literal.flags + 
          (literal.flags.includes('g') ? '' : 'g') + 
          (literal.flags.includes('i') ? '' : 'i')
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
    while (sorted[index].start === sorted[index + 1].start || 
      sorted[index].end > sorted[index + 1].start)
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