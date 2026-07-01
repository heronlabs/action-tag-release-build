export interface BumpInputs {
  readonly semantic: string;
  readonly versionFile: string;
  readonly changelogFile: string;
  readonly refName: string;
  readonly overrideTag: boolean;
  readonly bumpNpm: boolean;
  readonly bumpClaude: boolean;
  readonly tagPrefix: string;
}
