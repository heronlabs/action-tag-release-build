export type BumpInputs = {
  readonly semantic: string;
  readonly versionFile: string;
  readonly changelogFile: string;
  readonly refName: string;
  readonly overrideTag: boolean;
  readonly tagPrefix: string;
  readonly target?: string;
  readonly mergeMessage?: string;
};
