export type ChainResult =
  | {
      ok: true;
      data: string;
      execChain: (command: string, args: string[]) => ChainResult;
    }
  | {
      ok: false;
      error: unknown;
      execChain: (command: string, args: string[]) => ChainResult;
    };
