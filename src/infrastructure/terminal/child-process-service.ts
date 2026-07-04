import {execSync} from 'node:child_process';

export class ChildProcessService {
  private success(data: string) {
    return {
      ok: true as const,
      data,
      execChain: (nextCommand: string) => this.execChain(nextCommand),
    };
  }

  private failure(error: unknown) {
    const result = {
      ok: false as const,
      error,
      execChain: () => result,
    };
    return result;
  }

  execChain(command: string) {
    try {
      const data = execSync(command, {cwd: this.cwd, encoding: 'utf8'})
        .toString()
        .trim();
      return this.success(data);
    } catch (error) {
      return this.failure(error);
    }
  }

  exec(command: string) {
    try {
      const data = execSync(command, {cwd: this.cwd, encoding: 'utf8'})
        .toString()
        .trim();
      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly cwd: string) {}
}
