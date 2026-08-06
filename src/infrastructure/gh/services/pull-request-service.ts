import {ChildProcessService} from '../../terminal/services/child-process-service';

export class PullRequestService {
  public hasPullRequest(ref: string, environment: string) {
    try {
      const result = this.childProcessService.exec('gh', [
        'pr',
        'list',
        '--base',
        environment,
        '--head',
        ref,
        '--state',
        'open',
        '--json',
        'isCrossRepository',
        '--jq',
        '[.[] | select(.isCrossRepository | not)] | length',
      ]);

      if (!result.ok) return result;

      if (!/^\d+$/.test(result.data))
        return {
          ok: false as const,
          error: new Error(`Unexpected gh pr list output: ${result.data}`),
        };

      return {ok: true as const, data: Number(result.data) > 0};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public createPullRequest(ref: string, environment: string) {
    try {
      const title = `🔗 Sync ${ref} into ${environment}`;

      let body = `Automatic sync of ${ref} into ${environment} failed.\n\n`;
      body += `Merge this pull request to sync ${environment} with ${ref}.`;

      return this.childProcessService.exec('gh', [
        'pr',
        'create',
        '--base',
        environment,
        '--head',
        ref,
        '--title',
        title,
        '--body',
        body,
      ]);
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
