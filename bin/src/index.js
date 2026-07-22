#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_factory_1 = require("./application/action/action-factory");
void (async () => {
    try {
        const cwd = process.cwd();
        const cliFactory = action_factory_1.CliFactory.make(cwd);
        const bumpers = [];
        const bumpNpm = (process.env.BUMP_NPM || 'false') === 'true';
        if (bumpNpm)
            bumpers.push(cliFactory.coreFactory.getNpmService());
        const bumpClaude = (process.env.BUMP_CLAUDE || 'false') === 'true';
        if (bumpClaude) {
            const pluginDir = process.env.PLUGIN_DIR || '.claude-plugin';
            bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
        }
        const command = cliFactory.getBumpCommand(bumpers);
        const inputs = {
            semantic: process.env.SEMANTIC ?? '',
            versionFile: process.env.VERSION_FILE || 'version.txt',
            changelogFile: process.env.CHANGELOG_FILE || 'CHANGELOG.md',
            refName: process.env.REF_NAME || 'main',
            overrideTag: (process.env.OVERRIDE_TAG || 'true') === 'true',
            tagPrefix: process.env.TAG_PREFIX || 'v',
            target: process.env.TARGET || undefined,
            mergeMessage: process.env.MERGE_MESSAGE || undefined,
        };
        const { version, tag, tagMajor, tagMinor } = command.run(inputs);
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
//# sourceMappingURL=index.js.map