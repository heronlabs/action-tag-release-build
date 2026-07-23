#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const action_factory_1 = require("./application/action/action-factory");
const optionalInput = (name) => core.getInput(name) || undefined;
try {
    process.chdir(core.getInput('workingDirectory'));
    process.env.GH_TOKEN = core.getInput('ghToken', { required: true });
    const cliFactory = action_factory_1.CliFactory.make(process.cwd());
    const bumpers = [];
    const bumpNpm = core.getBooleanInput('bumpNpm');
    if (bumpNpm)
        bumpers.push(cliFactory.coreFactory.getNpmService());
    const bumpClaude = core.getBooleanInput('bumpClaude');
    if (bumpClaude) {
        const pluginDir = core.getInput('pluginDir');
        bumpers.push(cliFactory.coreFactory.getClaudeService(pluginDir));
    }
    const command = cliFactory.getBumpCommand(bumpers);
    const inputs = {
        semantic: optionalInput('semantic'),
        versionFile: core.getInput('versionFile'),
        changelogFile: core.getInput('changelogFile'),
        refName: process.env.GITHUB_REF_NAME || 'main',
        overrideTag: core.getBooleanInput('overrideTag'),
        tagPrefix: core.getInput('tagPrefix'),
        target: optionalInput('target'),
        mergeMessage: optionalInput('mergeMessage'),
    };
    const { version, tag, tagMajor, tagMinor } = command.run(inputs);
    core.setOutput('version', version);
    core.setOutput('tag', tag);
    core.setOutput('tagMajor', tagMajor);
    core.setOutput('tagMinor', tagMinor);
}
catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
}
//# sourceMappingURL=index.js.map