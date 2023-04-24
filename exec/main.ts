import CodeSlicer from '../src/toolbox/slicer';
import Markup from '../src/markup';
import { parse } from 'ts-command-line-args';
import { getSpansFromPassage, separatePassage } from '../src/project/passage';

interface HarloweToolArgs {
  src: string;
  rec?: string;
  dst?: string;
  slice: boolean;
  recv: boolean;
  help: boolean;
  include?: string[];
  exclude?: string[];
}

console.log(process.argv);
console.log(parse<HarloweToolArgs>({
  src: { type: String, alias: 's' },
  dst: { type: String, optional: true, alias: 'd' },
  rec: { type: String, optional: true, alias: 'r', },
  slice: { type: Boolean },
  recv: { type: Boolean },
  help: { type: Boolean, alias: 'h', description: 'Prints this usage guide' },
  include: { type: String, multiple: true, optional: true, alias: 'n' },
  exclude: { type: String, multiple: true, optional: true, alias: 'x' },
},{
  helpArg: 'help',
  headerContentSections: [{ header: 'Harlowe Toolbox', content: 'Thanks for using Our Library' }],
},));


const testPassage = `
      
<!-- @ starting node -->

Or, type some Harlowe code in this text area, and click ▶ to see it render.

\\(set: _style to (text-style:"buoy"), $word to "this")(enchant:$word, _style)\\

<img src="test src" alt="test alt">




<!-- @ test1 -->
<!-- # gan si huang xu dong --> 



<!-- @ 111 -->

 


<!--@gansihuangxudong-->

This panel ↓ will show any variables that are set by the code, as well as any enchantments applied to the prose using enchantment macros like \`(enchant:)\`.

Press "Debug View" and then click the 🔍 icons to see a step-by-step guide of how Harlowe processed a macro.

[[slicer test -> slicer target]]


<!--@test2-->
`;

const ast = Markup.lex(testPassage);

console.log(ast);
console.log(getSpansFromPassage(ast, 2, 3));
console.log(separatePassage(ast, 'ddd/dd', {
  escapeLeadingReturns: 2,
  escapeTrailingReturns: 2,
  escapeSameLineTrailingReturn: true
}));

const pieces = CodeSlicer.slice(testPassage, {
  included: ['text', 'tag'],
  skipped: [],
  withTypeRecord: true,
});

for (const piece of pieces) {
  console.log(piece);
}