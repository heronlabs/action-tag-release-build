export const CommitTypeLabels = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  revert: 'Reverts',
  docs: 'Documentation',
  deps: 'Dependencies',
  other: 'Miscellaneous Chores',
} as const;

export type CommitType = keyof typeof CommitTypeLabels;
