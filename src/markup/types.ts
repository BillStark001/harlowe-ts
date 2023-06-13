
export type TokenData = {
  type?: string;
  aka?: string;

  place?: string;
  start?: number;
  end?: number;

  text?: string;
  innerText?: string;
  children?: TokenData[];
  innerMode?: string[];

  message?: string;
  isFront?: boolean;
  matches?: Record<string, string>;
  cannotCross?: Array<string>;
  name?: string;
  hidden?: boolean;

  // properties of different tokens

  depth?: number;
  align?: 'center' | 'justify' | 'left' | 'right';

  // column
  column?: 'center' | 'none' | 'left' | 'right';
  width?: number;
  marginLeft?: number;
  marginRight?: number;

  // css
  value?: number;
  colour?: string;

  // calc
  operator?: string;
  negate?: boolean;

  // link
  passage?: string;

};

export type MatchToTokenFunc = (match: string | string[]) => TokenData;


export type RuleData = {
  fn: MatchToTokenFunc;
  constraint?: (token: TokenData) => boolean;
  cannotFollowText?: boolean;
} & ({
  pattern?: string;
  plainCompare: true;
} | {
  pattern?: RegExp;
  plainCompare?: false;
})

export type RuleMap = Record<string, RuleData>;
