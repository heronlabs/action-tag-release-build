import {PullRequestService} from '../../infrastructure/gh/services/pull-request-service';
import {GitService} from '../../infrastructure/git/services/git-service';

export class SyncService {
  public cascadeEnvironments(ref: string, target: string) {
    try {
      const environments: string[] = target
        .trim()
        .split(',')
        .map(environment => {
          const syncEnvironment = this.gitService.mergeWithoutCommit(
            ref,
            environment,
          );

          if (!syncEnvironment.ok) {
            const existingPullRequest = this.pullRequestService.hasPullRequest(
              ref,
              environment,
            );

            if (existingPullRequest.ok && !existingPullRequest.data)
              this.pullRequestService.createPullRequest(ref, environment);

            return `${environment} xx ${ref}`;
          }

          return `${environment} => ${ref}`;
        });

      return {ok: true as const, data: environments};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly gitService: GitService,
    private readonly pullRequestService: PullRequestService,
  ) {}
}
