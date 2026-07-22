import { TerminalFactory } from '../terminal/terminal-factory';
import { GhService } from './services/gh-service';
export declare class GhFactory {
    private readonly cwd;
    private readonly terminalFactory;
    getGhService(): GhService;
    constructor(cwd: string, terminalFactory: TerminalFactory);
    static make(cwd: string, terminalFactory: TerminalFactory): GhFactory;
}
//# sourceMappingURL=gh-factory.d.ts.map