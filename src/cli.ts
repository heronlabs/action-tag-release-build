#!/usr/bin/env node

import {BumpCommand} from './application/cli/bump-command';
import {BumpInputs} from './application/cli/dtos/input-bump';
import {Bumper} from './core/interfaces/bumper';
import {ClaudeService} from './core/services/bumpers/claude-bumper-service';
import {NpmService} from './core/services/bumpers/npm-bumper-service';
import {ChangelogService} from './core/services/changelog-service';
import {SemverService} from './core/services/semver-service';
import {Bumpers} from './core/types/bumpers';
import {GhService} from './infrastructure/gh/gh-service';
import {GitService} from './infrastructure/git/git-service';
import {ChildProcessService} from './infrastructure/terminal/child-process-service';

const inputs: BumpInputs = {
  semantic: process.env.SEMANTIC ?? '',
  versionFile: process.env.VERSION_FILE ?? 'version.txt',
  changelogFile: process.env.CHANGELOG_FILE ?? 'CHANGELOG.md',
  refName: process.env.REF_NAME ?? 'main',
  overrideTag: (process.env.OVERRIDE_TAG ?? 'true') === 'true',
  bumpNpm: (process.env.BUMP_NPM ?? 'false') === 'true',
  bumpClaude: (process.env.BUMP_CLAUDE ?? 'false') === 'true',
  tagPrefix: process.env.TAG_PREFIX ?? 'v',
};

export class BumpFactory {
  static make(bumpers: Array<Bumpers>): BumpCommand {
    const cwd = process.cwd();
    const childProcessService = new ChildProcessService(cwd);

    const bumperImplementations: Bumper[] = [
      new ClaudeService(cwd),
      new NpmService(childProcessService),
    ].filter(bumper => bumpers.includes(bumper.name));

    const gitService = new GitService(childProcessService);
    const semverService = new SemverService(cwd, gitService);
    const ghService = new GhService(cwd, childProcessService);
    const changelogService = new ChangelogService(cwd, gitService, ghService);

    return new BumpCommand(
      bumperImplementations,
      semverService,
      changelogService,
    );
  }
}

void (async () => {
  try {
    const bumpers: Array<Bumpers> = [];
    if (inputs.bumpNpm) bumpers.push('npm');
    if (inputs.bumpClaude) bumpers.push('claude');
    const bumpCommand = BumpFactory.make(bumpers);

    const {version, tag, tagMajor, tagMinor} = bumpCommand.run(inputs);

    process.stdout.write(`${version}\n`);
    process.stdout.write(`${tag}\n`);
    process.stdout.write(`${tagMajor}\n`);
    process.stdout.write(`${tagMinor}\n`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '🚫 Unexpected error\n';

    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
})();
