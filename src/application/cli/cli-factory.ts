import {CoreFactory} from '../../core/core-factory';
import {Bumper} from '../../core/interfaces/bumper';
import {BumpCommand} from './bump-command/bump-command';

export class CliFactory {
  public getBumpCommand(bumpers: Bumper[]): BumpCommand {
    return new BumpCommand(
      bumpers,
      this.coreFactory.getSemverService(),
      this.coreFactory.getChangelogService(),
    );
  }

  constructor(public readonly coreFactory: CoreFactory) {}

  static make(cwd: string): CliFactory {
    const coreFactory = CoreFactory.make(cwd);
    return new CliFactory(coreFactory);
  }
}
