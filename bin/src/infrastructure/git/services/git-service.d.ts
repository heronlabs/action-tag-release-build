import { ChildProcessService } from '../../terminal/services/child-process-service';
export declare class GitService {
    private readonly childProcessService;
    getLastCommit(): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
    getDescriptionSince(tagPrefix: string): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
    apply({ version, tag, refName, tags, }: {
        version: string;
        tag: string;
        refName: string;
        tags?: {
            major: string;
            minor: string;
        };
    }): {
        ok: false;
        error: unknown;
    } | {
        ok: true;
        error?: undefined;
    };
    constructor(childProcessService: ChildProcessService);
}
//# sourceMappingURL=git-service.d.ts.map