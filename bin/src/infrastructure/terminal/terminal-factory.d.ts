import { ChildProcessService } from './services/child-process-service';
export declare class TerminalFactory {
    private readonly cwd;
    getChildProcessService(): ChildProcessService;
    constructor(cwd: string);
    static make(cwd: string): TerminalFactory;
}
//# sourceMappingURL=terminal-factory.d.ts.map