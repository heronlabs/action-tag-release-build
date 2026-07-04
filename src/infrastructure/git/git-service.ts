import {ChildProcessService} from '../terminal/child-process-service';

export class GitService {
  public getLastCommit() {
    return this.childProcessService.exec('git log -1 --pretty=%B');
  }

  public getDescriptionSince(tagPrefix: string) {
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

  public apply({
    version,
    tag,
    refName,
    tags,
  }: {
    version: string;
    tag: string;
    refName: string;
    tags?: {
      major: string;
      minor: string;
    };
  }) {
    const commitMessage = `[skip ci] bump ${tag}`;

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

    if (!tags) {
      const push = chain.execChain('git push --follow-tags');
      if (!push.ok) return {ok: false as const, error: push.error};
      return {ok: true as const};
    }

    const push = chain
      .execChain(
        `git tag -fa "${!tags.major}" -m "Latest ${!tags.major}.x.x release"`,
      )
      .execChain(
        `git tag -fa "${tags.minor}" -m "Latest ${tags.minor}.x release"`,
      )
      .execChain('git push --follow-tags');

    if (!push.ok) return {ok: false as const, error: push.error};

    return {ok: true as const};
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
