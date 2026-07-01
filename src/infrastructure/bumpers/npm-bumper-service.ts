import {Bumper} from '../../core/interfaces/bumper';
import {ChildProcessService} from '../terminal/child-process-service';

export class NpmService implements Bumper {
  readonly name = 'npm';

  bump(version: string) {
    return this.childProcessService.exec(
      `npm version "${version}" --no-git-tag-version`,
    );
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
