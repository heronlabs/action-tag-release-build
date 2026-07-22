"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhFactory = void 0;
const gh_service_1 = require("./services/gh-service");
class GhFactory {
    cwd;
    terminalFactory;
    getGhService() {
        return new gh_service_1.GhService(this.cwd, this.terminalFactory.getChildProcessService());
    }
    constructor(cwd, terminalFactory) {
        this.cwd = cwd;
        this.terminalFactory = terminalFactory;
    }
    static make(cwd, terminalFactory) {
        return new GhFactory(cwd, terminalFactory);
    }
}
exports.GhFactory = GhFactory;
//# sourceMappingURL=gh-factory.js.map