import Markup, { CodeWalker, Token } from '../markup';
import '../utils/polyfill';

export type CodePiece<T = void> = {
  start: number;
  end: number;
  type: string;
  types?: string[];
  text: string;
  ext?: T;
};

export type SlicerOptions<T = void> = {
  included: string[];
  skipped: string[];
  goFurther: boolean;
  withTypeRecord: boolean;
  externalData?: T;
};

const defaultOptions: SlicerOptions = {
  included: ['text'],
  skipped: ['macro'],
  goFurther: true,
  withTypeRecord: false,
};

const slice = <T = void>(text: string | Token | Token[], options?: Partial<SlicerOptions<T>>) => {
  const opt = Object.assign({}, defaultOptions, options) as SlicerOptions;

  const res = typeof text == 'string' ? Markup.lex(text) :
    text instanceof Array ? new Token({
      type: 'root',
      children: [...text],
    }) : text
    ;

  const walker = new CodeWalker(res);

  const records: string[] = [];
  const results: CodePiece<T>[] = [];

  const skip = () => {
    if (walker.skip())
      records.pop();
  };

  while (walker.hasNext) {
    const { node, entering } = walker.step()!;
    const typeRaw = node.type || '';
    const type = typeRaw + (node.name ? `[${node.name || ''}]` : '');
    // console.log(`[${records.length - Number(!entering)}] ${entering ? 'entering:' : 'leaving: '} (${node.start}, ${node.end}) of type ${node.type} ${JSON.stringify(node.text ?? node.innerText)}`);

    // maintain records
    if (entering)
      records.push(type);
    else
      records.pop();

    // main logics
    if (entering) {
      if (opt.included.indexOf(typeRaw) >= 0) {
        results.push({
          start: node.start ?? -1,
          end: node.end ?? -1,
          text: node.text ?? node.innerText ?? '',
          type: type,
          types: opt.withTypeRecord ? [...records] : undefined,
          ext: options?.externalData
        });
      }
      if (opt.skipped.indexOf(typeRaw) >= 0 || !opt.goFurther) {
        skip();
      }
    }

  }

  return results;
};

const replace = <T = void>(text: string, replacements: CodePiece<T>[]) => {
  const repl = replacements.sort((x, y) => y.start - x.start);
  let ret = text;
  for (const { text, start, end } of repl) {
    if (end < start || start < 0 || end < 0 || start >= text.length || end >= text.length)
      continue;
    ret = ret.substring(0, start) + text + ret.substring(end);
  }
  return ret;
};

export const CodeSlicer = Object.freeze({
  slice,
  replace,
});

export default CodeSlicer;