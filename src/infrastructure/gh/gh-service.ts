import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {ChildProcessService} from '../terminal/child-process-service';

export class GhService {
  public createRelease(tag: string, releaseNotes: string) {
    try {
      const releaseNotesFile = join(this.cwd, '.release-notes.tmp.md');

      writeFileSync(releaseNotesFile, releaseNotes, 'utf8');

      this.childProcessService.exec(
        `gh release create "${tag}" --title "${tag}" --notes-file "${releaseNotesFile}" 2>&1`,
      );

      return {ok: true as const};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly cwd: string,
    private readonly childProcessService: ChildProcessService,
  ) {}
}
