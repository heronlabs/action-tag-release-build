import { CoreFactory } from '../../core/core-factory';
import { Bumper } from '../../core/interfaces/bumper';
import { ClaudeService } from '../../core/services/bumpers/claude-bumper-service';
import { NpmService } from '../../core/services/bumpers/npm-bumper-service';
import { BumpCommand } from './bump-command/bump-command';
export declare class CliFactory {
    private readonly coreFactory;
    getBumpCommand(bumpers: Bumper[]): BumpCommand;
    getNpmService(): NpmService;
    getClaudeService(pluginDir: string): ClaudeService;
    constructor(coreFactory: CoreFactory);
    static make(cwd: string): CliFactory;
}
//# sourceMappingURL=cli-factory.d.ts.map