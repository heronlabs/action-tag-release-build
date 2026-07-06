"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildProcessService = void 0;
const node_child_process_1 = require("node:child_process");
class ChildProcessService {
    cwd;
    success(data) {
        return {
            ok: true,
            data,
            execChain: (nextCommand) => this.execChain(nextCommand),
        };
    }
    failure(error) {
        const result = {
            ok: false,
            error,
            execChain: () => result,
        };
        return result;
    }
    execChain(command) {
        try {
            const data = (0, node_child_process_1.execSync)(command, {
                cwd: this.cwd,
                encoding: 'utf8',
                stdio: 'pipe',
            })
                .toString()
                .trim();
            return this.success(data);
        }
        catch (error) {
            return this.failure(error);
        }
    }
    exec(command) {
        try {
            const data = (0, node_child_process_1.execSync)(command, {
                cwd: this.cwd,
                encoding: 'utf8',
                stdio: 'pipe',
            })
                .toString()
                .trim();
            return { ok: true, data };
        }
        catch (error) {
            return { ok: false, error };
        }
    }
    constructor(cwd) {
        this.cwd = cwd;
    }
}
exports.ChildProcessService = ChildProcessService;
//# sourceMappingURL=child-process-service.js.map