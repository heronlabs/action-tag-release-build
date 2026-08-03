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
        'number',
        '--jq',
        'length',
      ]);

      if (!result.ok) return result;

      return {ok: true as const, data: result.data !== '0'};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public createPullRequest(ref: string, environment: string) {
    try {
      const title = `🔗 Sync ${ref} into ${environment}`;

      let body = `Automatic sync of ${ref} into ${environment} failed `;
      body += '(diverged branch or merge conflict). Merge this pull request ';
      body += `to sync ${environment} with ${ref}.`;

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
