"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitFactory = void 0;
const git_service_1 = require("./services/git-service");
class GitFactory {
    terminalFactory;
    getGitService() {
        return new git_service_1.GitService(this.terminalFactory.getChildProcessService());
    }
    constructor(terminalFactory) {
        this.terminalFactory = terminalFactory;
    }
    static make(terminalFactory) {
        return new GitFactory(terminalFactory);
    }
}
exports.GitFactory = GitFactory;
//# sourceMappingURL=git-factory.js.map