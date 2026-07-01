import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {GitService} from '../../infrastructure/git/git-service';
import {Semantic} from '../types/semantic';

export class SemverService {
  private classify(message: string) {
    try {
      const subject = message.split('\n')[0]!;
      let data: Semantic = 'patch';
      const breaking =
        subject.includes('!:') || /\bBREAKING[ -]CHANGE\b/.test(message);
      if (breaking) data = 'major';
      else if (/^feat\b/.test(subject)) data = 'minor';
      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  private calculate(version: string, semantic: Semantic) {
    try {
      const numeric = version.replace(/^\D+/, '');
      const [major = '0', minor = '0', patch = '0'] = numeric.split('.');

      const m = parseInt(major, 10);
      const n = parseInt(minor, 10);
      const p = parseInt(patch, 10);

      let nextMajor = m;
      let nextMinor = n;
      let nextPatch = p;

      if (semantic === 'major') {
        nextMajor = m + 1;
        nextMinor = 0;
        nextPatch = 0;
      } else if (semantic === 'minor') {
        nextMinor = n + 1;
        nextPatch = 0;
      } else if (semantic === 'patch') {
        nextPatch = p + 1;
      }

      const nextVersion = `${nextMajor}.${nextMinor}.${nextPatch}`;

      return {
        ok: true as const,
        data: {
          nextVersion,
          major: `${nextMajor}`,
          minor: `${nextMinor}`,
          patch: `${nextPatch}`,
        },
      };
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  private get(versionFile: string) {
    try {
      const path = join(this.cwd, versionFile);

      let content: string;
      try {
        content = readFileSync(path, 'utf8');
      } catch {
        return {
          ok: false as const,
          error: new Error(`🚫 Version file '${path}' not found`),
        };
      }

      const version = content.trim();
      if (!version) {
        return {
          ok: false as const,
          error: new Error(`🚫 Version file '${path}' is empty`),
        };
      }

      return {ok: true as const, data: version};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  private set(version: string, versionFile: string) {
    try {
      const path = join(this.cwd, versionFile);

      writeFileSync(path, `${version}\n`);
      return {ok: true as const};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  public calculateNextVersion(versionFile: string, semantic?: string) {
    const version = this.get(versionFile);
    if (!version.ok) return {ok: false as const, error: version.error};

    if (semantic) {
      const semanticCheck = ['major', 'minor', 'patch'].includes(semantic);
      if (!semanticCheck)
        return {
          ok: false as const,
          error: new Error(`🚫 Invalid semantic: '${semantic}'`),
        };
    } else {
      const lastCommit = this.gitService.getLastCommit();
      if (!lastCommit.ok) return {ok: false as const, error: lastCommit.error};

      const lastCommitType = this.classify(lastCommit.data);
      if (!lastCommitType.ok)
        return {ok: false as const, error: lastCommitType.error};
      semantic = lastCommitType.data;
    }

    const semver = this.calculate(version.data, semantic as Semantic);
    if (!semver.ok) return {ok: false as const, error: semver.error};

    const setVersion = this.set(semver.data.nextVersion, versionFile);
    if (!setVersion.ok) return {ok: false as const, error: setVersion.error};

    return {
      ok: true as const,
      data: {
        nextVersion: semver.data.nextVersion,
        major: semver.data.major,
        minor: semver.data.minor,
        patch: semver.data.patch,
      },
    };
  }

  constructor(
    private readonly cwd: string,
    private readonly gitService: GitService,
  ) {}
}
