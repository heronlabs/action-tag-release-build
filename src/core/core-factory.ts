import {GhFactory} from '../infrastructure/gh/gh-factory';
import {GitFactory} from '../infrastructure/git/git-factory';
import {TerminalFactory} from '../infrastructure/terminal/terminal-factory';
import {ClaudeService} from './services/bumpers/claude-bumper-service';
import {NpmService} from './services/bumpers/npm-bumper-service';
import {ChangelogService} from './services/changelog-service';
import {CommitService} from './services/commit-service';
import {SemverService} from './services/semver-service';
import {SyncService} from './services/sync-service';

export class CoreFactory {
  public getCommitService(): CommitService {
    return new CommitService(this.gitFactory.getGitService());
  }

  public getSemverService(): SemverService {
    return new SemverService(this.cwd, this.getCommitService());
  }

  public getSyncService(): SyncService {
    return new SyncService(
      this.gitFactory.getGitService(),
      this.ghFactory.getPullRequestService(),
    );
  }

  public getChangelogService(): ChangelogService {
    return new ChangelogService(
      this.cwd,
      this.gitFactory.getGitService(),
      this.ghFactory.getReleaseNotesService(),
      this.getCommitService(),
    );
  }

  public getNpmService(): NpmService {
    return new NpmService(this.terminalFactory.getChildProcessService());
  }

  public getClaudeService(pluginDir: string): ClaudeService {
    return new ClaudeService(this.cwd, pluginDir);
  }

  constructor(
    private readonly cwd: string,
    private readonly gitFactory: GitFactory,
    private readonly ghFactory: GhFactory,
    private readonly terminalFactory: TerminalFactory,
  ) {}

  static make(cwd: string): CoreFactory {
    const terminalFactory = TerminalFactory.make(cwd);
    const gitFactory = GitFactory.make(terminalFactory);
    const ghFactory = GhFactory.make(cwd, terminalFactory);
    return new CoreFactory(cwd, gitFactory, ghFactory, terminalFactory);
  }
}
