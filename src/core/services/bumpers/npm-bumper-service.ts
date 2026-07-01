import {ChildProcessService} from '../../../infrastructure/terminal/child-process-service';
import {Bumper} from '../../interfaces/bumper';

export class NpmService implements Bumper {
  readonly name = 'npm';

  bump(version: string) {
    return this.childProcessService.exec(
      `npm version "${version}" --no-git-tag-version`,
    );
  }

  constructor(private readonly childProcessService: ChildProcessService) {}
}
