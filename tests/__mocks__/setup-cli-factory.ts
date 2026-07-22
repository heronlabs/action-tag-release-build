import {BumpCommand} from '../../src/application/cli/bump-command/bump-command';
import {Bumper} from '../../src/core/interfaces/bumper';
import {ClaudeService} from '../../src/core/services/bumpers/claude-bumper-service';
import {NpmService} from '../../src/core/services/bumpers/npm-bumper-service';
import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {GhService} from '../../src/infrastructure/gh/services/gh-service';
import {GitService} from '../../src/infrastructure/git/services/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/services/child-process-service';
import {GhServiceMock, GhServiceMoq} from './infrastructure/gh-service-mock';

export type Bumpers = 'claude' | 'npm';

export interface TestingCliOptions {
  bumpers?: Bumpers[];
  ghCreateReleaseReturn?: {ok: true} | {ok: false; error: Error};
  useRealGhService?: boolean;
  patchServices?: (services: {
    gitService: GitService;
    commitService: CommitService;
  }) => void;
}

export const testingCliFactory = (
  workDir: string,
  opts: TestingCliOptions = {},
): BumpCommand => {
  const childProcessService = new ChildProcessService(workDir);
  const gitService = new GitService(childProcessService);

  const ghService = opts.useRealGhService
    ? new GhService(workDir, childProcessService)
    : (() => {
        GhServiceMock.createRelease.mockReturnValue(
          opts.ghCreateReleaseReturn ?? {ok: true},
        );
        return GhServiceMoq;
      })();

  const commitService = new CommitService(gitService);
  const semverService = new SemverService(workDir, commitService);
  const changelogService = new ChangelogService(
    workDir,
    gitService,
    ghService,
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

  return new BumpCommand(bumpers, semverService, changelogService);
};
