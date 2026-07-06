import { GhService } from '../../infrastructure/gh/gh-service';
import { GitService } from '../../infrastructure/git/git-service';
import { CommitService } from './commit-service';
export declare class ChangelogService {
    private readonly cwd;
    private readonly gitService;
    private readonly ghService;
    private readonly commitService;
    private generateReleaseNotes;
    private updateChangelog;
    applyReleaseChangelog({ tagPrefix, nextVersion, major, minor, changelogFile, refName, overrideTag, }: {
        tagPrefix: string;
        nextVersion: string;
        major: string;
        minor: string;
        changelogFile: string;
        refName: string;
        overrideTag: boolean;
    }): {
        ok: false;
        error: unknown;
        data?: undefined;
    } | {
        ok: true;
        data: {
            tag: string;
            tagMajor: string;
            tagMinor: string;
        };
        error?: undefined;
    };
    constructor(cwd: string, gitService: GitService, ghService: GhService, commitService: CommitService);
}
//# sourceMappingURL=changelog-service.d.ts.map