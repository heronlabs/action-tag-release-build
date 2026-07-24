import {TerminalFactory} from '../terminal/terminal-factory';
import {GitService} from './services/git-service';

export class GitFactory {
  public getGitService(): GitService {
    return new GitService(this.terminalFactory.getChildProcessService());
  }

  constructor(private readonly terminalFactory: TerminalFactory) {}

  static make(terminalFactory: TerminalFactory): GitFactory {
    return new GitFactory(terminalFactory);
  }
}
