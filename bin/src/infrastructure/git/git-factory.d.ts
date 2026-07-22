import { TerminalFactory } from '../terminal/terminal-factory';
import { GitService } from './services/git-service';
export declare class GitFactory {
    private readonly terminalFactory;
    getGitService(): GitService;
    constructor(terminalFactory: TerminalFactory);
    static make(terminalFactory: TerminalFactory): GitFactory;
}
//# sourceMappingURL=git-factory.d.ts.map