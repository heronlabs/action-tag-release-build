"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class GhService {
    cwd;
    childProcessService;
    createRelease(tag, releaseNotes) {
        try {
            const releaseNotesFile = (0, node_path_1.join)(this.cwd, '.release-notes.tmp.md');
            (0, node_fs_1.writeFileSync)(releaseNotesFile, releaseNotes, 'utf8');
            return this.childProcessService.exec(`gh release create "${tag}" --title "${tag}" --notes-file "${releaseNotesFile}"`);
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    constructor(cwd, childProcessService) {
        this.cwd = cwd;
        this.childProcessService = childProcessService;
    }
}
exports.GhService = GhService;
//# sourceMappingURL=gh-service.js.map