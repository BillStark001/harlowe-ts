/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { convertToStoryForm } = require('./html');

/** @typedef {import('ts-command-line-args').ArgumentConfig<HarloweToolArgs>} P */
// @ts-ignore
/** @type {P} */
const argsScheme = {
  src: { type: String, alias: 's' },
  dst: { type: String, optional: true, alias: 'd' },
  rec: { type: String, optional: true, alias: 'r', },
  slice: { type: Boolean },
  recover: { type: Boolean },
  extract: { type: Boolean },
  hydrate: { type: Boolean },
  help: { type: Boolean, alias: 'h', description: 'Prints this usage guide' },
  include: { type: String, multiple: true, optional: true, alias: 'n' },
  exclude: { type: String, multiple: true, optional: true, alias: 'x' },
};
const args = require('ts-command-line-args').parse(argsScheme,{
  helpArg: 'help',
  headerContentSections: [{ header: 'Harlowe Toolbox', content: 'Thanks for using Our Library' }],
},);

const exampleStory = `
<tw-storydata startnode="2" creator="Twine" creator-version="2.3.13" ifid="B08C571F-C95A-4F3B-A394-7DB08BD2B499" zoom="0.6" format="Harlowe" format-version="3.2.1" options="debug" hidden="">
<tw-passagedata pid=1 name=Start>

(enchant:?Page,(background:white)+(color:black))[[Next]]
&lt;&gt;
[[Strange...where am I?-&gt;Where am I?]]
123456
</tw-passagedata>
<tw-passagedata pid=2 name=Next  tags="" position="330,618" size="100,100">[[Last]]</tw-passagedata>
<tw-passagedata pid=3 name=Last>**Success**</tw-passagedata>
<tw-tag name="Debt" color="red"></tw-tag>,<tw-tag name="Isabella-Special" color="purple"></tw-tag>,<tw-tag name="Late" color="orange"></tw-tag>,<tw-tag name="Save" color="yellow"></tw-tag>,<tw-tag name="Tags" color="green"></tw-tag>,<tw-tag name="Travel-Checks" color="orange"></tw-tag>,<tw-tag name="End-Type" color="purple"></tw-tag>,<tw-tag name="Add-New-Tags-Here" color="green"></tw-tag>,<tw-tag name="INS" color="purple"></tw-tag>,<tw-tag name="Important" color="green"></tw-tag>,<tw-tag name="END" color="purple"></tw-tag>,<tw-tag name="Variables" color="green"></tw-tag>,<tw-tag name="Next-End" color="orange"></tw-tag>,<tw-tag name="IMPORTANT" color="yellow"></tw-tag>,<tw-tag name="Auction" color="orange"></tw-tag>,<tw-tag name="Ending" color="orange"></tw-tag>,<tw-tag name="End-Count" color="yellow"></tw-tag>,<tw-tag name="FINISH-ME" color="yellow"></tw-tag>,<tw-tag name="End-Check" color="yellow"></tw-tag><tw-passagedata pid="1" name="Startup" tags="" position="405,189" size="100,100">=&gt;&lt;=
&lt;img src="https://i.imgur.com/test-img.jpg" width="60%" height="60%"&gt;
test-text</tw-passagedata>
</tw-storydata>
`;

const cvrt = convertToStoryForm(exampleStory);
console.log(cvrt);
console.log(cvrt?.passages, cvrt?.contents, cvrt?.tags);


/*

recover (convertToHtml)
  src: dir, project
  dst: target output
  rec: the replacement file if assigned, will find the tag inside it

slice (convertToProject)
  src: file or url, html
  dst: target dir

extract
  src: file or dir, story file
  dst: output record file
  include, exclude

hydrate
  src: file or dir, story file
  dst: output story file
  rec: record file
  

*/