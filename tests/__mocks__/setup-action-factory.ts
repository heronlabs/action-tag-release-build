import {Command} from '../../src/application/action/command/command';
import {Bumper} from '../../src/core/interfaces/bumper';
import {ClaudeService} from '../../src/core/services/bumpers/claude-bumper-service';
import {NpmService} from '../../src/core/services/bumpers/npm-bumper-service';
import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {SyncService} from '../../src/core/services/sync-service';
import {GitService} from '../../src/infrastructure/git/services/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/services/child-process-service';
import {PullRequestServiceMoq} from './infrastructure/pull-request-service-mock';
import {ReleaseNotesServiceMoq} from './infrastructure/release-notes-service-mock';

export type Bumpers = 'claude' | 'npm';

export interface TestingCliOptions {
  bumpers?: Bumpers[];
  patchServices?: (services: {
    gitService: GitService;
    commitService: CommitService;
  }) => void;
}

export const testingCliFactory = (
  workDir: string,
  opts: TestingCliOptions = {},
): Command => {
  const childProcessService = new ChildProcessService(workDir);
  const gitService = new GitService(childProcessService);

  const releaseNotesService = ReleaseNotesServiceMoq;
  const pullRequestService = PullRequestServiceMoq;

  const commitService = new CommitService(gitService);
  const semverService = new SemverService(workDir, commitService);

  const syncService = new SyncService(gitService, pullRequestService);
  const changelogService = new ChangelogService(
    workDir,
    gitService,
    releaseNotesService,
    commitService,
  );

  if (opts.patchServices) {
    opts.patchServices({gitService, commitService});
  }

  const bumpers: Bumper[] = (opts.bumpers ?? []).map(name => {
    if (name === 'npm') return new NpmService(childProcessService);
    if (name === 'claude') return new ClaudeService(workDir, '.claude-plugin');
    throw new Error(`Unknown bumper: ${name}`);
  });

  return new Command(bumpers, semverService, changelogService, syncService);
};
