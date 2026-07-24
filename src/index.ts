#!/usr/bin/env node

import * as core from '@actions/core';

import {CliFactory} from './application/action/action-factory';
import {Inputs} from './application/action/command/types/inputs';
import {Bumper} from './core/interfaces/bumper';

try {
  process.chdir(core.getInput('workingDirectory', {required: true}));

  process.env.GH_TOKEN = core.getInput('ghToken', {required: true});

  const cliFactory = CliFactory.make(process.cwd());

  const bumpers: Bumper[] = [];

  const bumpNpm = core.getBooleanInput('bumpNpm', {required: true});
  if (bumpNpm) bumpers.push(cliFactory.coreFactory.getNpmService());

  const bumpClaude = core.getBooleanInput('bumpClaude', {required: true});
  if (bumpClaude) {
    const pluginDir = core.getInput('pluginDir', {required: true});
    bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
  }

  const command = cliFactory.getBumpCommand(bumpers);

  const inputs: Inputs = {
    semantic: core.getInput('semantic') || undefined,
    versionFile: core.getInput('versionFile', {required: true}),
    changelogFile: core.getInput('changelogFile', {required: true}),
    refName: process.env.GITHUB_REF_NAME || 'main',
    overrideTag: core.getBooleanInput('overrideTag', {required: true}),
    tagPrefix: core.getInput('tagPrefix', {required: true}),
    target: core.getInput('target') || undefined,
    mergeMessage: core.getInput('mergeMessage') || undefined,
  };
  const {version, tag, tagMajor, tagMinor} = command.run(inputs);

  core.setOutput('version', version);
  core.setOutput('tag', tag);
  core.setOutput('tagMajor', tagMajor);
  core.setOutput('tagMinor', tagMinor);
} catch (error) {
  core.setFailed(error instanceof Error ? error : String(error));
}
