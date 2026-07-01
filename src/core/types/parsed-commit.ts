export type ParsedCommit = {
  hash: string;
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
};
