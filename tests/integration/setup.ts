import {execSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export interface TestRepoOptions {
  /** Version to write into version.txt */
  version: string;
  /** Commit messages for commits on top of the version.txt commit */
  commits: string[];
  /** Optional explicit initial tag (defaults to v{version}) */
  initialTag?: string;
}

export interface TestRepo {
  /** Working directory (the cloned repo) */
  workDir: string;
  /** Bare remote directory */
  bareDir: string;
  /** Remove both temp directories */
  cleanup: () => void;
}

/**
 * Create a temporary git repository with a bare remote, version file,
 * given commits, and an initial annotated tag. Designed for integration
 * tests that exercise the real git pipeline.
 */
export function createTestRepo(opts: TestRepoOptions): TestRepo {
  const tmpDir = mkdtempSync(join(tmpdir(), 'bump-test-'));
  const bareDir = join(tmpDir, 'remote.git');
  const workDir = join(tmpDir, 'work');

  execSync(`git init --bare "${bareDir}"`);

  mkdirSync(workDir, {recursive: true});
  execSync('git init -b main', {cwd: workDir});
  execSync('git config user.name "Test User"', {cwd: workDir});
  execSync('git config user.email "test@test.com"', {cwd: workDir});
  execSync(`git remote add origin "${bareDir}"`, {cwd: workDir});

  // Write version file as the initial tracked content
  writeFileSync(join(workDir, 'version.txt'), `${opts.version}\n`);
  execSync('git add version.txt', {cwd: workDir});
  execSync('git commit -m "chore: initial version"', {cwd: workDir});

  // Tag the version commit BEFORE feature commits, so git describe
  // resolves to this tag and the changelog range picks up the commits
  // between the last release and HEAD
  const initialTag = opts.initialTag ?? `v${opts.version}`;
  execSync(`git tag -a "${initialTag}" -m "initial release"`, {cwd: workDir});

  // Create requested commits on top (after the tag)
  for (const msg of opts.commits) {
    execSync(`git commit --allow-empty -m '${msg}'`, {cwd: workDir});
  }

  // Push everything to the bare remote so pull --rebase works in the
  // pipeline
  execSync('git push -u origin main', {cwd: workDir});
  execSync('git push --tags', {cwd: workDir});

  return {
    workDir,
    bareDir,
    cleanup: () => {
      rmSync(tmpDir, {recursive: true, force: true});
    },
  };
}
