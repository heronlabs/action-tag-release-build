import { CoreFactory } from '../../core/core-factory';
import { Bumper } from '../../core/interfaces/bumper';
import { Command } from './command/command';
export declare class CliFactory {
    readonly coreFactory: CoreFactory;
    getBumpCommand(bumpers: Bumper[]): Command;
    constructor(coreFactory: CoreFactory);
    static make(cwd: string): CliFactory;
}
//# sourceMappingURL=action-factory.d.ts.map