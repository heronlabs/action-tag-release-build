// Sole authority for the action input defaults: action.yml declares no `default:`, so an
// omitted input and one passed as an explicit empty string both land here (see src/index.ts).
// The action.yml descriptions restate these values for the Marketplace listing — update them
// alongside. semantic and target are absent on purpose: empty means "not supplied" for those.
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
} as const;

export type Inputs = {
  readonly semantic?: string;
  readonly versionFile: string;
  readonly changelogFile: string;
  readonly ref: string;
  readonly overrideTag: boolean;
  readonly tagPrefix: string;
  readonly target?: string;
  readonly mergeCommit?: boolean;
};
