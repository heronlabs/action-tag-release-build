import {ChildProcessService} from '../../terminal/services/child-process-service';

export class MergeService {
  public mergeWithCommit(ref: string, environment: string) {
    try {
      const message = `Merge ${ref} into ${environment}`;

      return this.childProcessService.exec(
        `gh api "repos/{owner}/{repo}/merges" -f base="${environment}" -f head="${ref}" -f commit_message="${message}"`,
      );
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
