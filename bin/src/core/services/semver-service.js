"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemverService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class SemverService {
    cwd;
    commitService;
    calculate(version, semantic) {
        try {
            const numeric = version.replace(/^\D+/, '');
            if (!numeric) {
                return {
                    ok: false,
                    error: new Error(`version '${version}' has no numeric part`),
                };
            }
            const [major = '0', minor = '0', patch = '0'] = numeric.split('.');
            const m = parseInt(major, 10);
            const n = parseInt(minor, 10);
            const p = parseInt(patch, 10);
            let nextMajor = m;
            let nextMinor = n;
            let nextPatch = p;
            if (semantic === 'major') {
                nextMajor = m + 1;
                nextMinor = 0;
                nextPatch = 0;
            }
            else if (semantic === 'minor') {
                nextMinor = n + 1;
                nextPatch = 0;
            }
            else {
                nextPatch = p + 1;
            }
            const nextVersion = `${nextMajor}.${nextMinor}.${nextPatch}`;
            return {
                ok: true,
                data: {
                    nextVersion,
                    major: `${nextMajor}`,
                    minor: `${nextMinor}`,
                    patch: `${nextPatch}`,
                },
            };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    get(versionFile) {
        try {
            const path = (0, node_path_1.join)(this.cwd, versionFile);
            const content = (0, node_fs_1.readFileSync)(path, 'utf8');
            const version = content.trim();
            if (!version) {
                return {
                    ok: false,
                    error: new Error(`version file '${path}' is empty`),
                };
            }
            return { ok: true, data: version };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    set(version, versionFile) {
        try {
            const path = (0, node_path_1.join)(this.cwd, versionFile);
            (0, node_fs_1.writeFileSync)(path, `${version}\n`);
            return { ok: true };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    calculateNextVersion(versionFile, semantic) {
        const version = this.get(versionFile);
        if (!version.ok)
            return { ok: false, error: version.error };
        if (semantic) {
            const semanticCheck = ['major', 'minor', 'patch'].includes(semantic);
            if (!semanticCheck)
                return {
                    ok: false,
                    error: new Error(`invalid semantic: '${semantic}'`),
                };
        }
        else {
            const lastCommitType = this.commitService.classifyLastCommit();
            if (!lastCommitType.ok)
                return { ok: false, error: lastCommitType.error };
            semantic = lastCommitType.data;
        }
        const semver = this.calculate(version.data, semantic);
        if (!semver.ok)
            return { ok: false, error: semver.error };
        const setVersion = this.set(semver.data.nextVersion, versionFile);
        if (!setVersion.ok)
            return { ok: false, error: setVersion.error };
        return {
            ok: true,
            data: {
                nextVersion: semver.data.nextVersion,
                major: semver.data.major,
                minor: semver.data.minor,
                patch: semver.data.patch,
            },
        };
    }
    constructor(cwd, commitService) {
        this.cwd = cwd;
        this.commitService = commitService;
    }
}
exports.SemverService = SemverService;
//# sourceMappingURL=semver-service.js.map