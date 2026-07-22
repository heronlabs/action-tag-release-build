import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {ChildProcessService} from '../../terminal/services/child-process-service';

export class GhService {
  public createRelease(tag: string, releaseNotes: string) {
    try {
      const releaseNotesFile = join(this.cwd, '.release-notes.tmp.md');

      writeFileSync(releaseNotesFile, releaseNotes, 'utf8');

      return this.childProcessService.exec(
        `gh release create "${tag}" --title "${tag}" --notes-file "${releaseNotesFile}"`,
      );
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly cwd: string,
    private readonly childProcessService: ChildProcessService,
  ) {}
}
