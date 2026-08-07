import {ChildProcessService} from '../../terminal/services/child-process-service';

export class MergeService {
  private encodeBranch(branch: string) {
    return branch.split('/').map(encodeURIComponent).join('/');
  }

  public mergeWithCommit(ref: string, environment: string) {
    try {
      const merge = this.childProcessService.exec('gh', [
        'api',
        'repos/{owner}/{repo}/merges',
        '-f',
        `base=${environment}`,
        '-f',
        `head=${ref}`,
        '-f',
        `commit_message=Merge ${ref} into ${environment}`,
        '--jq',
        '.sha',
      ]);
      if (!merge.ok) return merge;

      if (merge.data) return {ok: true as const, data: merge.data};

      return this.childProcessService.exec('gh', [
        'api',
        `repos/{owner}/{repo}/branches/${this.encodeBranch(environment)}`,
        '--jq',
        '.commit.sha',
      ]);
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public mergeWithoutCommit(ref: string, environment: string) {
    try {
      const sha = this.childProcessService.exec('gh', [
        'api',
        `repos/{owner}/{repo}/git/ref/heads/${this.encodeBranch(ref)}`,
        '--jq',
        '.object.sha',
      ]);
      if (!sha.ok) return sha;

      const fastForward = this.childProcessService.exec('gh', [
        'api',
        `repos/{owner}/{repo}/git/refs/heads/${this.encodeBranch(environment)}`,
        '-X',
        'PATCH',
        '-f',
        `sha=${sha.data}`,
      ]);
      if (!fastForward.ok) return fastForward;

      return {ok: true as const, data: sha.data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
