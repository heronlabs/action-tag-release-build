"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmService = void 0;
class NpmService {
    childProcessService;
    bump(version) {
        return this.childProcessService.exec(`npm version "${version}" --no-git-tag-version`);
    }
    constructor(childProcessService) {
        this.childProcessService = childProcessService;
    }
}
exports.NpmService = NpmService;
//# sourceMappingURL=npm-bumper-service.js.map