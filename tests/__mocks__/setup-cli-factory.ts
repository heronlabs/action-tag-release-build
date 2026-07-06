import {BumpCommand} from '../../src/application/cli/bump-command';
import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {GitService} from '../../src/infrastructure/git/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/child-process-service';
import {GhServiceMock, GhServiceMoq} from './infrastructure/gh-service-mock';

export const testingCliFactory = (workDir: string): BumpCommand => {
  GhServiceMock.createRelease.mockReturnValue({ok: true});

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
  return new BumpCommand([], semverService, changelogService);
};
