import CodeSlicer from './toolbox/slicer';

const testPassage = `
Or, type some Harlowe code in this text area, and click ▶ to see it render.

\\(set: _style to (text-style:"buoy"), $word to "this")(enchant:$word, _style)\\

<img src="test src" alt="test alt">

This panel ↓ will show any variables that are set by the code, as well as any enchantments applied to the prose using enchantment macros like \`(enchant:)\`.

Press "Debug View" and then click the 🔍 icons to see a step-by-step guide of how Harlowe processed a macro.

[[slicer test -> slicer target]]
`;

const pieces = CodeSlicer.slice(testPassage);

for (const piece of pieces) {
  console.log(piece);
}