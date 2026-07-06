import {BumpCommand} from '../../src/application/cli/bump-command';
import {Bumper} from '../../src/core/interfaces/bumper';
import {ClaudeService} from '../../src/core/services/bumpers/claude-bumper-service';
import {NpmService} from '../../src/core/services/bumpers/npm-bumper-service';
import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {Bumpers} from '../../src/core/types/bumpers';
import {GitService} from '../../src/infrastructure/git/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/child-process-service';
import {GhServiceMock, GhServiceMoq} from './infrastructure/gh-service-mock';

export interface TestingCliOptions {
  bumpers?: Bumpers[];
  ghCreateReleaseReturn?: {ok: true} | {ok: false; error: Error};
}

export const testingCliFactory = (
  workDir: string,
  opts: TestingCliOptions = {},
): BumpCommand => {
  GhServiceMock.createRelease.mockReturnValue(
    opts.ghCreateReleaseReturn ?? {ok: true},
  );

  const childProcessService = new ChildProcessService(workDir);
  const gitService = new GitService(childProcessService);
  const commitService = new CommitService(gitService);
  const semverService = new SemverService(workDir, commitService);
  const changelogService = new ChangelogService(
    workDir,
    gitService,
    GhServiceMoq,
    commitService,
  );

  const bumpers: Bumper[] = (opts.bumpers ?? []).map(name => {
    if (name === 'npm') return new NpmService(childProcessService);
    if (name === 'claude') return new ClaudeService(workDir);
    throw new Error(`Unknown bumper: ${name}`);
  });

  return new BumpCommand(bumpers, semverService, changelogService);
};
