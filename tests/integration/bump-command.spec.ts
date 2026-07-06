import {execSync} from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {join} from 'node:path';

import {BumpCommand} from '../../src/application/cli/bump-command';
import {BumpInputs} from '../../src/application/cli/types/input-bump';
import {testingCliFactory} from '../__mocks__/setup-cli-factory';
import {createTestRepo, TestRepo} from '../__mocks__/setup-git-repository';

describe('Full tag-release-build pipeline', () => {
  let testRepo: TestRepo;

  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    testRepo?.cleanup();
  });

  describe('Scenario A: Minor bump from feat commit', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump version.txt from 1.2.3 to 1.3.0', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('1.3.0');
    });

    it('Should create annotated tag v1.3.0', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const tags = execSync('git tag -l', {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split('\n');

      expect(tags).toContain('v1.3.0');
    });

    it('Should write CHANGELOG.md with ## v1.3.0 heading', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('## v1.3.0');
    });

    it('Should write CHANGELOG.md with ### Features section', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('### Features');
    });

    it('Should write CHANGELOG.md with feat: add thing content', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('feat: add thing');
    });
  });

  describe('Scenario B: Patch bump from fix commit', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump version.txt from 1.2.3 to 1.2.4', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('1.2.4');
    });

    it('Should create annotated tag v1.2.4', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const tags = execSync('git tag -l', {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split('\n');

      expect(tags).toContain('v1.2.4');
    });

    it('Should write CHANGELOG.md with ## v1.2.4 heading', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.2.4');
    });

    it('Should write CHANGELOG.md with ### Bug Fixes section', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Bug Fixes');
    });

    it('Should write CHANGELOG.md with fix: typo content', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('fix: typo');
    });
  });

  describe('Scenario C: Major bump from breaking change', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump version.txt from 1.2.3 to 2.0.0', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });

    it('Should create annotated tag v2.0.0', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const tags = execSync('git tag -l', {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split('\n');
      expect(tags).toContain('v2.0.0');
    });
  });

  describe('Scenario D: Explicit semantic overrides inference', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump to 2.0.0 (not 1.2.4) when explicit major overrides fix commit', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      bumpCommand.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('2.0.0');
    });
  });

  describe('Scenario E: Floating tag override', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should create floating tag 1 when overrideTag is true', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: true,
      };
      bumpCommand.run(inputs);

      const tags = execSync('git tag -l', {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split('\n');

      expect(tags).toEqual(['v1', 'v1.2.3', 'v1.3', 'v1.3.0']);
    });

    it('Should create floating tag 3 when overrideTag is true', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: true,
      };
      bumpCommand.run(inputs);

      const tags = execSync('git tag -l', {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split('\n');

      expect(tags).toEqual(expect.arrayContaining(['v1.3', 'v1.3.0']));
    });
  });

  describe('Scenario F: Multiple commit types rendered in CHANGELOG', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing', 'fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should write CHANGELOG.md with ### Features section', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Features');
    });

    it('Should write CHANGELOG.md with ### Bug Fixes section', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Bug Fixes');
    });
  });

  describe('Scenario G: Breaking changes section in CHANGELOG', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should write CHANGELOG.md with ### ⚠ BREAKING CHANGES section', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### ⚠ BREAKING CHANGES');
    });

    it('Should include feat! prefix in breaking change entry', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat!');
    });
  });

  describe('Scenario H: Existing CHANGELOG.md prepends new entry', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      writeFileSync(
        join(workDir, 'CHANGELOG.md'),
        '## v1.0.0 (2020-01-01)\n\n* old entry\n',
      );
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should prepend new version heading to existing CHANGELOG', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.3.0');
    });

    it('Should retain existing content after new entry', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.0.0');
    });

    it('Should place new entry before existing content', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      const newIndex = changelog.indexOf('## v1.3.0');
      const oldIndex = changelog.indexOf('## v1.0.0');
      expect(newIndex).toBeLessThan(oldIndex);
    });
  });

  describe('Scenario I: Non-conventional commit produces patch bump', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['random update without prefix'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump version.txt from 1.2.3 to 1.2.4', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });

    it('Should write CHANGELOG.md with ### Miscellaneous Chores section', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Miscellaneous Chores');
    });

    it('Should include the raw commit message in CHANGELOG', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('random update without prefix');
    });
  });

  describe('Scenario J: Commit with scope rendered in CHANGELOG', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat(api): add endpoint'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should include scope in CHANGELOG entry', () => {
      bumpCommand.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat(api): add endpoint');
    });
  });

  describe('Scenario K: Explicit semantic minor overrides inference', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump to 1.3.0 when explicit minor overrides fix commit', () => {
      bumpCommand.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.3.0');
    });
  });

  describe('Scenario L: Explicit semantic patch overrides inference', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump to 1.2.4 when explicit patch overrides feat commit', () => {
      bumpCommand.run({
        semantic: 'patch',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });
  });

  describe('Scenario M: Empty version file throws error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      writeFileSync(join(workDir, 'version.txt'), '');
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error for empty version file', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario N: Invalid semantic throws error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error for invalid semantic value', () => {
      const inputs: BumpInputs = {
        semantic: 'foo',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario O: GitHub release failure throws error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir, {
        ghCreateReleaseReturn: {
          ok: false,
          error: new Error('gh release failed'),
        },
      });
    });

    it('Should throw error when GitHub release creation fails', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow('gh release failed');
    });
  });

  describe('Scenario P: Git apply failure propagates error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when git pull fails with non-existent branch', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'nonexistent-branch',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario Q: Non-numeric version file throws error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      writeFileSync(join(workDir, 'version.txt'), 'abc');
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when version file has no numeric part', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario R: Non-matching tag prefix falls back to full log', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should bump when no tags match the prefix', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'z',
        overrideTag: false,
      };

      bumpCommand.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });

    it('Should include feat commit in CHANGELOG even with non-matching tag prefix', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'z',
        overrideTag: false,
      };

      bumpCommand.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat: add thing');
    });
  });

  describe('Scenario S: Real GhService fails in test repo without GitHub remote', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir, {useRealGhService: true});
    });

    it('Should throw error when real gh CLI cannot resolve repository', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario S2: Real GhService fails when release notes path is a directory', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      mkdirSync(join(workDir, '.release-notes.tmp.md'));
      bumpCommand = testingCliFactory(workDir, {useRealGhService: true});
    });

    it('Should throw error when release notes temp file is a directory', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario T: CHANGELOG.md is a directory throws update error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      workDir = testRepo.workDir;
      mkdirSync(join(workDir, 'CHANGELOG.md'));
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when CHANGELOG.md is a directory', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario U: version.txt is a directory throws read error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      // Remove the file and create a directory with the same name
      const versionPath = join(workDir, 'version.txt');
      rmSync(versionPath);
      mkdirSync(versionPath);
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when version file is a directory', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario V: Read-only version file throws write error', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      const versionPath = join(workDir, 'version.txt');
      writeFileSync(versionPath, '1.2.3');
      chmodSync(versionPath, 0o444);
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when version file is read-only', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario W: Corrupt git HEAD fails classifyLastCommit with empty semantic', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      rmSync(join(workDir, '.git', 'HEAD'));
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when git HEAD is missing and semantic is empty', () => {
      const inputs: BumpInputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });

  describe('Scenario X: Corrupt git HEAD fails changelog generation with explicit semantic', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      rmSync(join(workDir, '.git', 'HEAD'));
      bumpCommand = testingCliFactory(workDir);
    });

    it('Should throw error when git HEAD is missing and semantic is explicit', () => {
      const inputs: BumpInputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        refName: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => bumpCommand.run(inputs)).toThrow();
    });
  });
});
