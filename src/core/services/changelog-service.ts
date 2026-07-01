import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {GitService} from '../../infrastructure/git/git-service';
import {ParsedCommit} from '../types/parsed-commit';

export class ChangelogService {
  private parseSubject(subject: string) {
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.*)$/);
    if (!match) {
      return {type: 'other', breaking: false, description: subject};
    }
    const [, type, scope, bang, description] = match;
    return {
      type: type ?? 'other',
      scope,
      breaking: !!bang,
      description: description ?? '',
    };
  }

  public generateReleaseNotes(tagPrefix: string) {
    try {
      const {
        ok: commitsResultOk,
        data: commitsResult,
        error: commitsResultError,
      } = this.gitService.getCommits(tagPrefix);
      if (!commitsResultOk)
        return {ok: false as const, error: commitsResultError};

      const commits: ParsedCommit[] = commitsResult
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          const hash = line.slice(0, 40);
          const subject = line.slice(41);
          const {type, scope, breaking, description} =
            this.parseSubject(subject);
          return {hash, type, scope, breaking, description};
        });

      if (commits.length === 0)
        return {
          ok: false as const,
          error: new Error('No commits found since previous tag'),
        };

      const typeLabels: Array<[string, string]> = [
        ['feat', 'Features'],
        ['fix', 'Bug Fixes'],
        ['perf', 'Performance Improvements'],
        ['revert', 'Reverts'],
        ['docs', 'Documentation'],
        ['deps', 'Dependencies'],
        ['other', 'Miscellaneous Chores'],
      ];
      const labelByType = new Map(typeLabels);

      const groups = new Map<string, ParsedCommit[]>();
      const breaking: ParsedCommit[] = [];

      for (const c of commits) {
        const label = labelByType.get(c.type) ?? 'Miscellaneous Chores';
        const list = groups.get(label) ?? [];
        list.push(c);
        groups.set(label, list);

        if (c.breaking) breaking.push(c);
      }

      const sections: string[] = [];

      if (breaking.length > 0) {
        const lines = breaking.map(c => {
          const scope = c.scope ? `(${c.scope})` : '';
          return `* ${c.type}${scope}!: ${c.description} (${c.hash})`;
        });
        sections.push(`### ⚠ BREAKING CHANGES\n\n${lines.join('\n')}`);
      }

      for (const [, label] of typeLabels) {
        const items = groups.get(label);
        if (!items || items.length === 0) continue;

        const lines = items.map(c => {
          const scope = c.scope ? `(${c.scope})` : '';
          const bang = c.breaking ? '!' : '';
          return `* ${c.type}${scope}${bang}: ${c.description} (${c.hash})`;
        });
        sections.push(`### ${label}\n\n${lines.join('\n')}`);
      }

      const releaseNotes = sections.join('\n\n');

      return {ok: true as const, data: releaseNotes};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public updateChangelog(
    tag: string,
    releaseNotes: string,
    changelogFile: string,
  ) {
    try {
      const path = join(this.cwd, changelogFile);

      const date = new Date().toISOString().slice(0, 10);
      const entry = `## ${tag} (${date})\n\n${releaseNotes}\n\n`;

      if (existsSync(path)) {
        const existing = readFileSync(path, 'utf8');
        writeFileSync(path, entry + existing);
      } else {
        writeFileSync(path, entry);
      }

      return {ok: true as const};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly cwd: string,
    private readonly gitService: GitService,
  ) {}
}
