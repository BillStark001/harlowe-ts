import fs from 'fs';
import path from 'path';

import yargs, { Arguments, CamelCaseKey } from 'yargs';

import CodeSlicer, { CodePiece, SlicerOptions } from '../src/toolbox/slicer';
// import Markup from '../src/markup';
// import { getSpansFromPassage, separatePassage } from '../src/project/passage';
import { exit } from 'process';
import { loadHtmlProject } from '../src/toolbox/loader';
import { parseComment } from '../src/project/passage';
import { CodeWalker } from '../src/markup';


const FORMAT_LIST = ['html', 'xml', 'harlowe', 'json', 'txt'];

type ParseResult<T> = { [key in keyof Arguments<T> as key | CamelCaseKey<key>]: Arguments<T>[key] };

// argument definition

const argDefinition = yargs
  .positional('cmd', {
    choices: ['slice', 'sep', 'separate', 'repl', 'replace', 'synth', 'synthesize', 'lex'],
    describe: 'Subcommand'
  })
  .positional('src', {
    type: 'string',
    describe: 'Source',
    alias: 's',
  })
  .positional('dst', {
    type: 'string',
    describe: 'Destination',
    alias: 'd',
  })
  .positional('res', {
    type: 'string',
    describe: 'Resource',
    alias: 'r',
  })
  .option('include', {
    type: 'array',
    describe: 'Included types',
    alias: 'i',
  })
  .option('exclude', {
    type: 'array',
    describe: 'Excluded types',
    alias: 'x',
  })
  .option('typeRecord', {
    type: 'boolean',
    describe: 'Retain type records',
    alias: 't',
  })
  .option('format', {
    choices: FORMAT_LIST,
    describe: 'Format',
    alias: 'f',
  })
  .option('encoding', {
    type: 'string',
    describe: 'Encoding',
    alias: 'e'
  })
  .demandCommand()
  .help();

const argv = argDefinition.parse() as ParseResult<object>;

const parseStringArrayArgs = (x: unknown) => {
  if (!x)
    return [];
  if (x instanceof Array)
    return x.map(x => String(x));
  return String(x).split(/[,;，；]/g).filter(x => !!x).map(x => x.trim());
};

const command = String(argv._[0] ?? '').trim().toLowerCase();
const include = parseStringArrayArgs(argv.include ?? argv.i);
const exclude = parseStringArrayArgs(argv.exclude ?? argv.x);
const src = path.normalize(String(argv.src ?? argv.source ?? argv._[1] ?? ''));
const dst = path.normalize(String(argv.dst ?? argv.dest ?? argv.destination ?? argv._[2] ?? ''));
const encoding = String((argv.encoding ?? argv.e) || 'utf-8');
const format = String((argv.format ?? argv.f) || '').toLowerCase() || undefined;


// validation

const validate = <T = unknown>(arg: T, name: string, ...vals: ((x: T) => boolean)[]) => {
  for (const val of vals) {
    try {
      if (val(arg)) {
        continue;
      }
    } finally { }
    console.error(`Argument ${name}(=${JSON.stringify(arg)}) violates validation rule: ${val.name || val.toString()}.`);
    argDefinition.showHelp();
    exit(1);
  }
};

const isDirectory = (pathStr: string): boolean => {
  return fs.existsSync(pathStr) && fs.lstatSync(pathStr).isDirectory();
};

const isFile = (pathStr: string): boolean => {
  return fs.existsSync(pathStr) && fs.lstatSync(pathStr).isFile();
};

const isWritableOrCreatable = (pathStr: string): boolean => {
  try {
    fs.accessSync(pathStr, fs.constants.F_OK);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(pathStr, '');
      return true;
    } catch (writeErr) {
      return false;
    }
  }
};


// utils

const shouldSkip = (text: string) => /^\s*$/.test(text);

// exec

type CodePieceExtra = {
  name: string
};

if (command.startsWith('slice')) {
  validate(src, 'src', isFile);
  validate(dst, 'dst', isWritableOrCreatable);

  const withTxtRecord = format == 'txt';
  const realDst = isDirectory(dst) ? 
    path.join(dst, path.parse(src).name) : 
    dst.toLowerCase().endsWith('.json') ? dst.substring(0, dst.length - 5) : dst;

  console.log(realDst);

  const passage = fs.readFileSync(src, { encoding: encoding as BufferEncoding });
  const ext = path.parse(src).ext.toLowerCase();
  const options: Partial<SlicerOptions<CodePieceExtra>> = {
    included: include,
    skipped: exclude,
    withTypeRecord: !!(argv.typeRecord ?? argv.withTypeRecord ?? argv.t),
  };

  const pieces: CodePiece<CodePieceExtra>[] = [];

  if (ext == '.html') {
    const proj = loadHtmlProject(passage);
    for (const { name, content } of proj?.contents ?? []) {
      CodeSlicer.slice(content, { ...options, externalData: { name }})
        .forEach((x) => pieces.push(x));
    }
  } else if (ext == '.harlowe') {
    CodeSlicer.slice(passage, options).forEach((x) => {
      if (options.withTypeRecord 
        && x.type == 'text' 
        && x.types?.length == 3
        && x.types?.[1] == 'comment'
        && parseComment(x.text) != undefined)
        return;
      pieces.push(x);
    });
  }
  
  if (withTxtRecord) {
    const fd = fs.openSync(realDst + '.txt', 'w');
    for (const { text } of pieces) {
      if (shouldSkip(text))
        continue;
      if (text.indexOf('\n') >= 0 || text.startsWith('"'))
        fs.writeFileSync(fd, JSON.stringify(text));
      else
        fs.writeFileSync(fd, text);
      fs.writeFileSync(fd, '\n');
    }
    fs.closeSync(fd);
  }

  fs.writeFileSync(realDst + '.json', JSON.stringify(pieces, undefined, 2));

} else if (command.startsWith('lex')) {
  validate(src, 'src', isFile);
  const ext = path.parse(src).ext.toLowerCase();
  const passage = fs.readFileSync(src, { encoding: encoding as BufferEncoding });
  if (ext == '.html') {
    const proj = loadHtmlProject(passage);
    for (const { name, content } of proj?.contents ?? []) {
      console.log(name);
      console.log(CodeWalker.walk(content));
    }
  } else if (ext == '.harlowe') {
    console.log(CodeWalker.walk(passage));
  }
} else {
  console.error('No proper command assigned.');
  argDefinition.showHelp();
  exit(1);
}



// const testPassage = ``;

// const ast = Markup.lex(testPassage);

// console.log(ast);
// console.log(getSpansFromPassage(ast, 2, 3));
// console.log(separatePassage(ast, 'ddd/dd', {
//   escapeLeadingReturns: 2,
//   escapeTrailingReturns: 2,
//   escapeSameLineTrailingReturn: true
// }));

exit(0);