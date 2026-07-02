import {ChildProcessService} from '../terminal/child-process-service';

export class GitService {
  public getLastCommit() {
    return this.childProcessService.exec('git log -1 --pretty=%B');
  }

  public getCommits(tagPrefix: string) {
    let since = '';
    const previousTag = this.childProcessService.exec(
      `git describe --tags --abbrev=0 --match "${tagPrefix}*" HEAD`,
    );
    if (previousTag.ok) since = previousTag.data;

    const range = since ? `${since}..HEAD` : '';

    return this.childProcessService.exec(
      `git log --pretty=format:"%H %s" ${range}`,
    );
  }

  public apply(
    version: string,
    tag: string,
    tagMajor: string,
    tagMinor: string,
    refName: string,
    override: boolean,
  ) {
    const commitMessage = `[skip ci] bump v${version}`;

    const chain = this.childProcessService
      .execChain('git config user.name  "github-actions[bot]"')
      .execChain(
        'git config user.email "github-actions[bot]@users.noreply.github.com"',
      )
      .execChain('git add -A')
      .execChain(`git commit -m "${commitMessage}"`)
      .execChain(`git pull --rebase origin "${refName}"`)
      .execChain(`git tag -a "${tag}" -m "Release ${version}"`);

    if (!chain.ok) {
      return {ok: false as const, error: chain.error};
    }

    if (!override) {
      const push = chain.execChain('git push --follow-tags');
      if (!push.ok) return {ok: false as const, error: push.error};
      return {ok: true as const};
    }

    const push = chain
      .execChain(
        `git tag -fa "${tagMajor}" -m "Latest ${tagMajor}.x.x release"`,
      )
      .execChain(`git tag -fa "${tagMinor}" -m "Latest ${tagMinor}.x release"`)
      .execChain('git push --follow-tags');

    if (!push.ok) return {ok: false as const, error: push.error};

    return {ok: true as const};
  }

  public rollbackFireForget(
    tag: string,
    overrideTag?: {tagMajor: string; tagMinor: string},
  ) {
    this.childProcessService.exec(`git push origin --delete "${tag}"`);
    this.childProcessService.exec(`git tag -d "${tag}"`);

    if (overrideTag) {
      this.childProcessService.exec(
        `git push origin --delete "${overrideTag.tagMajor}"`,
      );
      this.childProcessService.exec(
        `git push origin --delete "${overrideTag.tagMinor}"`,
      );
      this.childProcessService.exec(`git tag -d "${overrideTag.tagMajor}"`);
      this.childProcessService.exec(`git tag -d "${overrideTag.tagMinor}"`);
    }
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
