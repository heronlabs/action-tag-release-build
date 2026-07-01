import {ChildProcessService} from '../terminal/child-process-service';

export class GitService {
  public getLastCommit() {
    return this.childProcessService.exec('git log -1 --pretty=%B 2>/dev/null');
  }

  public getCommits(tagPrefix: string) {
    try {
      let since = '';
      const {ok: prevTagResultOk, data: prevTagResult} =
        this.childProcessService.exec(
          `git describe --tags --abbrev=0 --match "${tagPrefix}" HEAD 2>/dev/null`,
        );
      if (prevTagResultOk) since = prevTagResult;

      const range = since ? `${since}..HEAD` : '';

      const {
        ok: commitsResultOk,
        data: commitsResult,
        error: commitsResultError,
      } = this.childProcessService.exec(
        `git log --pretty=format:"%H %s" ${range} 2>/dev/null`,
      );

      if (!commitsResultOk)
        return {ok: false as const, error: commitsResultError};

      return {ok: true as const, data: commitsResult};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public apply(
    version: string,
    tag: string,
    tagMajor: string,
    tagMinor: string,
    refName: string,
    override: boolean,
  ) {
    try {
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

      if (!override) {
        chain.execChain('git push --follow-tags');
        return {ok: true as const};
      }

      chain
        .execChain(
          `git tag -fa "${tagMajor}" -m "Latest ${tagMajor}.x.x release"`,
        )
        .execChain(
          `git tag -fa "${tagMinor}" -m "Latest ${tagMinor}.x release"`,
        )
        .execChain('git push --follow-tags')
        .execChain(`git push origin "${tagMajor}" --force`)
        .execChain(`git push origin "${tagMinor}" --force`);

      return {ok: true as const, data: chain};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
