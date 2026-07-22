"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliFactory = void 0;
const core_factory_1 = require("../../core/core-factory");
const command_1 = require("./command/command");
class CliFactory {
    coreFactory;
    getBumpCommand(bumpers) {
        return new command_1.Command(bumpers, this.coreFactory.getSemverService(), this.coreFactory.getChangelogService());
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
//# sourceMappingURL=action-factory.js.map