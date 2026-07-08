#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsFactory = void 0;
const bump_command_1 = require("./application/cli/bump-command");
const claude_bumper_service_1 = require("./core/services/bumpers/claude-bumper-service");
const npm_bumper_service_1 = require("./core/services/bumpers/npm-bumper-service");
const changelog_service_1 = require("./core/services/changelog-service");
const commit_service_1 = require("./core/services/commit-service");
const semver_service_1 = require("./core/services/semver-service");
const gh_service_1 = require("./infrastructure/gh/gh-service");
const git_service_1 = require("./infrastructure/git/git-service");
const child_process_service_1 = require("./infrastructure/terminal/child-process-service");
class CommandsFactory {
    static makeBump() {
        const cwd = process.cwd();
        const childProcessService = new child_process_service_1.ChildProcessService(cwd);
        const gitService = new git_service_1.GitService(childProcessService);
        const commitService = new commit_service_1.CommitService(gitService);
        const semverService = new semver_service_1.SemverService(cwd, commitService);
        const ghService = new gh_service_1.GhService(cwd, childProcessService);
        const changelogService = new changelog_service_1.ChangelogService(cwd, gitService, ghService, commitService);
        const bumpers = [];
        const bumpNpm = (process.env.BUMP_NPM ?? 'false') === 'true';
        if (bumpNpm)
            bumpers.push(new npm_bumper_service_1.NpmService(childProcessService));
        const bumpClaude = (process.env.BUMP_CLAUDE ?? 'false') === 'true';
        if (bumpClaude) {
            const pluginDir = process.env.PLUGIN_DIR ?? '.claude-plugin';
            bumpers.push(new claude_bumper_service_1.ClaudeService(cwd, pluginDir));
        }
        return new bump_command_1.BumpCommand(bumpers, semverService, changelogService);
    }
}
exports.CommandsFactory = CommandsFactory;
void (async () => {
    try {
        const bumpCommand = CommandsFactory.makeBump();
        const inputs = {
            semantic: process.env.SEMANTIC ?? '',
            versionFile: process.env.VERSION_FILE ?? 'version.txt',
            changelogFile: process.env.CHANGELOG_FILE ?? 'CHANGELOG.md',
            refName: process.env.REF_NAME ?? 'main',
            overrideTag: (process.env.OVERRIDE_TAG ?? 'true') === 'true',
            tagPrefix: process.env.TAG_PREFIX ?? 'v',
        };
        const { version, tag, tagMajor, tagMinor } = bumpCommand.run(inputs);
        process.stdout.write(`${version}\n`);
        process.stdout.write(`${tag}\n`);
        process.stdout.write(`${tagMajor}\n`);
        process.stdout.write(`${tagMinor}\n`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error\n';
        process.stderr.write(`${message}\n`);
        process.exit(1);
    }
})();
//# sourceMappingURL=cli.js.map