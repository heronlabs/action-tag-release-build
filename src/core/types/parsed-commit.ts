export const COMMIT_TYPE_LABELS = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  revert: 'Reverts',
  docs: 'Documentation',
  deps: 'Dependencies',
  other: 'Miscellaneous Chores',
} as const;

export type CommitType = keyof typeof COMMIT_TYPE_LABELS;

export type ParsedCommit = {
  hash: string;
  type: CommitType;
  scope?: string;
  breaking: boolean;
  description: string;
};
