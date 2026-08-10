import {execSync, spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {createTestRepo, TestRepo} from '../__mocks__/setups/setup-github';

const scriptPath = join(__dirname, 'tag-release-checks.sh');

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

describe('tests/sanity/tag-release-checks.sh', () => {
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

  function mainSha(): string {
    const output = execSync('git ls-remote origin main', {
      cwd: testRepo.workDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return output.split(/\s+/)[0] ?? '';
  }

  describe('passing release', () => {
    it('Should exit 0 and print a summary when all checks pass', () => {
      const sha = mainSha();
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

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('All checks passed for v1.2.3');
      expect(result.stdout).toContain('sync target staging at ' + sha);
      expect(result.stderr).toBe('');
      testRepo.gh.expectEmpty();
    });

    it('Should honor custom --version-file and --changelog-file paths', () => {
      const sha = mainSha();
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

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('custom/CHANGELOG.md');
      expect(result.stdout).toContain('custom/version.txt contains 1.2.3');
      expect(result.stdout).toContain(
        'no sync targets to verify (1 released ref(s))',
      );
      testRepo.gh.expectEmpty();
    });
  });

  describe('failing checks', () => {
    it('Should fail fast when the tag is missing on the remote', () => {
      const result = runScript(testRepo.workDir, [
        '--tag',
        'v9.9.9',
        '--version',
        '9.9.9',
        '--released-refs',
        JSON.stringify([{target: 'main', sha: 'x'.repeat(40)}]),
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('tag on remote');
      expect(result.stderr).toContain('refs/tags/v9.9.9');
      expect(result.stderr).toContain('suggestion');
      // Fail-fast: later checks never ran (no gh mock response was enqueued)
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
        JSON.stringify([{target: 'main', sha: mainSha()}]),
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('GitHub release');
      expect(result.stderr).toContain('exited 1');
      expect(result.stderr).toContain('release not found');
      expect(result.stderr).toContain('suggestion');
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
        JSON.stringify([{target: 'main', sha: mainSha()}]),
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('changelog');
      expect(result.stderr).toContain('## v1.2.3');
      expect(result.stderr).toContain('suggestion');
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
        JSON.stringify([{target: 'main', sha: mainSha()}]),
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('version file');
      expect(result.stderr).toContain("exactly '9.9.9'");
      expect(result.stderr).toContain('found');
      expect(result.stderr).toContain('suggestion');
      testRepo.gh.expectEmpty();
    });

    it('Should fail when a sync target is at the wrong SHA', () => {
      const sha = mainSha();
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

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('sync target staging');
      expect(result.stderr).toContain('deadbeef');
      expect(result.stderr).toContain(sha);
      expect(result.stderr).toContain('suggestion');
      testRepo.gh.expectEmpty();
    });
  });

  describe('usage', () => {
    it('Should print usage and exit 0 for --help', () => {
      const result = runScript(testRepo.workDir, ['--help']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Usage: verify-release.sh');
      expect(result.stdout).toContain('--released-refs');
    });

    it('Should exit 1 with a diagnostic when required args are missing', () => {
      const result = runScript(testRepo.workDir, [
        '--tag',
        'v1.2.3',
        '--version',
        '1.2.3',
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('required');
      expect(result.stderr).toContain('Usage:');
    });

    it('Should exit 1 for an unknown argument', () => {
      const result = runScript(testRepo.workDir, ['--bogus']);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('unknown argument: --bogus');
    });
  });
});
