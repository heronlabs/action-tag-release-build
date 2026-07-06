import { CommitService } from './commit-service';
export declare class SemverService {
    private readonly cwd;
    private readonly commitService;
    private calculate;
    private get;
    private set;
    calculateNextVersion(versionFile: string, semantic?: string): {
        ok: false;
        error: unknown;
        data?: undefined;
    } | {
        ok: true;
        data: {
            nextVersion: string;
            major: string;
            minor: string;
            patch: string;
        };
        error?: undefined;
    };
    constructor(cwd: string, commitService: CommitService);
}
//# sourceMappingURL=semver-service.d.ts.map