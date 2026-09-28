#!/usr/bin/env node

import * as core from '@actions/core';

import {CliFactory} from './application/action/action-factory';
import {Inputs} from './application/action/command/types/inputs';
import {Bumper} from './core/interfaces/bumper';

export const InputDefaults = {
  workingDirectory: '.',
  overrideTag: true,
  tagPrefix: 'v',
  versionFile: 'version.txt',
  changelogFile: 'CHANGELOG.md',
  bumpNpm: false,
  bumpClaude: false,
  pluginDir: '.claude-plugin',
  mergeCommit: false,
  onlySync: false,
} as const;

type Defaults = typeof InputDefaults;
type InputOf<T> = {
  [K in keyof Defaults]: Defaults[K] extends T ? K : never;
}[keyof Defaults];

const input = (name: InputOf<string>) =>
  core.getInput(name) || InputDefaults[name];

const booleanInput = (name: InputOf<boolean>) =>
  core.getInput(name) ? core.getBooleanInput(name) : InputDefaults[name];

try {
  process.chdir(input('workingDirectory'));

  process.env.GH_TOKEN = core.getInput('ghToken', {required: true});

  const cliFactory = CliFactory.make(process.cwd());

  const bumpers: Bumper[] = [];

  const bumpNpm = booleanInput('bumpNpm');
  if (bumpNpm) bumpers.push(cliFactory.coreFactory.getNpmService());

  const bumpClaude = booleanInput('bumpClaude');
  if (bumpClaude) {
    const pluginDir = input('pluginDir');
    bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
  }

  const command = cliFactory.getBumpCommand(bumpers);

  const inputs: Inputs = {
    semantic: core.getInput('semantic') || undefined,
    versionFile: input('versionFile'),
    changelogFile: input('changelogFile'),
    ref: process.env.GITHUB_REF_NAME || 'main',
    overrideTag: booleanInput('overrideTag'),
    tagPrefix: input('tagPrefix'),
    target: core.getInput('target') || undefined,
    mergeCommit: booleanInput('mergeCommit'),
    onlySync: booleanInput('onlySync'),
  };

  const {version, tag, tagMajor, tagMinor, releasedRefs} = command.run(inputs);

  core.setOutput('version', version);
  core.setOutput('tag', tag);
  core.setOutput('tagMajor', tagMajor);
  core.setOutput('tagMinor', tagMinor);
  core.setOutput('releasedRefs', JSON.stringify(releasedRefs));
} catch (error) {
  core.setFailed(error instanceof Error ? error : String(error));
}
