import {execSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {GitService} from '../../src/infrastructure/git/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/child-process-service';
import {GhServiceMoq} from '../__mocks__/infrastructure/gh-service-mock';
import {testingCliFactory} from '../__mocks__/setup-cli-factory';
import {createTestRepo, TestRepo} from '../__mocks__/setup-git-repository';

/**
 * Cover the 4 unreachable catch blocks by temporarily patching
 * specific instance methods to simulate "impossible" internal
 * exceptions. All services except the patched method are real.
 */
describe('Error path coverage for defensive catch blocks', () => {
  let testRepo: TestRepo;

  afterEach(() => {
    testRepo?.cleanup();
  });

  describe('commit-service.ts parseDescriptionSince catch block [line 46]', () => {
    it('Should return error when getDescriptionSince throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const gitService = new GitService(
        new ChildProcessService(testRepo.workDir),
      );
      gitService.getDescriptionSince = () => {
        throw new Error('simulated internal exception');
      };
      const commitService = new CommitService(gitService);

      const result = commitService.parseDescriptionSince('v');

      expect(result).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('commit-service.ts classifyLastCommit catch block [line 70]', () => {
    it('Should return error when getLastCommit throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const gitService = new GitService(
        new ChildProcessService(testRepo.workDir),
      );
      gitService.getLastCommit = () => {
        throw new Error('simulated internal exception');
      };
      const commitService = new CommitService(gitService);

      const result = commitService.classifyLastCommit();

      expect(result).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('changelog-service.ts generateReleaseNotes catch block [line 52]', () => {
    it('Should return error when release notes generation throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      const childProcessService = new ChildProcessService(workDir);
      const gitService = new GitService(childProcessService);
      const commitService = new CommitService(gitService);
      commitService.parseDescriptionSince = () => {
        throw new Error('simulated internal exception');
      };
      const changelogService = new ChangelogService(
        workDir,
        gitService,
        GhServiceMoq,
        commitService,
      );

      const result = changelogService.applyReleaseChangelog({
        tagPrefix: 'v',
        nextVersion: '1.3.0',
        major: '1',
        minor: '3',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        overrideTag: false,
      });

      expect(result).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('semver-service.ts calculate catch block [line 49]', () => {
    it('Should return error when semver calculation throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      const versionPath = join(workDir, 'version.txt');
      const version = readFileSync(versionPath, 'utf8').trim();
      expect(version).toBe('1.2.3');

      const childProcessService = new ChildProcessService(workDir);
      const gitService = new GitService(childProcessService);
      const commitService = new CommitService(gitService);
      const semverService = new SemverService(workDir, commitService);

      vi.spyOn(globalThis, 'parseInt').mockImplementation(() => {
        throw new Error('simulated parseInt failure');
      });

      const result = semverService.calculateNextVersion('version.txt', 'major');

      expect(result).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('commit-service.ts classifyLastCommit no commits branch [line 63]', () => {
    it('Should return patch when commit log is empty', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      // Add a commit with empty message so git log returns empty string
      execSync('git commit --allow-empty --allow-empty-message -m ""', {
        cwd: workDir,
        stdio: 'pipe',
      });
      const bumpCommand = testingCliFactory(workDir);

      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      // Empty commit → no type detected → patch bump
      expect(version).toBe('1.2.4');
    });
  });

  describe('claude-bumper-service.ts already-matching version branches [lines 40, 59]', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      // Pre-set plugin and marketplace to the EXPECTED next version (1.3.0)
      // so the "version already matches" branch is taken
      const plugin = {name: 'my-plugin', version: '1.3.0'};
      writeFileSync(
        join(workDir, 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = [{name: 'my-plugin', version: '1.3.0'}];
      writeFileSync(
        join(workDir, 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should skip plugin update when version already matches', () => {
      bumpCommand.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const plugin = JSON.parse(
        readFileSync(join(workDir, 'plugin.json'), 'utf8'),
      ) as {version: string};
      // Still 1.3.0 because it already matched, skip overwrite
      expect(plugin.version).toBe('1.3.0');
    });

    it('Should skip marketplace update when version already matches', () => {
      bumpCommand.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const marketplace = JSON.parse(
        readFileSync(join(workDir, 'marketplace.json'), 'utf8'),
      ) as Array<{version: string}>;
      expect(marketplace[0].version).toBe('1.3.0');
    });
  });
});
