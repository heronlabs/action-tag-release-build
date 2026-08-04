import {CommitType, CommitTypeLabels} from '../../core/types/commit-types';
import {ParsedDescription} from '../../core/types/parsed-commit';
import {GitService} from '../../infrastructure/git/services/git-service';
import {COMMIT_RECORD_SEPARATOR} from '../../infrastructure/git/types/commit-record-separator';
import {Semantic} from '../types/semantic';

export class CommitService {
  private parseCommit(message: string) {
    const lines = message.split('\n');
    const subject = lines.find(line => line.trim().length > 0) ?? '';

    const [, rawType, rawScope, breakingMarker, rawDescription] =
      subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.*)/) ?? [];

    const breakingFooters = lines
      .map(line => /^BREAKING[ -]CHANGE\s*:\s*(.*)/.exec(line.trim()))
      .filter(footer => footer !== null);

    const isKnownType = rawType !== undefined && rawType in CommitTypeLabels;
    const hasBreakingMarker = breakingMarker !== undefined;
    const breakingDescription = breakingFooters[0]?.[1];

    return {
      type: (isKnownType ? rawType : 'other') as CommitType,
      scope: rawScope,
      breaking: hasBreakingMarker || breakingDescription !== undefined,
      breakingDescription,
      description: rawDescription ?? subject,
    };
  }

  public parseDescriptionSince(tagPrefix: string) {
    try {
      const lastCommits = this.gitService.getDescriptionSince(tagPrefix);
      if (!lastCommits.ok)
        return {ok: false as const, error: lastCommits.error};

      const parsedCommits: ParsedDescription[] = lastCommits.data
        .split(COMMIT_RECORD_SEPARATOR)
        .map(record => record.trim())
        .filter(record => record.length > 0)
        .map(record => {
          const hash = record.slice(0, 40);
          const commit = record.slice(41);

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

      const commit = this.parseCommit(lastCommit.data);

      let data: Semantic = 'patch';
      if (commit.breaking) data = 'major';
      else if (commit.type === 'feat') data = 'minor';

      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly gitService: GitService) {}
}
