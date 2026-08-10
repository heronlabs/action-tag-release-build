import {execSync, spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {createTestRepo, TestRepo} from '../__mocks__/setups/setup-github';

const scriptPath = join(__dirname, '..', 'sanity', 'tag-release-checks.sh');

function runScript(
  cwd: string,
  args: string[],
): {status: number | null; stdout: string; stderr: string} {
  const result = spawnSync('bash', [scriptPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
  return {status: result.status, stdout: result.stdout, stderr: result.stderr};
}

function mainSha(cwd: string): string {
  const output = execSync('git ls-remote origin main', {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return output.split(/\s+/)[0] ?? '';
}

describe('Given tests/sanity/tag-release-checks.sh', () => {
  let testRepo: TestRepo;

  beforeEach(() => {
    testRepo = createTestRepo({
      version: '1.2.3',
      commits: [],
      targets: [{name: 'staging'}],
    });
  });

  afterEach(() => {
    testRepo?.cleanup();
  });

  describe('When all checks pass', () => {
    it('Should exit 0 and print a summary when all checks pass', () => {
      const sha = mainSha(testRepo.workDir);
      writeFileSync(
        join(testRepo.workDir, 'CHANGELOG.md'),
        '# Changelog\n\n## v1.2.3\n',
      );
      testRepo.gh.enqueue({stdout: 'Release found'});

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
        '--released-refs',
        JSON.stringify([
          {target: 'main', sha},
          {target: 'staging', sha},
        ]),
      ]);

      expect(result).toMatchObject({
        status: 0,
        stdout: expect.stringMatching(
          new RegExp(
            `sync target staging at ${sha}[\\s\\S]*All checks passed for v1\\.2\\.3`,
          ),
        ),
        stderr: '',
      });
      testRepo.gh.expectEmpty();
    });

    it('Should honor custom --version-file and --changelog-file paths', () => {
      const sha = mainSha(testRepo.workDir);
      execSync('mkdir -p custom', {cwd: testRepo.workDir, stdio: 'pipe'});
      writeFileSync(
        join(testRepo.workDir, 'custom/CHANGELOG.md'),
        '# Changelog\n\n## v1.2.3\n',
      );
      writeFileSync(join(testRepo.workDir, 'custom/version.txt'), '1.2.3\n');
      testRepo.gh.enqueue({stdout: 'Release found'});

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
        '--released-refs',
        JSON.stringify([{target: 'main', sha}]),
        '--version-file',
        'custom/version.txt',
        '--changelog-file',
        'custom/CHANGELOG.md',
      ]);

      expect(result).toMatchObject({
        status: 0,
        stdout: expect.stringMatching(
          /custom\/CHANGELOG\.md[\s\S]*custom\/version\.txt contains 1\.2\.3[\s\S]*no sync targets to verify \(1 released ref\(s\)\)/,
        ),
        stderr: '',
      });
      testRepo.gh.expectEmpty();
    });
  });

  describe('When checks fail', () => {
    it('Should fail fast when the tag is missing on the remote', () => {
      const result = runScript(testRepo.workDir, [
        '--tag',
        'v9.9.9',
        '--version',
        '9.9.9',
        '--released-refs',
        JSON.stringify([{target: 'main', sha: 'x'.repeat(40)}]),
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(
          /tag on remote[\s\S]*refs\/tags\/v9\.9\.9[\s\S]*suggestion/,
        ),
      });
      expect(result.stderr).not.toContain('GitHub release');
      testRepo.gh.expectEmpty();
    });

    it('Should fail when the GitHub release does not exist', () => {
      testRepo.gh.enqueue({
        stderr: 'release not found',
        exitCode: 1,
      });

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
        '--released-refs',
        JSON.stringify([{target: 'main', sha: mainSha(testRepo.workDir)}]),
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(
          /GitHub release[\s\S]*exited 1[\s\S]*release not found[\s\S]*suggestion/,
        ),
      });
      testRepo.gh.expectEmpty();
    });

    it('Should fail when the CHANGELOG entry is missing', () => {
      writeFileSync(
        join(testRepo.workDir, 'CHANGELOG.md'),
        '# Changelog\n\n## v2.0.0\n',
      );
      testRepo.gh.enqueue({stdout: 'Release found'});

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
        '--released-refs',
        JSON.stringify([{target: 'main', sha: mainSha(testRepo.workDir)}]),
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(
          /changelog[\s\S]*## v1\.2\.3[\s\S]*suggestion/,
        ),
      });
      testRepo.gh.expectEmpty();
    });

    it('Should fail when version.txt does not match --version', () => {
      testRepo.gh.enqueue({stdout: 'Release found'});
      writeFileSync(
        join(testRepo.workDir, 'CHANGELOG.md'),
        '# Changelog\n\n## v1.2.3\n',
      );

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '9.9.9',
        '--released-refs',
        JSON.stringify([{target: 'main', sha: mainSha(testRepo.workDir)}]),
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(
          /version file[\s\S]*exactly '9\.9\.9'[\s\S]*found[\s\S]*suggestion/,
        ),
      });
      testRepo.gh.expectEmpty();
    });

    it('Should fail when a sync target is at the wrong SHA', () => {
      const sha = mainSha(testRepo.workDir);
      writeFileSync(
        join(testRepo.workDir, 'CHANGELOG.md'),
        '# Changelog\n\n## v1.2.3\n',
      );
      testRepo.gh.enqueue({stdout: 'Release found'});

      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
        '--released-refs',
        JSON.stringify([
          {target: 'main', sha},
          {target: 'staging', sha: 'deadbeef'.repeat(5)},
        ]),
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(
          new RegExp(
            `sync target staging[\\s\\S]*deadbeef[\\s\\S]*${sha}[\\s\\S]*suggestion`,
          ),
        ),
      });
      testRepo.gh.expectEmpty();
    });
  });

  describe('When usage is incorrect', () => {
    it('Should print usage and exit 0 for --help', () => {
      const result = runScript(testRepo.workDir, ['--help']);

      expect(result).toMatchObject({
        status: 0,
        stdout: expect.stringMatching(
          /Usage: verify-release\.sh[\s\S]*--released-refs/,
        ),
        stderr: '',
      });
    });

    it('Should exit 1 with a diagnostic when required args are missing', () => {
      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
      ]);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringMatching(/required[\s\S]*Usage:/),
      });
    });

    it('Should exit 1 for an unknown argument', () => {
      const result = runScript(testRepo.workDir, ['--bogus']);

      expect(result).toMatchObject({
        status: 1,
        stderr: expect.stringContaining('unknown argument: --bogus'),
      });
    });
  });
});
