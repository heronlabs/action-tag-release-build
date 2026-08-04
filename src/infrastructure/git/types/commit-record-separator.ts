/**
 * ASCII Record Separator (0x1E) emitted by `git log --pretty` as `%x1e`.
 * Commit bodies span multiple lines, so records cannot be split on newlines.
 */
export const COMMIT_RECORD_SEPARATOR = '\x1e';
