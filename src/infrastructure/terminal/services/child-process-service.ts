import {execFileSync} from 'node:child_process';

export class ChildProcessService {
  private success(data: string) {
    return {
      ok: true as const,
      data,
      execChain: (command: string, args: string[]) =>
        this.execChain(command, args),
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

  execChain(command: string, args: string[]) {
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
      if (error instanceof Error) {
        const stderr = (error as {stderr?: Buffer | string}).stderr
          ?.toString()
          .trim();

        error.message =
          `${error.message} [${[command, ...args].join(' ')}]` +
          (stderr ? `\n${stderr}` : '');
      }

      return {ok: false as const, error};
    }
  }

  constructor(private readonly cwd: string) {}
}
