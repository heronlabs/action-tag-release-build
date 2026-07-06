import { Bumper } from '../../interfaces/bumper';
export declare class ClaudeService implements Bumper {
    private readonly cwd;
    bump(version: string): {
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
//# sourceMappingURL=claude-bumper-service.d.ts.map