"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalFactory = void 0;
const child_process_service_1 = require("./services/child-process-service");
class TerminalFactory {
    cwd;
    getChildProcessService() {
        return new child_process_service_1.ChildProcessService(this.cwd);
    }
    constructor(cwd) {
        this.cwd = cwd;
    }
    static make(cwd) {
        return new TerminalFactory(cwd);
    }
}
exports.TerminalFactory = TerminalFactory;
//# sourceMappingURL=terminal-factory.js.map