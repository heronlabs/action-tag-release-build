"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangelogService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const commit_types_1 = require("../types/commit-types");
class ChangelogService {
    cwd;
    gitService;
    ghService;
    commitService;
    generateReleaseNotes(tagPrefix) {
        try {
            const commits = this.commitService.parseDescriptionSince(tagPrefix);
            if (!commits.ok)
                return { ok: false, error: commits.error };
            const groups = new Map();
            const breaking = [];
            for (const c of commits.data) {
                const label = commit_types_1.CommitTypeLabels[c.type];
                const list = groups.get(label) ?? [];
                list.push(c);
                groups.set(label, list);
                if (c.breaking)
                    breaking.push(c);
            }
            const sections = [];
            if (breaking.length > 0) {
                const lines = breaking.map(c => {
                    const scope = c.scope ? `(${c.scope})` : '';
                    return `* ${c.type}${scope}!: ${c.description} (${c.hash})`;
                });
                sections.push(`### ⚠ BREAKING CHANGES\n\n${lines.join('\n')}`);
            }
            for (const label of Object.values(commit_types_1.CommitTypeLabels)) {
                const items = groups.get(label);
                if (!items)
                    continue;
                const lines = items.map(c => {
                    const scope = c.scope ? `(${c.scope})` : '';
                    const bang = c.breaking ? '!' : '';
                    return `* ${c.type}${scope}${bang}: ${c.description} (${c.hash})`;
                });
                sections.push(`### ${label}\n\n${lines.join('\n')}`);
            }
            const releaseNotes = sections.join('\n\n');
            return { ok: true, data: releaseNotes };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    updateChangelog(tag, releaseNotes, changelogFile) {
        try {
            const path = (0, node_path_1.join)(this.cwd, changelogFile);
            const date = new Date().toISOString().slice(0, 10);
            const entry = `## ${tag} (${date})\n\n${releaseNotes}\n\n`;
            if ((0, node_fs_1.existsSync)(path)) {
                const existing = (0, node_fs_1.readFileSync)(path).toString();
                (0, node_fs_1.writeFileSync)(path, entry + existing);
            }
            else {
                (0, node_fs_1.writeFileSync)(path, entry);
            }
            return { ok: true };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    applyReleaseChangelog({ tagPrefix, nextVersion, major, minor, changelogFile, refName, overrideTag, }) {
        const tag = `${tagPrefix}${nextVersion}`;
        const tagMajor = `${tagPrefix}${major}`;
        const tagMinor = `${tagPrefix}${major}.${minor}`;
        const releaseNotes = this.generateReleaseNotes(tagPrefix);
        if (!releaseNotes.ok)
            return { ok: false, error: releaseNotes.error };
        const changelog = this.updateChangelog(tag, releaseNotes.data, changelogFile);
        if (!changelog.ok)
            return { ok: false, error: changelog.error };
        const gitApply = this.gitService.apply({
            version: nextVersion,
            tag,
            refName,
            tags: overrideTag ? { major: tagMajor, minor: tagMinor } : undefined,
        });
        if (!gitApply.ok)
            return { ok: false, error: gitApply.error };
        const ghRelease = this.ghService.createRelease(tag, releaseNotes.data);
        if (!ghRelease.ok) {
            return { ok: false, error: ghRelease.error };
        }
        return { ok: true, data: { tag, tagMajor, tagMinor } };
    }
    constructor(cwd, gitService, ghService, commitService) {
        this.cwd = cwd;
        this.gitService = gitService;
        this.ghService = ghService;
        this.commitService = commitService;
    }
}
exports.ChangelogService = ChangelogService;
//# sourceMappingURL=changelog-service.js.map