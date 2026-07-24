import {TerminalFactory} from '../terminal/terminal-factory';
import {GhService} from './services/gh-service';

export class GhFactory {
  public getGhService(): GhService {
    return new GhService(
      this.cwd,
      this.terminalFactory.getChildProcessService(),
    );
  }

  constructor(
    private readonly cwd: string,
    private readonly terminalFactory: TerminalFactory,
  ) {}

  static make(cwd: string, terminalFactory: TerminalFactory): GhFactory {
    return new GhFactory(cwd, terminalFactory);
  }
}
