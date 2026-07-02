import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {GhService} from '../../infrastructure/gh/gh-service';
import {GitService} from '../../infrastructure/git/git-service';
import {
  COMMIT_TYPE_LABELS,
  CommitType,
  ParsedCommit,
} from '../types/parsed-commit';

export class ChangelogService {
  private parseSubject(subject: string) {
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.*)$/);
    if (!match) {
      return {
        type: 'other' as CommitType,
        breaking: false,
        description: subject,
      };
    }
    const [, type = 'other', scope, bang, description] = match;
    return {
      type: (Object.hasOwn(COMMIT_TYPE_LABELS, type)
        ? type
        : 'other') as CommitType,
      scope,
      breaking: !!bang,
      description: `${description}`,
    };
  }

  private generateReleaseNotes(tagPrefix: string) {
    try {
      const lastCommits = this.gitService.getCommits(tagPrefix);
      if (!lastCommits.ok)
        return {ok: false as const, error: lastCommits.error};

      const commits: ParsedCommit[] = lastCommits.data
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          const subject = line.slice(41);
          const {type, scope, breaking, description} =
            this.parseSubject(subject);

          return {
            hash: line.slice(0, 40),
            type,
            scope,
            breaking,
            description,
          };
        });
      const groups = new Map<string, ParsedCommit[]>();
      const breaking: ParsedCommit[] = [];
      for (const c of commits) {
        const label = COMMIT_TYPE_LABELS[c.type];
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
      for (const label of Object.values(COMMIT_TYPE_LABELS)) {
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

  private updateChangelog(
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

  public applyReleaseChangelog({
    tagPrefix,
    nextVersion,
    major,
    minor,
    changelogFile,
    refName,
    overrideTag,
  }: {
    tagPrefix: string;
    nextVersion: string;
    major: string;
    minor: string;
    changelogFile: string;
    refName: string;
    overrideTag: boolean;
  }) {
    const tag = `${tagPrefix}${nextVersion}`;
    const tagMajor = `${tagPrefix}${major}`;
    const tagMinor = `${tagPrefix}${major}.${minor}`;

    const releaseNotes = this.generateReleaseNotes(tagPrefix);
    if (!releaseNotes.ok)
      return {ok: false as const, error: releaseNotes.error};

    const changelog = this.updateChangelog(
      tag,
      releaseNotes.data,
      changelogFile,
    );
    if (!changelog.ok) return {ok: false as const, error: changelog.error};

    const gitApply = this.gitService.apply(
      nextVersion,
      tag,
      tagMajor,
      tagMinor,
      refName,
      overrideTag,
    );
    if (!gitApply.ok) return {ok: false as const, error: gitApply.error};

    const ghRelease = this.ghService.createRelease(tag, releaseNotes.data);
    if (!ghRelease.ok) {
      const rollbackTags = overrideTag ? {tagMajor, tagMinor} : undefined;
      this.gitService.rollbackFireForget(tag, rollbackTags);
      return {ok: false as const, error: ghRelease.error};
    }

    return {ok: true as const, data: {tag, tagMajor, tagMinor}};
  }

  constructor(
    private readonly cwd: string,
    private readonly gitService: GitService,
    private readonly ghService: GhService,
  ) {}
}
