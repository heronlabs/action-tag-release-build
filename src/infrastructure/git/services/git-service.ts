import {ChildProcessService} from '../../terminal/services/child-process-service';

export class GitService {
  public getLastCommit() {
    return this.childProcessService.exec('git', ['log', '-1', '--pretty=%B']);
  }

  public getDescriptionSince(tagPrefix: string) {
    const previousTag = this.childProcessService.exec('git', [
      'describe',
      '--tags',
      '--abbrev=0',
      '--match',
      `${tagPrefix}[0-9]*`,
      'HEAD',
    ]);
    const range = previousTag.ok ? [`${previousTag.data}..HEAD`] : [];

    return this.childProcessService.exec('git', [
      'log',
      '--pretty=format:%H %s',
      ...range,
    ]);
  }

  public applyTags({
    version,
    tag,
    ref,
    tags,
  }: {
    version: string;
    tag: string;
    ref: string;
    tags?: {
      major: string;
      minor: string;
    };
  }) {
    const commitMessage = `[skip ci] bump ${tag}`;
    const refspecs = [
      `refs/heads/${ref}:refs/heads/${ref}`,
      `refs/tags/${tag}`,
    ];

    let chain = this.childProcessService
      .execChain('git', ['config', 'user.name', 'github-actions[bot]'])
      .execChain('git', [
        'config',
        'user.email',
        'github-actions[bot]@users.noreply.github.com',
      ])
      .execChain('git', ['add', '-A'])
      .execChain('git', ['commit', '-m', commitMessage])
      .execChain('git', ['pull', '--rebase', 'origin', ref])
      .execChain('git', ['tag', '-a', tag, '-m', `Release ${version}`]);

    if (tags) {
      chain = chain
        .execChain('git', [
          'tag',
          '-fa',
          tags.major,
          '-m',
          `Latest ${tags.major}.x.x release`,
        ])
        .execChain('git', [
          'tag',
          '-fa',
          tags.minor,
          '-m',
          `Latest ${tags.minor}.x release`,
        ]);

      refspecs.push(`+refs/tags/${tags.major}`, `+refs/tags/${tags.minor}`);
    }

    const result = chain
      .execChain('git', ['push', '--atomic', 'origin', ...refspecs])
      .execChain('git', ['rev-parse', 'HEAD']);

    if (!result.ok) {
      this.childProcessService.exec('git', ['rebase', '--abort']);
      return {ok: false as const, error: result.error};
    }

    return {ok: true as const, data: result.data};
  }

  public mergeWithoutCommit(ref: string, environment: string) {
    return this.childProcessService.exec('git', [
      'push',
      'origin',
      `refs/heads/${ref}:refs/heads/${environment}`,
    ]);
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
