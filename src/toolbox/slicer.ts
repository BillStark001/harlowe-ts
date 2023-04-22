import Markup, { CodeWalker } from '../markup';
import '../utils/polyfill';

export type CodePiece = {
  start: number;
  end: number;
  type: string;
  types?: string[];
  text: string;
};

export type SlicerOptions = {
  included: string[];
  skipped: string[];
  goFurther: boolean;
  withTypeRecord: boolean;
};

const defaultOptions: SlicerOptions = {
  included: ['text'],
  skipped: ['macro'],
  goFurther: true,
  withTypeRecord: false,
};

const slice = (text: string, options?: Partial<SlicerOptions>) => {
  const opt = Object.assign({}, defaultOptions, options) as SlicerOptions;

  const res = Markup.lex(text);

  // console.log(JSON.stringify(res));

  const walker = new CodeWalker(res);

  const records: string[] = [];
  const results: CodePiece[] = [];

  const skip = () => {
    if (walker.skip())
      records.pop();
  };

  while (walker.hasNext) {
    const { node, entering } = walker.step()!;
    const type = node.type || '';
    // console.log(`[${records.length - Number(!entering)}] ${entering ? 'entering:' : 'leaving: '} (${node.start}, ${node.end}) of type ${node.type} ${JSON.stringify(node.text ?? node.innerText)}`);
    
    // maintain records
    if (entering)
      records.push(type);
    else
      records.pop();

    // main logics
    if (entering) {
      if (opt.included.indexOf(type) >= 0) {
        results.push({
          start: node.start ?? -1,
          end: node.end ?? -1,
          text: node.text ?? node.innerText ?? '',
          type: type,
          types: opt.withTypeRecord ? [...records] : [],
        });
      }
      if (opt.skipped.indexOf(type) >= 0 || !opt.goFurther) {
        skip();
      }
    }

  }

  return results;
};

const CodeSlicer = {
  slice,
};

Object.freeze(CodeSlicer);

export default CodeSlicer;