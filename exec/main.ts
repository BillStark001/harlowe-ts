import fs from 'fs';
import path from 'path';

import yargs, { Arguments, CamelCaseKey } from 'yargs';

import CodeSlicer, { TypedCodePiece, SlicerOptions, CodePiece } from '../src/toolbox/slicer';
// import Markup from '../src/markup';
// import { getSpansFromPassage, separatePassage } from '../src/project/passage';
import { exit } from 'process';
import { loadHtmlProject, saveHtmlProject } from '../src/toolbox/html';
import { parseComment } from '../src/project/passage';
import { CodeWalker } from '../src/markup';
import { extractOrderedTextPhrases, fenceProperNouns, readGlossaryFile, replaceOrderedTextPhrases, restoreProperNouns } from '../src/toolbox/translation';
import { countNewLine } from '../src/utils/object';

import cliProgress from 'cli-progress';

const FORMAT_LIST = ['html', 'xml', 'harlowe', 'json', 'txt'];

type ParseResult<T> = { [key in keyof Arguments<T> as key | CamelCaseKey<key>]: Arguments<T>[key] };

// argument definition

const argDefinition = yargs
  .positional('cmd', {
    choices: ['slice', 'sep', 'separate', 'repl', 'replace', 'synth', 'synthesize', 'lex', 'opt', 'optimize'],
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
  .positional('res2', {
    type: 'string',
    describe: 'Resource',
    alias: 'R',
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
  .options('optimize', {
    type: 'boolean',
    describe: 'Optimize output',
    alias: 'o',
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


// exec

type CodePieceExtra = {
  name: string,
  pid?: number,
};

// common vars

const withTxtRecord = format == 'txt';
const realDst = isDirectory(dst) ?
  path.join(dst, path.parse(src).name) :
  dst.toLowerCase().endsWith('.json') ? dst.substring(0, dst.length - 5) : dst;

const doOptimize = !!(argv.o ?? argv.opt ?? argv.optimize);

const _writeTxt = <T=void>(path: string, pieces: CodePiece<T>[]) => {
  const fd = fs.openSync(path, 'w');
  for (const text of extractOrderedTextPhrases(pieces)) {
    fs.writeFileSync(fd, text, { encoding: encoding as BufferEncoding });
    fs.writeFileSync(fd, '\n', { encoding: encoding as BufferEncoding });
  }
  fs.closeSync(fd);
};

const _readTxt = <T=void>(path: string, pieces: CodePiece<T>[]) => {
  const phrases = extractOrderedTextPhrases(pieces);
  const result: string[] = [];
  const data = fs.readFileSync(path, { encoding: encoding as BufferEncoding }).split('\n');
  let lineNumber = 0;
  const bar1 = _bar('read txt');
  bar1.start(phrases.length, 0);
  for (let i = 0; i < phrases.length; ++i) {
    const lines = countNewLine(phrases[i]) + 1;
    let _result = '';
    for (let _ = 0; _ < lines; ++_)
      _result += (data[lineNumber++] ?? '').replace(/\r$/, '');
    result.push(_result);
    bar1.update(i);
  }
  bar1.stop();
  return result;
};

const _bar = (label?: string) => new cliProgress.SingleBar({
  format: `{bar} | ${label ?? 'PROGRESS'} | {percentage}% | {value}/{total} Chunks | Speed: {speed}`,
}, cliProgress.Presets.shades_classic);

const _key = (name: string, pid?: number) => `#${pid ?? ''}+${JSON.stringify(name)}`;

// real logic

if (command.startsWith('slice')) {
  validate(src, 'src', isFile);
  validate(dst, 'dst', isWritableOrCreatable);

  console.log(realDst);

  const passage = fs.readFileSync(src, { encoding: encoding as BufferEncoding });
  const ext = path.parse(src).ext.toLowerCase();
  const options: Partial<SlicerOptions<CodePieceExtra>> = {
    included: include,
    skipped: exclude,
    withTypeRecord: !!(argv.typeRecord ?? argv.withTypeRecord ?? argv.t),
  };

  const pieces: TypedCodePiece<CodePieceExtra>[] = [];
  const _o = (x: TypedCodePiece<CodePieceExtra>[]) => doOptimize ? CodeSlicer.optimize(x) : x;

  if (ext == '.html') {
    const proj = loadHtmlProject(passage);
    for (const { name, pid, content } of proj?.contents ?? []) {
      _o(CodeSlicer.slice(content, { ...options, externalData: { name, pid } }))
        .forEach((x) => pieces.push(x));
    }
  } else if (ext == '.harlowe') {
    _o(CodeSlicer.slice(passage, options)).forEach((x) => {
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
    _writeTxt(realDst + '.txt', pieces);
  }

  fs.writeFileSync(realDst + '.json', JSON.stringify(pieces, undefined, 2));

} else if (command.startsWith('repl')) {

  const res = path.normalize(String(argv.res ?? argv.resource ?? argv._[3] ?? ''));

  validate(src, 'src', isFile);
  validate(res, 'res', isFile);
  validate(dst, 'dst', isWritableOrCreatable);

  console.log(realDst);

  const passage = fs.readFileSync(src, { encoding: encoding as BufferEncoding });
  const ext = path.parse(src).ext.toLowerCase();
  const pieces = JSON.parse(
    fs.readFileSync(res, { encoding: encoding as BufferEncoding })
  ) as CodePiece<CodePieceExtra>[];

  const pieceMap = new Map<string, CodePiece<CodePieceExtra>[]>();
  for (const piece of pieces) {
    const key = _key(piece.ext!.name, piece.ext!.pid);
    if (!pieceMap.has(key))
      pieceMap.set(key, []);
    pieceMap.get(key)!.push(piece);
  }

  if (ext == '.html') {
    const proj = loadHtmlProject(passage);
    if (proj == undefined)
      exit(1);
    // replace content file
    for (const c of proj?.contents ?? []) {
      const { name, pid, content } = c;
      const key = _key(name, pid);
      const key2 = _key(name, undefined);
      c.content = CodeSlicer.replace(content, [
        ...(pieceMap.get(key) ?? []),
        ...(pieceMap.get(key2) ?? [])
      ]);
    }
    // replace html
    const saved = saveHtmlProject(passage, proj);
    fs.writeFileSync(realDst + '.html', saved, { encoding: encoding as BufferEncoding });
  }

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
} else if (command.startsWith('opt')) {

  const res = path.normalize(String(argv.res ?? argv.resource ?? argv._[3] ?? ''));
  const res2 = path.normalize(String(argv.res2 ?? argv.resource2 ?? argv._[4] ?? ''));
  validate(src, 'src', isFile);
  validate(res, 'res', isFile);
  validate(dst, 'dst', isWritableOrCreatable);

  console.log(realDst);

  const [glossary, replacements] = readGlossaryFile(res, encoding as BufferEncoding);

  const pieces = JSON.parse(fs.readFileSync(src, { encoding: encoding as BufferEncoding })) as TypedCodePiece<CodePieceExtra>[];

  const bar1 = _bar();

  if (doOptimize) {
    validate(res2, 'res2', isFile);
    const phrases = _readTxt(res2, pieces);
    const piecesReplaced = replaceOrderedTextPhrases(pieces, phrases);
    bar1.start(piecesReplaced.length, 0);
    piecesReplaced.forEach((piece) => {
      bar1.increment();
      piece.text = restoreProperNouns(piece.text, replacements);
    });
    bar1.stop();
    fs.writeFileSync(realDst + '.json', JSON.stringify(piecesReplaced, undefined, 2));

  } else {
    pieces.forEach((piece) => {
      piece.text = fenceProperNouns(piece.text, glossary);
    });
    fs.writeFileSync(realDst + '.json', JSON.stringify(pieces, undefined, 2));
  
    if (withTxtRecord) {
      _writeTxt(realDst + '.txt', pieces);
    }
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