import {CommitType} from '../../core/types/commit-types';
import {ParsedCommit, ParsedDescription} from '../../core/types/parsed-commit';
import {GitService} from '../../infrastructure/git/git-service';
import {Semantic} from '../types/semantic';

export class CommitService {
  private parseCommit(subject: string) {
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.*)/);
    if (!match) {
      return {
        type: 'other' as CommitType,
        breaking: false,
        description: subject,
      };
    }
    const [, type, scope, bang, description] = match;
    return {
      type: type as CommitType,
      scope,
      breaking: !!bang,
      description: `${description}`,
    };
  }

  public parseDescriptionSince(tagPrefix: string) {
    try {
      const lastCommits = this.gitService.getDescriptionSince(tagPrefix);
      if (!lastCommits.ok)
        return {ok: false as const, error: lastCommits.error};

      const parsedCommits: ParsedDescription[] = lastCommits.data
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          const hash = line.slice(0, 40);
          const commit = line.slice(41);

          return {
            hash,
            ...this.parseCommit(commit),
          };
        });

      return {ok: true as const, data: parsedCommits};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public classifyLastCommit() {
    try {
      const lastCommit = this.gitService.getLastCommit();
      if (!lastCommit.ok) return {ok: false as const, error: lastCommit.error};

      const parsedCommits: ParsedCommit[] = lastCommit.data
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => this.parseCommit(line));

      let data: Semantic = 'patch';

      const commit = parsedCommits[0];
      if (commit) {
        if (commit.breaking) data = 'major';
        else if (commit.type === 'feat') data = 'minor';
      }

      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly gitService: GitService) {}
}
