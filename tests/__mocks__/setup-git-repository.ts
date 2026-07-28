import {execSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

/**
 * Create a temporary git repository with a bare remote, version file,
 * given commits, and an initial annotated tag. Designed for integration
 * tests that exercise the real git pipeline.
 */
export interface TestRepo {
  workDir: string;
  bareDir: string;
  cleanup: () => void;
}

export function createTestRepo(opts: {
  version: string;
  commits: string[];
  initialTag?: string;
  targets?: {name: string; conflict?: boolean}[];
}): TestRepo {
  const tmpDir = mkdtempSync(join(tmpdir(), 'bump-test-'));
  const bareDir = join(tmpDir, 'remote.git');
  const workDir = join(tmpDir, 'work');

  execSync(`git init --bare "${bareDir}"`, {stdio: 'pipe'});

  mkdirSync(workDir, {recursive: true});
  execSync('git init -b main', {cwd: workDir, stdio: 'pipe'});
  execSync('git config user.name "Test User"', {cwd: workDir, stdio: 'pipe'});
  execSync('git config user.email "test@test.com"', {
    cwd: workDir,
    stdio: 'pipe',
  });
  execSync(`git remote add origin "${bareDir}"`, {cwd: workDir, stdio: 'pipe'});

  // Write version file as the initial tracked content
  writeFileSync(join(workDir, 'version.txt'), `${opts.version}\n`);
  execSync('git add version.txt', {cwd: workDir, stdio: 'pipe'});
  execSync('git commit -m "chore: initial version"', {
    cwd: workDir,
    stdio: 'pipe',
  });

  // Tag the version commit BEFORE feature commits, so git describe
  // resolves to this tag and the changelog range picks up the commits
  // between the last release and HEAD
  const initialTag = opts.initialTag ?? `v${opts.version}`;
  execSync(`git tag -a "${initialTag}" -m "initial release"`, {
    cwd: workDir,
    stdio: 'pipe',
  });

  // Create requested commits on top (after the tag)
  for (const msg of opts.commits) {
    execSync(`git commit --allow-empty -m '${msg}'`, {
      cwd: workDir,
      stdio: 'pipe',
    });
  }

  // Push everything to the bare remote so pull --rebase works in the
  // pipeline
  execSync('git push -u origin main', {cwd: workDir, stdio: 'pipe'});
  execSync('git push --tags', {cwd: workDir, stdio: 'pipe'});

  // Create targets if any — create branch, optionally diverge
  // (add commit not on main), and push to bare remote
  opts.targets?.forEach(target => {
    execSync(`git branch ${target.name}`, {cwd: workDir, stdio: 'pipe'});
    if (target.conflict) {
      execSync(`git checkout ${target.name}`, {cwd: workDir, stdio: 'pipe'});
      execSync('git commit --allow-empty -m "chore: diverge"', {
        cwd: workDir,
        stdio: 'pipe',
      });
      execSync('git checkout main', {cwd: workDir, stdio: 'pipe'});
    }
    execSync(`git push origin ${target.name}`, {cwd: workDir, stdio: 'pipe'});
  });

  return {
    workDir,
    bareDir,
    cleanup: () => {
      rmSync(tmpDir, {recursive: true, force: true});
    },
  };
}
