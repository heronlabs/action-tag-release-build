import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {GhService} from '../../infrastructure/gh/gh-service';
import {GitService} from '../../infrastructure/git/git-service';
import {CommitTypeLabels} from '../types/commit-types';
import {ParsedDescription} from '../types/parsed-commit';
import {CommitService} from './commit-service';

export class ChangelogService {
  private generateReleaseNotes(tagPrefix: string) {
    try {
      const commits = this.commitService.parseDescriptionSince(tagPrefix);
      if (!commits.ok) return {ok: false as const, error: commits.error};

      const groups = new Map<string, ParsedDescription[]>();
      const breaking: ParsedDescription[] = [];

      for (const c of commits.data) {
        const label = CommitTypeLabels[c.type] ?? CommitTypeLabels.other;
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

      for (const label of Object.values(CommitTypeLabels)) {
        const items = groups.get(label);
        if (!items) continue;

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
        const existing = readFileSync(path).toString();
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

    const gitApply = this.gitService.apply({
      version: nextVersion,
      tag,
      refName,
      tags: overrideTag ? {major: tagMajor, minor: tagMinor} : undefined,
    });
    if (!gitApply.ok) return {ok: false as const, error: gitApply.error};

    const ghRelease = this.ghService.createRelease(tag, releaseNotes.data);
    if (!ghRelease.ok) {
      return {ok: false as const, error: ghRelease.error};
    }

    return {ok: true as const, data: {tag, tagMajor, tagMinor}};
  }

  constructor(
    private readonly cwd: string,
    private readonly gitService: GitService,
    private readonly ghService: GhService,
    private readonly commitService: CommitService,
  ) {}
}
