export type Inputs = {
  readonly semantic?: string;
  readonly versionFile: string;
  readonly changelogFile: string;
  readonly ref: string;
  readonly overrideTag: boolean;
  readonly tagPrefix: string;
  readonly target?: string;
  readonly mergeCommit?: boolean;
  readonly onlySync?: boolean;
};
