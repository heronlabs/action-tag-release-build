import {execSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
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

      expect(tags).toContain('1');
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

      expect(tags).toContain('3');
    });
  });
});
