import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

export class VersionService {
  get(versionFile: string) {
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

  set(version: string, versionFile: string) {
    try {
      const path = join(this.cwd, versionFile);

      writeFileSync(path, `${version}\n`);
      return {ok: true as const};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(private readonly cwd: string) {}
}
