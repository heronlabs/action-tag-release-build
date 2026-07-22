#!/usr/bin/env node

import {CliFactory} from './application/action/action-factory';
import {Inputs} from './application/action/command/types/inputs';
import {Bumper} from './core/interfaces/bumper';

void (async () => {
  try {
    const cwd = process.cwd();
    const cliFactory = CliFactory.make(cwd);

    const bumpers: Bumper[] = [];

    const bumpNpm = (process.env.BUMP_NPM || 'false') === 'true';
    if (bumpNpm) bumpers.push(cliFactory.coreFactory.getNpmService());

    const bumpClaude = (process.env.BUMP_CLAUDE || 'false') === 'true';
    if (bumpClaude) {
      const pluginDir = process.env.PLUGIN_DIR || '.claude-plugin';
      bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
    }

    const command = cliFactory.getBumpCommand(bumpers);

    const inputs: Inputs = {
      semantic: process.env.SEMANTIC ?? '',
      versionFile: process.env.VERSION_FILE || 'version.txt',
      changelogFile: process.env.CHANGELOG_FILE || 'CHANGELOG.md',
      refName: process.env.REF_NAME || 'main',
      overrideTag: (process.env.OVERRIDE_TAG || 'true') === 'true',
      tagPrefix: process.env.TAG_PREFIX || 'v',
      target: process.env.TARGET || undefined,
      mergeMessage: process.env.MERGE_MESSAGE || undefined,
    };

    const {version, tag, tagMajor, tagMinor} = command.run(inputs);

    process.stdout.write(`${version}\n`);
    process.stdout.write(`${tag}\n`);
    process.stdout.write(`${tagMajor}\n`);
    process.stdout.write(`${tagMinor}\n`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error\n';

    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
})();
