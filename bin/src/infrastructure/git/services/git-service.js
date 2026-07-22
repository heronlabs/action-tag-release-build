"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
class GitService {
    childProcessService;
    getLastCommit() {
        return this.childProcessService.exec('git log -1 --pretty=%B');
    }
    getDescriptionSince(tagPrefix) {
        const previousTag = this.childProcessService.exec(`git describe --tags --abbrev=0 --match "${tagPrefix}*" HEAD`);
        const range = previousTag.ok ? `${previousTag.data}..HEAD` : '';
        return this.childProcessService.exec(`git log --pretty=format:"%H %s" ${range}`);
    }
    apply({ version, tag, refName, tags, }) {
        const commitMessage = `[skip ci] bump ${tag}`;
        const chain = this.childProcessService
            .execChain('git config user.name  "github-actions[bot]"')
            .execChain('git config user.email "github-actions[bot]@users.noreply.github.com"')
            .execChain('git add -A')
            .execChain(`git commit -m "${commitMessage}"`)
            .execChain(`git pull --rebase origin "${refName}"`)
            .execChain(`git tag -a "${tag}" -m "Release ${version}"`);
        if (!chain.ok) {
            return { ok: false, error: chain.error };
        }
        if (!tags) {
            const push = chain.execChain('git push --follow-tags');
            if (!push.ok)
                return { ok: false, error: push.error };
            return { ok: true };
        }
        const push = chain
            .execChain(`git tag -fa "${tags.major}" -m "Latest ${tags.major}.x.x release"`)
            .execChain(`git tag -fa "${tags.minor}" -m "Latest ${tags.minor}.x release"`)
            .execChain('git push --follow-tags')
            .execChain(`git push origin "${tags.major}" --force`)
            .execChain(`git push origin "${tags.minor}" --force`);
        if (!push.ok)
            return { ok: false, error: push.error };
        return { ok: true };
    }
    constructor(childProcessService) {
        this.childProcessService = childProcessService;
    }
}
exports.GitService = GitService;
//# sourceMappingURL=git-service.js.map