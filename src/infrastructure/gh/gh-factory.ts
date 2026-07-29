import {TerminalFactory} from '../terminal/terminal-factory';
import {MergeService} from './services/merge-service';
import {PullRequestService} from './services/pull-request-service';
import {ReleaseNotesService} from './services/release-notes-service';

export class GhFactory {
  public getReleaseNotesService(): ReleaseNotesService {
    return new ReleaseNotesService(
      this.cwd,
      this.terminalFactory.getChildProcessService(),
    );
  }

  public getPullRequestService(): PullRequestService {
    return new PullRequestService(
      this.terminalFactory.getChildProcessService(),
    );
  }

  public getMergeService(): MergeService {
    return new MergeService(this.terminalFactory.getChildProcessService());
  }

  constructor(
    private readonly cwd: string,
    private readonly terminalFactory: TerminalFactory,
  ) {}

  static make(cwd: string, terminalFactory: TerminalFactory): GhFactory {
    return new GhFactory(cwd, terminalFactory);
  }
}
