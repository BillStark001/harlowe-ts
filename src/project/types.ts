import { TokenData } from '../markup';

export type StoryDescriptor = {
  name: string;
  ifid?: string;
  startPassage: string;
  meta?: StoryMetaData;
  options?: StoryOptions;
}

export type StoryMetaData = {
  creator?: string;
  creatorVersion?: string;
  zoom?: number;
  format?: string;
  formatVersion?: string;
};

export type StoryOptions = {
  escapeLeadingReturns?: number;
  escapeTrailingReturns?: number;
  escapeSameLineTrailingReturn?: boolean;

  defaultNameWithPath?: boolean;

  uncompressedPureValues?: boolean;
  uncompressedStructures?: boolean;
};

export type DebugOptions = {
  debug?: boolean;
  evalReplay?: boolean;
  speedMultiplier?: number;
  ignoreGotos?: boolean;
  ignoreClickEvents?: boolean;
}


export type PassageDescriptor = {
  name: string;
  pid?: number;
  tags?: string[];
  position?: [number, number];
  size?: [number, number];
};

export type PassageContentDescriptor = {
  name: string;
  content: string;
};

export type PassageSpan = {
  name: string;
  tags: string[];
  ast: TokenData[];
};

export type TagDescriptor = {
  name: string;
  color: string;
};

export type StoryData = {
  desc: StoryDescriptor;
  debugOptions?: DebugOptions;
  tags: TagDescriptor[];
  passages: PassageDescriptor[];
  contents: PassageContentDescriptor[];
};