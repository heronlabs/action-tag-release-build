#!/usr/bin/env node

import {BumpFactory} from './application/cli/bump-factory';
import {BumpInputs} from './application/cli/dtos/input-bump';
import {Semantic} from './core/types/semantic';

const inputs: BumpInputs = {
  semantic: (process.env.SEMANTIC as Semantic) ?? '',
  versionFile: process.env.VERSION_FILE ?? 'version.txt',
  changelogFile: process.env.CHANGELOG_FILE ?? 'CHANGELOG.md',
  refName: process.env.REF_NAME ?? 'main',
  overrideTag: (process.env.OVERRIDE_TAG ?? 'true') === 'true',
  bumpNpm: (process.env.BUMP_NPM ?? 'false') === 'true',
  bumpClaude: (process.env.BUMP_CLAUDE ?? 'false') === 'true',
  tagPrefix: 'v',
};

void (async () => {
  try {
    const bumpCommand = BumpFactory.make();
    const {version, tag, tagMajor, tagMinor} = bumpCommand.run(inputs);

    process.stdout.write(version);
    process.stdout.write(tag);
    process.stdout.write(tagMajor);
    process.stdout.write(tagMinor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '🚫 Unexpected error\n';

    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
})();
