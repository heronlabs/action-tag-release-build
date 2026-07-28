import {execSync} from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {join} from 'node:path';

import {Inputs} from '../../src/application/action/command/types/inputs';
import {testingCliFactory} from '../__mocks__/setups/setup-action-factory';
import {createTestRepo, TestRepo} from '../__mocks__/setups/setup-github';

describe('Full tag-release-build pipeline', () => {
  let testRepo: TestRepo;

  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    testRepo?.cleanup();
  });

  describe('Minor bump from feat commit', () => {
    it('Should bump version.txt from 1.2.3 to 1.3.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('1.3.0');
    });

    it('Should create annotated tag v1.3.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

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
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('## v1.3.0');
    });

    it('Should write CHANGELOG.md with ### Features section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('### Features');
    });

    it('Should write CHANGELOG.md with feat: add thing content', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');

      expect(changelog).toContain('feat: add thing');
    });
  });

  describe('Patch bump from fix commit', () => {
    it('Should bump version.txt from 1.2.3 to 1.2.4', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('1.2.4');
    });

    it('Should create annotated tag v1.2.4', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

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
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.2.4');
    });

    it('Should write CHANGELOG.md with ### Bug Fixes section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Bug Fixes');
    });

    it('Should write CHANGELOG.md with fix: typo content', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('fix: typo');
    });
  });

  describe('Major bump from breaking change', () => {
    it('Should bump version.txt from 1.2.3 to 2.0.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });

    it('Should create annotated tag v2.0.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

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

  describe('Explicit semantic overrides inference', () => {
    it('Should bump to 2.0.0 (not 1.2.4) when explicit major overrides fix commit', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };
      command.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();

      expect(version).toBe('2.0.0');
    });
  });

  describe('Floating tag override', () => {
    it('Should create floating tag 1 when overrideTag is true', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: true,
      };
      command.run(inputs);

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
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: true,
      };
      command.run(inputs);

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

  describe('Multiple commit types rendered in CHANGELOG', () => {
    it('Should write CHANGELOG.md with ### Features section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing', 'fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Features');
    });

    it('Should write CHANGELOG.md with ### Bug Fixes section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing', 'fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Bug Fixes');
    });
  });

  describe('Breaking changes section in CHANGELOG', () => {
    it('Should write CHANGELOG.md with ### ⚠ BREAKING CHANGES section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### ⚠ BREAKING CHANGES');
    });

    it('Should include feat! prefix in breaking change entry', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat!: break API'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat!');
    });
  });

  describe('Breaking change with scope renders scope in entry', () => {
    it('Should include scope in breaking change CHANGELOG entry', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat(api)!: break API'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat(api)!');
    });
  });

  describe('Existing CHANGELOG.md prepends new entry', () => {
    it('Should prepend new version heading to existing CHANGELOG', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      writeFileSync(
        join(workDir, 'CHANGELOG.md'),
        '## v1.0.0 (2020-01-01)\n\n* old entry\n',
      );
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.3.0');
    });

    it('Should retain existing content after new entry', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      writeFileSync(
        join(workDir, 'CHANGELOG.md'),
        '## v1.0.0 (2020-01-01)\n\n* old entry\n',
      );
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('## v1.0.0');
    });

    it('Should place new entry before existing content', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      writeFileSync(
        join(workDir, 'CHANGELOG.md'),
        '## v1.0.0 (2020-01-01)\n\n* old entry\n',
      );
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      const newIndex = changelog.indexOf('## v1.3.0');
      const oldIndex = changelog.indexOf('## v1.0.0');
      expect(newIndex).toBeLessThan(oldIndex);
    });
  });

  describe('Non-conventional commit produces patch bump', () => {
    it('Should bump version.txt from 1.2.3 to 1.2.4', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['random update without prefix'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });

    it('Should write CHANGELOG.md with ### Miscellaneous Chores section', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['random update without prefix'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('### Miscellaneous Chores');
    });

    it('Should include the raw commit message in CHANGELOG', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['random update without prefix'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('random update without prefix');
    });
  });

  describe('Commit with scope rendered in CHANGELOG', () => {
    it('Should include scope in CHANGELOG entry', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat(api): add endpoint'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat(api): add endpoint');
    });
  });

  describe('Explicit semantic minor overrides inference', () => {
    it('Should bump to 1.3.0 when explicit minor overrides fix commit', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.3.0');
    });
  });

  describe('Explicit semantic patch overrides inference', () => {
    it('Should bump to 1.2.4 when explicit patch overrides feat commit', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: 'patch',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });
  });

  describe('Empty version file throws error', () => {
    it('Should throw error for empty version file', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      writeFileSync(join(workDir, 'version.txt'), '');
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Invalid semantic throws error', () => {
    it('Should throw error for invalid semantic value', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'foo',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('GitHub release failure throws error', () => {
    it('Should throw error when GitHub release creation fails', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      const command = testingCliFactory(workDir, {
        patchServices: ({releaseNotesService}) => {
          releaseNotesService.createRelease = () => {
            return {ok: false, error: new Error('gh release failed')};
          };
        },
      });

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow('gh release failed');
    });
  });

  describe('Git apply failure propagates error', () => {
    it('Should throw error when git pull fails with non-existent branch', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'nonexistent-branch',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Non-numeric version file throws error', () => {
    it('Should throw error when version file has no numeric part', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      writeFileSync(join(workDir, 'version.txt'), 'abc');
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Non-matching tag prefix falls back to full log', () => {
    it('Should bump when no tags match the prefix', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'z',
        overrideTag: false,
      };

      command.run(inputs);

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('2.0.0');
    });

    it('Should include feat commit in CHANGELOG even with non-matching tag prefix', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'z',
        overrideTag: false,
      };

      command.run(inputs);

      const changelog = readFileSync(join(workDir, 'CHANGELOG.md'), 'utf8');
      expect(changelog).toContain('feat: add thing');
    });
  });

  describe('Real ReleaseNotesService fails in test repo without GitHub remote', () => {
    it('Should throw error when real gh CLI cannot resolve repository', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      const command = testingCliFactory(workDir, {
        patchServices: ({releaseNotesService}) => {
          releaseNotesService.createRelease = () => {
            return {
              ok: false,
              error: new Error('simulated internal exception'),
            };
          };
        },
      });

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Real ReleaseNotesService fails when release notes path is a directory', () => {
    it('Should throw error when release notes temp file is a directory', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      mkdirSync(join(workDir, '.release-notes.tmp.md'));
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('CHANGELOG.md is a directory throws update error', () => {
    it('Should throw error when CHANGELOG.md is a directory', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      mkdirSync(join(workDir, 'CHANGELOG.md'));
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('version.txt is a directory throws read error', () => {
    it('Should throw error when version file is a directory', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      // Remove the file and create a directory with the same name
      const versionPath = join(workDir, 'version.txt');
      rmSync(versionPath);
      mkdirSync(versionPath);
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Read-only version file throws write error', () => {
    it('Should throw error when version file is read-only', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      const versionPath = join(workDir, 'version.txt');
      writeFileSync(versionPath, '1.2.3');
      chmodSync(versionPath, 0o444);
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Corrupt git HEAD fails classifyLastCommit with empty semantic', () => {
    it('Should throw error when git HEAD is missing and semantic is empty', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      rmSync(join(workDir, '.git', 'HEAD'));
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Corrupt git HEAD fails changelog generation with explicit semantic', () => {
    it('Should throw error when git HEAD is missing and semantic is explicit', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      rmSync(join(workDir, '.git', 'HEAD'));
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: 'major',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Pre-receive hook rejecting push without floating tags', () => {
    it('Should throw error when push is rejected by pre-receive hook', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      const hookPath = join(testRepo.bareDir, 'hooks', 'pre-receive');
      writeFileSync(
        hookPath,
        '#!/bin/sh\necho rejected by test hook\nexit 1\n',
      );
      chmodSync(hookPath, 0o755);
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Pre-receive hook rejecting push with floating tags', () => {
    it('Should throw error when force-tag push is rejected by pre-receive hook', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;
      const hookPath = join(testRepo.bareDir, 'hooks', 'pre-receive');
      writeFileSync(
        hookPath,
        '#!/bin/sh\necho rejected by test hook\nexit 1\n',
      );
      chmodSync(hookPath, 0o755);
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: true,
      };

      expect(() => command.run(inputs)).toThrow();
    });
  });

  describe('Bumper: NpmService updates package.json', () => {
    it('Should update package.json version from 1.2.3 to 1.3.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      writeFileSync(
        join(workDir, 'package.json'),
        JSON.stringify({name: 'test-pkg', version: '1.2.3'}, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['npm']});

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const pkg = JSON.parse(
        readFileSync(join(workDir, 'package.json'), 'utf8'),
      ) as {version: string};
      expect(pkg.version).toBe('1.3.0');
    });
  });

  describe('Bumper: ClaudeService updates plugin files', () => {
    it('Should update plugin.json version from 1.2.3 to 1.3.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'my-plugin', version: '1.2.3'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const updatedPlugin = JSON.parse(
        readFileSync(join(workDir, '.claude-plugin', 'plugin.json'), 'utf8'),
      ) as {version: string};
      expect(updatedPlugin.version).toBe('1.3.0');
    });

    it('Should update marketplace.json version from 1.2.3 to 1.3.0', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'my-plugin', version: '1.2.3'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const updatedMarketplace = JSON.parse(
        readFileSync(
          join(workDir, '.claude-plugin', 'marketplace.json'),
          'utf8',
        ),
      ) as {plugins: Array<{version: string}>};
      expect(updatedMarketplace.plugins[0]?.version).toBe('1.3.0');
    });
  });

  describe('Bumper: ClaudeService fails without plugin.json', () => {
    it('Should throw error when plugin.json is missing', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Bumper: ClaudeService fails without marketplace.json', () => {
    it('Should throw error when marketplace.json is missing', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Bumper: ClaudeService fails when marketplace.json has no plugins key', () => {
    it('Should throw error when marketplace.json has no plugins array', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Bumper: ClaudeService fails without plugin name', () => {
    it('Should throw error when plugin.json has no name field', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'other', version: '1.2.3'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Bumper: ClaudeService fails without matching marketplace entry', () => {
    it('Should throw error when marketplace has no matching entry', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'other-plugin', version: '1.2.3'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Bumper: ClaudeService fails with invalid plugin.json', () => {
    it('Should throw error when plugin.json contains invalid JSON', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        'not valid json',
      );
      const marketplace = {plugins: [{name: 'x', version: '1.2.3'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Defensive catch: parseDescriptionSince unexpected exception', () => {
    it('Should throw error when getDescriptionSince throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {
        patchServices: ({gitService}) => {
          gitService.getDescriptionSince = () => {
            throw new Error('simulated internal exception');
          };
        },
      });

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Defensive catch: classifyLastCommit unexpected exception', () => {
    it('Should throw error when getLastCommit throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {
        patchServices: ({gitService}) => {
          gitService.getLastCommit = () => {
            throw new Error('simulated internal exception');
          };
        },
      });

      expect(() =>
        command.run({
          semantic: '',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Defensive catch: generateReleaseNotes unexpected exception', () => {
    it('Should throw error when release notes generation throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {
        patchServices: ({commitService}) => {
          commitService.parseDescriptionSince = () => {
            throw new Error('simulated internal exception');
          };
        },
      });

      expect(() =>
        command.run({
          semantic: 'minor',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Defensive catch: semver calculate unexpected exception', () => {
    it('Should throw error when semver calculation throws unexpectedly', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      vi.spyOn(globalThis, 'parseInt').mockImplementation(() => {
        throw new Error('simulated parseInt failure');
      });

      expect(() =>
        command.run({
          semantic: 'major',
          versionFile: 'version.txt',
          changelogFile: 'CHANGELOG.md',
          ref: 'main',
          tagPrefix: 'v',
          overrideTag: false,
        }),
      ).toThrow();
    });
  });

  describe('Empty commit log produces patch bump', () => {
    it('Should bump to 1.2.4 when commit log is empty', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;
      execSync('git commit --allow-empty --allow-empty-message -m ""', {
        cwd: workDir,
        stdio: 'pipe',
      });
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const version = readFileSync(join(workDir, 'version.txt'), 'utf8').trim();
      expect(version).toBe('1.2.4');
    });
  });

  describe('Claude bumper skips update when version already matches', () => {
    it('Should skip plugin update when version already matches', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.3.0'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'my-plugin', version: '1.3.0'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const updatedPlugin = JSON.parse(
        readFileSync(join(workDir, '.claude-plugin', 'plugin.json'), 'utf8'),
      ) as {version: string};
      expect(updatedPlugin.version).toBe('1.3.0');
    });

    it('Should skip marketplace update when version already matches', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      const workDir = testRepo.workDir;

      mkdirSync(join(workDir, '.claude-plugin'), {recursive: true});
      const plugin = {name: 'my-plugin', version: '1.3.0'};
      writeFileSync(
        join(workDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = {plugins: [{name: 'my-plugin', version: '1.3.0'}]};
      writeFileSync(
        join(workDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {bumpers: ['claude']});

      command.run({
        semantic: 'minor',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
      });

      const updatedMarketplace = JSON.parse(
        readFileSync(
          join(workDir, '.claude-plugin', 'marketplace.json'),
          'utf8',
        ),
      ) as {plugins: Array<{version: string}>};
      expect(updatedMarketplace.plugins[0]?.version).toBe('1.3.0');
    });
  });

  describe('Sync target environments after minor bump from feat commit', () => {
    it('Should sync development with success', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development'}, {name: 'sandbox'}],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development, sandbox',
      };
      command.run(inputs);

      const mainSha = execSync('git rev-parse main', {
        cwd: workDir,
        encoding: 'utf8',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
      }).trim();

      expect(developmentSha).toBe(mainSha);
    });

    it('Should sync sandbox with success', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development'}, {name: 'sandbox'}],
      });
      const workDir = testRepo.workDir;
      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development, sandbox',
      };
      command.run(inputs);

      const mainSha = execSync('git rev-parse main', {
        cwd: workDir,
        encoding: 'utf8',
      }).trim();
      const sandboxSha = execSync('git rev-parse sandbox', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
      }).trim();

      expect(sandboxSha).toBe(mainSha);
    });
  });

  describe('Open PR to sync target environments with conflict', () => {
    it('Should open a new PR for development', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [
          {name: 'development', conflict: true},
          {name: 'sandbox', conflict: true},
        ],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      testRepo.gh.enqueue({stdout: '0'});
      testRepo.gh.enqueue({stdout: 'https://github.com/test/pull/1'});
      testRepo.gh.enqueue({stdout: '0'});
      testRepo.gh.enqueue({stdout: 'https://github.com/test/pull/2'});

      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development, sandbox',
      };
      command.run(inputs);

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(developmentSha).not.toBe(mainSha);
    });

    it('Should open a new PR for sandbox', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [
          {name: 'development', conflict: true},
          {name: 'sandbox', conflict: true},
        ],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      testRepo.gh.enqueue({stdout: '0'});
      testRepo.gh.enqueue({stdout: 'https://github.com/test/pull/1'});
      testRepo.gh.enqueue({stdout: '0'});
      testRepo.gh.enqueue({stdout: 'https://github.com/test/pull/2'});

      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development, sandbox',
      };
      command.run(inputs);

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const sandboxSha = execSync('git rev-parse sandbox', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(sandboxSha).not.toBe(mainSha);
    });
  });

  describe('Ignore conflict due opened PR to sync target environments', () => {
    it('Should ignore existing PR for development', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development', conflict: true}],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      testRepo.gh.enqueue({stdout: '1'});

      const command = testingCliFactory(workDir);

      const inputs: Inputs = {
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development',
      };
      command.run(inputs);

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(developmentSha).not.toBe(mainSha);
    });
  });

  describe('Sync target throws unexpected error', () => {
    it('Should handle sync service internal error gracefully', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development'}],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {
        patchServices: ({gitService}) => {
          gitService.mergeWithoutCommit = () => {
            throw new Error('simulated internal error');
          };
        },
      });

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development',
      });

      expect(process.stderr.write).toHaveBeenCalledWith(
        expect.stringContaining('Error during environments syncronization'),
      );
    });
  });

  describe('Pull request listing fails on conflict', () => {
    it('Should handle gh pr list failure gracefully', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development', conflict: true}],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      testRepo.gh.enqueue({exitCode: 1, stderr: 'gh pr list failed'});

      const command = testingCliFactory(workDir);

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development',
      });

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(developmentSha).not.toBe(mainSha);
    });
  });

  describe('PullRequestService catch blocks on exec failure', () => {
    it('Should catch execSync failure in hasPullRequest', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development', conflict: true}],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      const command = testingCliFactory(workDir, {
        patchServices: ({childProcessService}) => {
          const realExec = childProcessService.exec.bind(childProcessService);
          childProcessService.exec = (command: string) => {
            if (command.startsWith('gh pr list')) {
              throw new Error('simulated execSync crash');
            }
            return realExec(command);
          };
        },
      });

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development',
      });

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(developmentSha).not.toBe(mainSha);
    });

    it('Should catch execSync failure in createPullRequest', () => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['feat: add thing'],
        targets: [{name: 'development', conflict: true}],
      });
      const workDir = testRepo.workDir;

      testRepo.gh.enqueue({
        stdout: 'https://github.com/test/releases/tag/mock',
      });
      testRepo.gh.enqueue({stdout: '0'});

      const command = testingCliFactory(workDir, {
        patchServices: ({childProcessService}) => {
          const realExec = childProcessService.exec.bind(childProcessService);
          childProcessService.exec = (command: string) => {
            if (command.startsWith('gh pr create')) {
              throw new Error('simulated execSync crash');
            }
            return realExec(command);
          };
        },
      });

      command.run({
        semantic: '',
        versionFile: 'version.txt',
        changelogFile: 'CHANGELOG.md',
        ref: 'main',
        tagPrefix: 'v',
        overrideTag: false,
        target: 'development',
      });

      const mainSha = execSync('git rev-parse main', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const developmentSha = execSync('git rev-parse development', {
        cwd: testRepo.bareDir,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      expect(developmentSha).not.toBe(mainSha);
    });
  });
});
