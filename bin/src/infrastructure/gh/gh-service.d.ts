import { ChildProcessService } from '../terminal/child-process-service';
export declare class GhService {
    private readonly cwd;
    private readonly childProcessService;
    createRelease(tag: string, releaseNotes: string): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
    constructor(cwd: string, childProcessService: ChildProcessService);
}
//# sourceMappingURL=gh-service.d.ts.map