#!/usr/bin/env node

import * as core from '@actions/core';

import {CliFactory} from './application/action/action-factory';
import {InputDefaults, Inputs} from './application/action/command/types/inputs';
import {Bumper} from './core/interfaces/bumper';

type Defaults = typeof InputDefaults;
type InputOf<T> = {
  [K in keyof Defaults]: Defaults[K] extends T ? K : never;
}[keyof Defaults];

// action.yml declares no `default:`, so every optional input arrives empty when the caller
// omits it or passes an explicit empty string. Both cases fall back to InputDefaults instead
// of reaching the command empty (or throwing, for boolean inputs).
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
