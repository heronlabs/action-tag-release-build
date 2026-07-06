"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitService = void 0;
class CommitService {
    gitService;
    parseCommit(subject) {
        const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.*)/);
        if (!match) {
            return {
                type: 'other',
                breaking: false,
                description: subject,
            };
        }
        const [, type, scope, bang, description] = match;
        return {
            type: type,
            scope,
            breaking: !!bang,
            description: `${description}`,
        };
    }
    parseDescriptionSince(tagPrefix) {
        try {
            const lastCommits = this.gitService.getDescriptionSince(tagPrefix);
            if (!lastCommits.ok)
                return { ok: false, error: lastCommits.error };
            const parsedCommits = lastCommits.data
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => {
                const hash = line.slice(0, 40);
                const commit = line.slice(41);
                return {
                    hash,
                    ...this.parseCommit(commit),
                };
            });
            return { ok: true, data: parsedCommits };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    classifyLastCommit() {
        try {
            const lastCommit = this.gitService.getLastCommit();
            if (!lastCommit.ok)
                return { ok: false, error: lastCommit.error };
            const parsedCommits = lastCommit.data
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => this.parseCommit(line));
            let data = 'patch';
            const commit = parsedCommits[0];
            if (commit) {
                if (commit.breaking)
                    data = 'major';
                else if (commit.type === 'feat')
                    data = 'minor';
            }
            return { ok: true, data };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    constructor(gitService) {
        this.gitService = gitService;
    }
}
exports.CommitService = CommitService;
//# sourceMappingURL=commit-service.js.map