import { GhFactory } from '../infrastructure/gh/gh-factory';
import { GitFactory } from '../infrastructure/git/git-factory';
import { TerminalFactory } from '../infrastructure/terminal/terminal-factory';
import { ClaudeService } from './services/bumpers/claude-bumper-service';
import { NpmService } from './services/bumpers/npm-bumper-service';
import { ChangelogService } from './services/changelog-service';
import { CommitService } from './services/commit-service';
import { SemverService } from './services/semver-service';
export declare class CoreFactory {
    private readonly cwd;
    private readonly gitFactory;
    private readonly ghFactory;
    private readonly terminalFactory;
    getCommitService(): CommitService;
    getSemverService(): SemverService;
    getChangelogService(): ChangelogService;
    getNpmService(): NpmService;
    getClaudeService(pluginDir: string): ClaudeService;
    constructor(cwd: string, gitFactory: GitFactory, ghFactory: GhFactory, terminalFactory: TerminalFactory);
    static make(cwd: string): CoreFactory;
}
//# sourceMappingURL=core-factory.d.ts.map