import {CommitType} from './commit-types';

export type ParsedCommit = {
  type: CommitType;
  scope?: string;
  breaking: boolean;
  breakingDescription?: string;
  description: string;
};

export type ParsedDescription = {
  hash: string;
} & ParsedCommit;
