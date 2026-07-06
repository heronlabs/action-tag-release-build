import { ParsedDescription } from '../../core/types/parsed-commit';
import { GitService } from '../../infrastructure/git/git-service';
import { Semantic } from '../types/semantic';
export declare class CommitService {
    private readonly gitService;
    private parseCommit;
    parseDescriptionSince(tagPrefix: string): {
        ok: false;
        error: unknown;
        data?: undefined;
    } | {
        ok: true;
        data: ParsedDescription[];
        error?: undefined;
    };
    classifyLastCommit(): {
        ok: false;
        error: unknown;
        data?: undefined;
    } | {
        ok: true;
        data: Semantic;
        error?: undefined;
    };
    constructor(gitService: GitService);
}
//# sourceMappingURL=commit-service.d.ts.map