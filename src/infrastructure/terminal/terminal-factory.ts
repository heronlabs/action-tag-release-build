import {ChildProcessService} from './services/child-process-service';

export class TerminalFactory {
  public getChildProcessService(): ChildProcessService {
    return new ChildProcessService(this.cwd);
  }

  constructor(private readonly cwd: string) {}

  static make(cwd: string): TerminalFactory {
    return new TerminalFactory(cwd);
  }
}
