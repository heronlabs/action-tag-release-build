"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliFactory = void 0;
const core_factory_1 = require("../../core/core-factory");
const bump_command_1 = require("./bump-command/bump-command");
class CliFactory {
    coreFactory;
    getBumpCommand(bumpers) {
        return new bump_command_1.BumpCommand(bumpers, this.coreFactory.getSemverService(), this.coreFactory.getChangelogService());
    }
    getNpmService() {
        return this.coreFactory.getNpmService();
    }
    getClaudeService(pluginDir) {
        return this.coreFactory.getClaudeService(pluginDir);
    }
    constructor(coreFactory) {
        this.coreFactory = coreFactory;
    }
    static make(cwd) {
        const coreFactory = core_factory_1.CoreFactory.make(cwd);
        return new CliFactory(coreFactory);
    }
}
exports.CliFactory = CliFactory;
//# sourceMappingURL=cli-factory.js.map