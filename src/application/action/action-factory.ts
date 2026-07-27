import {CoreFactory} from '../../core/core-factory';
import {Bumper} from '../../core/interfaces/bumper';
import {Command} from './command/command';

export class CliFactory {
  public getBumpCommand(bumpers: Bumper[]): Command {
    return new Command(
      bumpers,
      this.coreFactory.getSemverService(),
      this.coreFactory.getChangelogService(),
      this.coreFactory.getSyncService(),
    );
  }

  constructor(public readonly coreFactory: CoreFactory) {}

  static make(cwd: string): CliFactory {
    const coreFactory = CoreFactory.make(cwd);
    return new CliFactory(coreFactory);
  }
}
