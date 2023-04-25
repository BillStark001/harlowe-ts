interface HarloweToolArgs {
  src: string;
  rec?: string;
  dst?: string;
  slice: boolean;
  recv: boolean;
  convert: boolean;
  help: boolean;
  include?: string[];
  exclude?: string[];
}