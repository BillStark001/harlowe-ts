import Markup from "./markup";

const testPassage = `
Or, type some Harlowe code in this text area, and click ▶ to see it render.

\(set: _style to (text-style:"buoy"), $word to "this")(enchant:$word, _style)\

This panel ↓ will show any variables that are set by the code, as well as any enchantments applied to the prose using enchantment macros like \`(enchant:)\`.

Press "Debug View" and then click the 🔍 icons to see a step-by-step guide of how Harlowe processed a macro.
`;

const res = Markup.lex(testPassage);

console.log(JSON.stringify(res));