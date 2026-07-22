export declare class ChildProcessService {
    private readonly cwd;
    private success;
    private failure;
    execChain(command: string): {
        ok: true;
        data: string;
        execChain: (nextCommand: string) => /*elided*/ any | {
            ok: false;
            error: unknown;
            execChain: () => /*elided*/ any;
        };
    } | {
        ok: false;
        error: unknown;
        execChain: () => /*elided*/ any;
    };
    exec(command: string): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
    constructor(cwd: string);
}
//# sourceMappingURL=child-process-service.d.ts.map