import {MergeService} from '../../infrastructure/gh/services/merge-service';
import {PullRequestService} from '../../infrastructure/gh/services/pull-request-service';

export class SyncService {
  public cascadeEnvironments(
    ref: string,
    targets: string,
    mergeCommit?: boolean,
  ) {
    try {
      const results = targets
        .replace(/\s/g, '')
        .split(',')
        .filter(Boolean)
        .map(target => {
          const syncEnvironment = mergeCommit
            ? this.mergeService.mergeWithCommit(ref, target)
            : this.mergeService.mergeWithoutCommit(ref, target);

          if (syncEnvironment.ok)
            return {ok: true as const, ref, target, sha: syncEnvironment.data};

          const existingPullRequest = this.pullRequestService.hasPullRequest(
            ref,
            target,
          );

          const failed = `Merging ${ref} into ${target} failed`;

          if (!existingPullRequest.ok)
            return {
              ok: false as const,
              error: `${failed}, then checking for open PR failed too;`,
            };

          if (!existingPullRequest.data) {
            const prCreated = this.pullRequestService.createPullRequest(
              ref,
              target,
            );

            if (!prCreated.ok)
              return {
                ok: false as const,
                error: `${failed}, no PR found. Then PR creation failed;`,
              };

            return {
              ok: false as const,
              error: `${failed}, no PR found. PR created;`,
            };
          }

          return {
            ok: false as const,
            error: `${failed}, open PR already exists;`,
          };
        });

      return {ok: true as const, data: results};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly pullRequestService: PullRequestService,
    private readonly mergeService: MergeService,
  ) {}
}
