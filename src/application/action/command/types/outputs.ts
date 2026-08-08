export type ReleasedRef = {
  readonly target: string;
  readonly sha: string;
};

export type Outputs = {
  readonly version: string;
  readonly tag: string;
  readonly tagMajor: string;
  readonly tagMinor: string;
  readonly releasedRefs: readonly ReleasedRef[];
};
