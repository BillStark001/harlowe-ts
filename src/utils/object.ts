export const arrayEquals = <T>(a: T[], b: T[]): boolean => {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
};

export const hasUtf8Bom = (fileContent: string | Buffer) => {
  if (typeof fileContent === 'string') {
    fileContent = Buffer.from(fileContent, 'utf-8');
  }
  return fileContent[0] === 0xEF && fileContent[1] === 0xBB && fileContent[2] === 0xBF;
};

export const countNewLine = (x: string) => (x.match(/\r?\n/g) || []).length;