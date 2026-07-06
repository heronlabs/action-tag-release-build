import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {BumpCommand} from '../../src/application/cli/bump-command';
import {BumpInputs} from '../../src/application/cli/types/input-bump';
import {testingCliFactory} from '../__mocks__/setup-cli-factory';
import {createTestRepo, TestRepo} from '../__mocks__/setup-git-repository';

describe('Bumper integration tests', () => {
  let testRepo: TestRepo;

  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    testRepo?.cleanup();
  });

  const baseInputs: BumpInputs = {
    semantic: 'minor',
    versionFile: 'version.txt',
    changelogFile: 'CHANGELOG.md',
    refName: 'main',
    tagPrefix: 'v',
    overrideTag: false,
  };

  describe('Scenario O: NpmService bumper updates package.json', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      const pkg = {name: 'test-pkg', version: '1.2.3'};
      writeFileSync(
        join(workDir, 'package.json'),
        JSON.stringify(pkg, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['npm']});
    });

    it('Should update package.json version from 1.2.3 to 1.3.0', () => {
      bumpCommand.run(baseInputs);

      const pkg = JSON.parse(
        readFileSync(join(workDir, 'package.json'), 'utf8'),
      ) as {version: string};
      expect(pkg.version).toBe('1.3.0');
    });

    it('Should print bumper success message to stdout', () => {
      bumpCommand.run(baseInputs);

      expect(vi.mocked(process.stdout.write)).toHaveBeenCalledWith(
        expect.stringContaining('✅ Bumper'),
      );
    });
  });

  describe('Scenario P: ClaudeService bumper updates plugin files', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = [{name: 'my-plugin', version: '1.2.3'}];
      writeFileSync(
        join(workDir, 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should update plugin.json version from 1.2.3 to 1.3.0', () => {
      bumpCommand.run(baseInputs);

      const plugin = JSON.parse(
        readFileSync(join(workDir, 'plugin.json'), 'utf8'),
      ) as {version: string};
      expect(plugin.version).toBe('1.3.0');
    });

    it('Should update marketplace.json version from 1.2.3 to 1.3.0', () => {
      bumpCommand.run(baseInputs);

      const marketplace = JSON.parse(
        readFileSync(join(workDir, 'marketplace.json'), 'utf8'),
      ) as Array<{version: string}>;
      expect(marketplace[0].version).toBe('1.3.0');
    });

    it('Should print bumper success message to stdout', () => {
      bumpCommand.run(baseInputs);

      expect(vi.mocked(process.stdout.write)).toHaveBeenCalledWith(
        expect.stringContaining('✅ Bumper'),
      );
    });
  });

  describe('Scenario Q: ClaudeService bumper fails without plugin.json', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should throw error when plugin.json is missing', () => {
      expect(() => bumpCommand.run(baseInputs)).toThrow();
    });
  });

  describe('Scenario R: ClaudeService bumper fails without marketplace.json', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should throw error when marketplace.json is missing', () => {
      expect(() => bumpCommand.run(baseInputs)).toThrow();
    });
  });

  describe('Scenario S: ClaudeService bumper fails without plugin name', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      const plugin = {version: '1.2.3'};
      writeFileSync(
        join(workDir, 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = [{name: 'other', version: '1.2.3'}];
      writeFileSync(
        join(workDir, 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should throw error when plugin.json has no name field', () => {
      expect(() => bumpCommand.run(baseInputs)).toThrow();
    });
  });

  describe('Scenario T: ClaudeService bumper fails without matching marketplace entry', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      const plugin = {name: 'my-plugin', version: '1.2.3'};
      writeFileSync(
        join(workDir, 'plugin.json'),
        JSON.stringify(plugin, null, 2) + '\n',
      );
      const marketplace = [{name: 'other-plugin', version: '1.2.3'}];
      writeFileSync(
        join(workDir, 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should throw error when marketplace has no matching entry', () => {
      expect(() => bumpCommand.run(baseInputs)).toThrow();
    });
  });

  describe('Scenario U: ClaudeService bumper fails with invalid plugin.json content', () => {
    let workDir: string;
    let bumpCommand: BumpCommand;

    beforeEach(() => {
      testRepo = createTestRepo({
        version: '1.2.3',
        commits: ['fix: typo'],
      });
      workDir = testRepo.workDir;

      writeFileSync(join(workDir, 'plugin.json'), 'not valid json');
      const marketplace = [{name: 'x', version: '1.2.3'}];
      writeFileSync(
        join(workDir, 'marketplace.json'),
        JSON.stringify(marketplace, null, 2) + '\n',
      );
      bumpCommand = testingCliFactory(workDir, {bumpers: ['claude']});
    });

    it('Should throw error when plugin.json contains invalid JSON', () => {
      expect(() => bumpCommand.run(baseInputs)).toThrow();
    });
  });
});
