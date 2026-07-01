import {ChangelogService} from '../../core/services/changelog-service';
import {TaggerService} from '../../core/services/tagger-service';
import {VersionService} from '../../core/services/version-service';
import {ClaudeService} from '../../infrastructure/bumpers/claude-bumper-service';
import {NpmService} from '../../infrastructure/bumpers/npm-bumper-service';
import {GhService} from '../../infrastructure/gh/gh-service';
import {GitService} from '../../infrastructure/git/git-service';
import {ChildProcessService} from '../../infrastructure/terminal/child-process-service';
import {BumpCommand} from './bump-command';

export class BumpFactory {
  static make(): BumpCommand {
    const cwd = process.cwd();
    const childProcessService = new ChildProcessService(cwd);

    const bumpers = [
      new ClaudeService(cwd),
      new NpmService(childProcessService),
    ];
    const versionService = new VersionService(cwd);
    const taggerService = new TaggerService();
    const gitService = new GitService(childProcessService);
    const gitHubService = new GhService(cwd, childProcessService);
    const changelogService = new ChangelogService(cwd, gitService);

    return new BumpCommand(
      bumpers,
      versionService,
      taggerService,
      gitService,
      gitHubService,
      changelogService,
    );
  }
}
