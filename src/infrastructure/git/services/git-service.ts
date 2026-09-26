import {ChildProcessService} from '../../terminal/services/child-process-service';
import {BUMP_COMMIT_PREFIX} from '../types/bump-commit-prefix';

const PUSH_ATTEMPTS = 3;

export class GitService {
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
      '--no-merges',
      '--pretty=format:%H %s%n%b%x1e',
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
    const commitMessage = `${BUMP_COMMIT_PREFIX} ${tag}`;
    const refspecs = [
      `refs/heads/${ref}:refs/heads/${ref}`,
      `refs/tags/${tag}`,
    ];

    const commit = this.childProcessService
      .execChain('git', ['config', 'user.name', 'github-actions[bot]'])
      .execChain('git', [
        'config',
        'user.email',
        'github-actions[bot]@users.noreply.github.com',
      ])
      .execChain('git', ['add', '-A'])
      .execChain('git', ['commit', '-m', commitMessage]);
    if (!commit.ok) return {ok: false as const, error: commit.error};

    if (tags)
      refspecs.push(`+refs/tags/${tags.major}`, `+refs/tags/${tags.minor}`);

    let error: unknown;
    for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
      let chain = this.childProcessService
        .execChain('git', ['pull', '--rebase', 'origin', ref])
        .execChain('git', ['tag', '-fa', tag, '-m', `Release ${version}`]);

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
      }

      const result = chain
        .execChain('git', ['push', '--atomic', 'origin', ...refspecs])
        .execChain('git', ['rev-parse', 'HEAD']);

      if (result.ok) return {ok: true as const, data: result.data};

      this.childProcessService.exec('git', ['rebase', '--abort']);
      error = result.error;
    }

    return {ok: false as const, error};
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
