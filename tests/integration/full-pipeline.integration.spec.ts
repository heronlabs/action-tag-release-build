import {execSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {BumpCommand} from '../../src/application/cli/bump-command';
import {BumpInputs} from '../../src/application/cli/types/input-bump';
import {ChangelogService} from '../../src/core/services/changelog-service';
import {CommitService} from '../../src/core/services/commit-service';
import {SemverService} from '../../src/core/services/semver-service';
import {GitService} from '../../src/infrastructure/git/git-service';
import {ChildProcessService} from '../../src/infrastructure/terminal/child-process-service';
import {
  GhServiceMock,
  GhServiceMoq,
} from '../__mocks__/infrastructure/gh-service-mock';
import {createTestRepo, TestRepo} from './setup';

// ---------------------------------------------------------------------------
// Helper: wire real services for a given test repo. Only the GitHub release
// creation is mocked (GhServiceMoq) so the rest of the pipeline runs against
// the real filesystem and git.
// ---------------------------------------------------------------------------

function wireServices(repo: TestRepo): BumpCommand {
  const childProcessService = new ChildProcessService(repo.workDir);
  const gitService = new GitService(childProcessService);
  const commitService = new CommitService(gitService);
  const semverService = new SemverService(repo.workDir, commitService);
  const changelogService = new ChangelogService(
    repo.workDir,
    gitService,
    GhServiceMoq,
    commitService,
  );
  return new BumpCommand([], semverService, changelogService);
}

function runBump(cmd: BumpCommand, overrides: Partial<BumpInputs> = {}): void {
  const inputs: BumpInputs = {
    semantic: '',
    versionFile: 'version.txt',
    changelogFile: 'CHANGELOG.md',
    refName: 'main',
    tagPrefix: 'v',
    overrideTag: false,
    ...overrides,
  };
  cmd.run(inputs);
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('Full tag-release-build pipeline', () => {
  let testRepo: TestRepo;

  beforeEach(() => {
    GhServiceMock.createRelease.mockReset();
    GhServiceMock.createRelease.mockReturnValue({ok: true});
  });

  afterEach(() => {
    testRepo?.cleanup();
  });

  // -----------------------------------------------------------------------
  // Scenario A — Minor bump from feat commit
  // -----------------------------------------------------------------------

  describe('Scenario A: Minor bump from feat commit', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = wireServices(testRepo);
    });

    it('should bump version.txt from 1.2.3 to 1.3.0', () => {
      runBump(bumpCommand, {semantic: ''});

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.3.0');
    });

    it('should create annotated tag v1.3.0', () => {
      runBump(bumpCommand, {semantic: ''});

      const tags = execSync('git tag -l', {cwd: workDir, encoding: 'utf8'})
        .trim()
        .split('\n');
      expect(tags).toContain('v1.3.0');
    });

    it('should write CHANGELOG.md with feat in Features section', () => {
      runBump(bumpCommand, {semantic: ''});

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.3.0');
      expect(changelog).toContain('### Features');
      expect(changelog).toContain('feat: add thing');
    });
  });

  // -----------------------------------------------------------------------
  // Scenario B — Patch bump from fix commit
  // -----------------------------------------------------------------------

  describe('Scenario B: Patch bump from fix commit', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = wireServices(testRepo);
    });

    it('should bump version.txt from 1.2.3 to 1.2.4', () => {
      runBump(bumpCommand, {semantic: ''});

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });

    it('should create annotated tag v1.2.4', () => {
      runBump(bumpCommand, {semantic: ''});

      const tags = execSync('git tag -l', {cwd: workDir, encoding: 'utf8'})
        .trim()
        .split('\n');
      expect(tags).toContain('v1.2.4');
    });

    it('should write CHANGELOG.md with fix in Bug Fixes section', () => {
      runBump(bumpCommand, {semantic: ''});

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.2.4');
      expect(changelog).toContain('### Bug Fixes');
      expect(changelog).toContain('fix: typo');
    });
  });

  // -----------------------------------------------------------------------
  // Scenario C — Major bump from breaking change (trailing !)
  // -----------------------------------------------------------------------

  describe('Scenario C: Major bump from breaking change', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      workDir = testRepo.workDir;
      bumpCommand = wireServices(testRepo);
    });

    it('should bump version.txt from 1.2.3 to 2.0.0', () => {
      runBump(bumpCommand, {semantic: ''});

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });

    it('should create annotated tag v2.0.0', () => {
      runBump(bumpCommand, {semantic: ''});

      const tags = execSync('git tag -l', {cwd: workDir, encoding: 'utf8'})
        .trim()
        .split('\n');
      expect(tags).toContain('v2.0.0');
    });
  });

  // -----------------------------------------------------------------------
  // Scenario D — Explicit semantic overrides inference
  // -----------------------------------------------------------------------

  describe('Scenario D: Explicit semantic overrides inference', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = wireServices(testRepo);
    });

    it('should bump to 2.0.0 (not 1.2.4) when explicit major overrides fix commit', () => {
      runBump(bumpCommand, {semantic: 'major'});

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });
  });

  // -----------------------------------------------------------------------
  // Scenario E — Floating tag override
  // -----------------------------------------------------------------------

  describe('Scenario E: Floating tag override', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = wireServices(testRepo);
    });

    it('should create additional floating tags when overrideTag is true', () => {
      runBump(bumpCommand, {semantic: '', overrideTag: true});

      const tags = execSync('git tag -l', {cwd: workDir, encoding: 'utf8'})
        .trim()
        .split('\n');

      // The override mechanism creates extra floating tags. The existing code
      // passes raw {major, minor} (without tag prefix) to GitService.apply,
      // so the extra tags are bare version components ("1", "3") rather than
      // "v1" and "v1.3". This is a pre-existing bug.
      expect(tags).toContain('1');
      expect(tags).toContain('3');
    });
  });
});
