import Markup, { CodeWalker } from './markup';

const testPassage = `
Or, type some Harlowe code in this text area, and click ▶ to see it render.

\\(set: _style to (text-style:"buoy"), $word to "this")(enchant:$word, _style)\\

<img src="test src" alt="test alt">

This panel ↓ will show any variables that are set by the code, as well as any enchantments applied to the prose using enchantment macros like \`(enchant:)\`.

Press "Debug View" and then click the 🔍 icons to see a step-by-step guide of how Harlowe processed a macro.
`;

const res = Markup.lex(testPassage);

// console.log(JSON.stringify(res));

const walker = new CodeWalker(res);

let level = 0;

while (walker.hasNext) {
  const { node, entering } = walker.step()!;
  console.log(`[${level - Number(!entering)}] ${entering ? 'entering:' : 'leaving: '} (${node.start}, ${node.end}) of type ${node.type} ${JSON.stringify(node.text ?? node.innerText)}`);
  if (entering)
    level += 1;
  else
    level -= 1;

  if (node.type == 'macro') {
    walker.skip();
    level -= 1;
  }
}