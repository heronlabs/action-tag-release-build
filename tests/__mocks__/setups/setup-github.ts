import {execSync} from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

interface GhResponse {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface GhMock {
  enqueue(response: GhResponse): void;
  enqueueAll(responses: GhResponse[]): void;
  getQueueFile(): string;
  expectEmpty(): void;
  cleanup(): void;
}

function createGitMock(opts: {
  version: string;
  commits: string[];
  initialTag?: string;
  targets?: {name: string; conflict?: boolean}[];
}) {
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

  writeFileSync(join(workDir, 'version.txt'), `${opts.version}\n`);
  execSync('git add version.txt', {cwd: workDir, stdio: 'pipe'});
  execSync('git commit -m "chore: initial version"', {
    cwd: workDir,
    stdio: 'pipe',
  });

  const initialTag = opts.initialTag ?? `v${opts.version}`;
  execSync(`git tag -a "${initialTag}" -m "initial release"`, {
    cwd: workDir,
    stdio: 'pipe',
  });

  for (const msg of opts.commits) {
    execSync(`git commit --allow-empty -m '${msg}'`, {
      cwd: workDir,
      stdio: 'pipe',
    });
  }

  execSync('git push -u origin main', {cwd: workDir, stdio: 'pipe'});
  execSync('git push --tags', {cwd: workDir, stdio: 'pipe'});

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

  return {workDir, bareDir, tmpDir};
}

export interface TestRepo {
  workDir: string;
  bareDir: string;
  gh: GhMock;
  cleanup: () => void;
}

export function createTestRepo(opts: {
  version: string;
  commits: string[];
  initialTag?: string;
  targets?: {name: string; conflict?: boolean}[];
}): TestRepo {
  const {workDir, bareDir, tmpDir} = createGitMock(opts);

  const mockDir = __dirname;
  const fakeGh = join(mockDir, 'gh');
  chmodSync(fakeGh, 0o755);

  const queueFile = join(
    tmpdir(),
    `gh-mock-${process.pid}-${Date.now()}.jsonl`,
  );
  writeFileSync(queueFile, '', 'utf8');

  const gh: GhMock = {
    enqueue(response: GhResponse) {
      const line = JSON.stringify({
        stdout: response.stdout ?? '',
        stderr: response.stderr ?? '',
        exitCode: response.exitCode ?? 0,
      });
      writeFileSync(queueFile, line + '\n', {flag: 'a'});
    },

    enqueueAll(responses: GhResponse[]) {
      for (const r of responses) this.enqueue(r);
    },

    getQueueFile() {
      return queueFile;
    },

    expectEmpty() {
      const remaining = readFileSync(queueFile, 'utf8').trim();
      if (remaining) {
        throw new Error(`Unconsumed gh mock responses: ${remaining}`);
      }
    },

    cleanup() {
      try {
        unlinkSync(queueFile);
      } catch {
        // already removed
      }
    },
  };

  const prevPath = process.env.PATH;
  const prevQueue = process.env.GH_MOCK_QUEUE;

  process.env.GH_MOCK_QUEUE = gh.getQueueFile();
  process.env.PATH = `${mockDir}:${prevPath}`;

  return {
    workDir,
    bareDir,
    gh,
    cleanup: () => {
      process.env.PATH = prevPath;
      process.env.GH_MOCK_QUEUE = prevQueue;
      gh.cleanup();
      rmSync(tmpDir, {recursive: true, force: true});
    },
  };
}
