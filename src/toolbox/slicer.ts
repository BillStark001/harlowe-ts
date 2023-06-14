import Markup, { CodeWalker, Token, TokenData } from '../markup';
import { arrayEquals } from '../utils/object';
import '../utils/polyfill';

export type CodePiece<T = void> = {
  start: number;
  end: number;
  text: string;
  ext?: T;
}

export type TypedCodePiece<T = void> = CodePiece<T> & {
  type: string;
  types?: string[];
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
  const results: TypedCodePiece<T>[] = [];

  const skip = () => {
    if (walker.skip())
      records.pop();
  };

  let lastNode: TokenData | undefined = undefined;

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
        const textToPush = node.text ?? node.innerText ?? '';
        if (lastNode?.type === 'twineLink' && textToPush === lastNode.passage){
          // do nothing
        } else {
          results.push({
            start: node.start ?? -1,
            end: node.end ?? -1,
            text: textToPush,
            type: type,
            types: opt.withTypeRecord ? [...records] : undefined,
            ext: options?.externalData
          });
          skip();
        }
      }
      if (opt.skipped.indexOf(typeRaw) >= 0 || !opt.goFurther) {
        skip();
      }
    }
    lastNode = node;
  }

  return results;
};

const _o_rec: Record<string, string> = {
  'bold': '\'\'',
  'italic': '//',
  'em': '*',
  'strong': '**',
};
const _o_set = new Set(Object.keys(_o_rec));

const optimize = <T = void>(pieces: TypedCodePiece<T>[]) => {
  let index = 0;
  pieces = [...pieces];
  while (index < pieces.length - 2) {
    const [o1, o2, o3] = pieces.slice(index, index + 3);
    if (!o1.types || !o2.types || !o3.types)
      continue;
    if (o2.types.length === o1.types.length + 1 && 
      o2.types.length > 2 &&
      _o_set.has(o2.types[o2.types.length - 2]) && 
      arrayEquals(o1.types, o3.types) && 
      arrayEquals(
        o1.types.slice(0, o1.types.length - 1), 
        o2.types.splice(0, o1.types.length - 1))
    ) {
      const s = _o_rec[o2.types[o2.types.length - 2]];
      const l = s.length;
      if (!(o2.start === o1.end + l && o3.start === o2.end + l))
        continue;
      const newItem = {
        ...o1, 
        end: o3.end, 
        text: o1.text + s + o2.text + s + o3.text,
      };
      pieces = [...pieces.slice(0, index), newItem, ...pieces.slice(index + 3)];
      --index;
    }
    ++index;
  }
  return pieces;
};

const replace = <T = void>(text: string, replacements: CodePiece<T>[]) => {
  const repl = [...replacements];
  repl.sort((x, y) => y.start - x.start);
  let ret = text;
  for (const { text, start, end } of repl) {
    if (end < start || start < 0 || end < 0 || start >= ret.length || end > ret.length)
      continue;
    ret = ret.substring(0, start) + text + ret.substring(end);
  }
  return ret;
};

export const CodeSlicer = Object.freeze({
  slice,
  replace,
  optimize,
});


export default CodeSlicer;