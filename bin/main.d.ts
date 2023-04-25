interface HarloweToolArgs {
  src: string;
  rec?: string;
  dst?: string;
  slice: boolean;
  recover: boolean;
  extract: boolean;
  hydrate: boolean;
  help: boolean;
  include?: string[];
  exclude?: string[];
}