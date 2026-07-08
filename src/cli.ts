#!/usr/bin/env node

import {BumpCommand} from './application/cli/bump-command';
import {BumpInputs} from './application/cli/types/input-bump';
import {Bumper} from './core/interfaces/bumper';
import {ClaudeService} from './core/services/bumpers/claude-bumper-service';
import {NpmService} from './core/services/bumpers/npm-bumper-service';
import {ChangelogService} from './core/services/changelog-service';
import {CommitService} from './core/services/commit-service';
import {SemverService} from './core/services/semver-service';
import {GhService} from './infrastructure/gh/gh-service';
import {GitService} from './infrastructure/git/git-service';
import {ChildProcessService} from './infrastructure/terminal/child-process-service';

export class CommandsFactory {
  static makeBump(): BumpCommand {
    const cwd = process.cwd();
    const childProcessService = new ChildProcessService(cwd);

    const gitService = new GitService(childProcessService);
    const commitService = new CommitService(gitService);
    const semverService = new SemverService(cwd, commitService);
    const ghService = new GhService(cwd, childProcessService);
    const changelogService = new ChangelogService(
      cwd,
      gitService,
      ghService,
      commitService,
    );

    const bumpers: Bumper[] = [];

    const bumpNpm = (process.env.BUMP_NPM ?? 'false') === 'true';
    if (bumpNpm) bumpers.push(new NpmService(childProcessService));

    const bumpClaude = (process.env.BUMP_CLAUDE ?? 'false') === 'true';
    if (bumpClaude) {
      const pluginDir = process.env.PLUGIN_DIR ?? '.claude-plugin';
      bumpers.push(new ClaudeService(cwd, pluginDir));
    }

    return new BumpCommand(bumpers, semverService, changelogService);
  }
}

void (async () => {
  try {
    const bumpCommand = CommandsFactory.makeBump();

    const inputs: BumpInputs = {
      semantic: process.env.SEMANTIC ?? '',
      versionFile: process.env.VERSION_FILE ?? 'version.txt',
      changelogFile: process.env.CHANGELOG_FILE ?? 'CHANGELOG.md',
      refName: process.env.REF_NAME ?? 'main',
      overrideTag: (process.env.OVERRIDE_TAG ?? 'true') === 'true',
      tagPrefix: process.env.TAG_PREFIX ?? 'v',
    };

    const {version, tag, tagMajor, tagMinor} = bumpCommand.run(inputs);

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
