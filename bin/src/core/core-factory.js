"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreFactory = void 0;
const gh_factory_1 = require("../infrastructure/gh/gh-factory");
const git_factory_1 = require("../infrastructure/git/git-factory");
const terminal_factory_1 = require("../infrastructure/terminal/terminal-factory");
const claude_bumper_service_1 = require("./services/bumpers/claude-bumper-service");
const npm_bumper_service_1 = require("./services/bumpers/npm-bumper-service");
const changelog_service_1 = require("./services/changelog-service");
const commit_service_1 = require("./services/commit-service");
const semver_service_1 = require("./services/semver-service");
class CoreFactory {
    cwd;
    gitFactory;
    ghFactory;
    terminalFactory;
    getCommitService() {
        return new commit_service_1.CommitService(this.gitFactory.getGitService());
    }
    getSemverService() {
        return new semver_service_1.SemverService(this.cwd, this.getCommitService());
    }
    getChangelogService() {
        return new changelog_service_1.ChangelogService(this.cwd, this.gitFactory.getGitService(), this.ghFactory.getGhService(), this.getCommitService());
    }
    getNpmService() {
        return new npm_bumper_service_1.NpmService(this.terminalFactory.getChildProcessService());
    }
    getClaudeService(pluginDir) {
        return new claude_bumper_service_1.ClaudeService(this.cwd, pluginDir);
    }
    constructor(cwd, gitFactory, ghFactory, terminalFactory) {
        this.cwd = cwd;
        this.gitFactory = gitFactory;
        this.ghFactory = ghFactory;
        this.terminalFactory = terminalFactory;
    }
    static make(cwd) {
        const terminalFactory = terminal_factory_1.TerminalFactory.make(cwd);
        const gitFactory = git_factory_1.GitFactory.make(terminalFactory);
        const ghFactory = gh_factory_1.GhFactory.make(cwd, terminalFactory);
        return new CoreFactory(cwd, gitFactory, ghFactory, terminalFactory);
    }
}
exports.CoreFactory = CoreFactory;
//# sourceMappingURL=core-factory.js.map