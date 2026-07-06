import { CommitType } from './commit-types';
export type ParsedCommit = {
    type: CommitType;
    scope?: string;
    breaking: boolean;
    description: string;
};
export type ParsedDescription = {
    hash: string;
} & ParsedCommit;
//# sourceMappingURL=parsed-commit.d.ts.map