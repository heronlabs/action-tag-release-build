import {execFileSync} from 'node:child_process';

import {ChainResult} from '../types/chain-result';

export class ChildProcessService {
  private success(data: string): ChainResult {
    return {
      ok: true,
      data,
      execChain: (command: string, args: string[]) =>
        this.execChain(command, args),
    };
  }

  private failure(error: unknown): ChainResult {
    const result: ChainResult = {
      ok: false,
      error,
      execChain: () => result,
    };
    return result;
  }

  execChain(command: string, args: string[]): ChainResult {
    const result = this.exec(command, args);

    if (!result.ok) return this.failure(result.error);

    return this.success(result.data);
  }

  exec(command: string, args: string[]) {
    try {
      const data = execFileSync(command, args, {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .toString()
        .trim();
      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly cwd: string) {}
}
