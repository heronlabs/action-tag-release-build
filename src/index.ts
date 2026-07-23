#!/usr/bin/env node

import * as core from '@actions/core';

import {CliFactory} from './application/action/action-factory';
import {Inputs} from './application/action/command/types/inputs';
import {Bumper} from './core/interfaces/bumper';

const optionalInput = (name: string): string | undefined =>
  core.getInput(name) || undefined;

try {
  process.chdir(core.getInput('workingDirectory'));

  process.env.GH_TOKEN = core.getInput('ghToken', {required: true});

  const cliFactory = CliFactory.make(process.cwd());

  const bumpers: Bumper[] = [];

  const bumpNpm = core.getBooleanInput('bumpNpm');
  if (bumpNpm) bumpers.push(cliFactory.coreFactory.getNpmService());

  const bumpClaude = core.getBooleanInput('bumpClaude');
  if (bumpClaude) {
    const pluginDir = core.getInput('pluginDir');
    bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
  }

  const command = cliFactory.getBumpCommand(bumpers);

  const inputs: Inputs = {
    semantic: optionalInput('semantic'),
    versionFile: core.getInput('versionFile'),
    changelogFile: core.getInput('changelogFile'),
    refName: process.env.GITHUB_REF_NAME || 'main',
    overrideTag: core.getBooleanInput('overrideTag'),
    tagPrefix: core.getInput('tagPrefix'),
    target: optionalInput('target'),
    mergeMessage: optionalInput('mergeMessage'),
  };
  const {version, tag, tagMajor, tagMinor} = command.run(inputs);

  core.setOutput('version', version);
  core.setOutput('tag', tag);
  core.setOutput('tagMajor', tagMajor);
  core.setOutput('tagMinor', tagMinor);
} catch (error) {
  core.setFailed(error instanceof Error ? error : String(error));
}
