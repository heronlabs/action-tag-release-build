import {Mock} from 'moq.ts';

import {GitService} from '../../../src/infrastructure/git/services/git-service';

export const GitServiceMock = {
  getDescriptionSince: vi.fn(),
  getLastCommit: vi.fn(),
  apply: vi.fn(),
  mergeWithoutCommit: vi.fn(),
};

export const GitServiceMoq = new Mock<GitService>()
  .setup(x => x.getDescriptionSince)
  .returns(GitServiceMock.getDescriptionSince)
  .setup(x => x.getLastCommit)
  .returns(GitServiceMock.getLastCommit)
  .setup(x => x.applyTags)
  .returns(GitServiceMock.apply)
  .setup(x => x.mergeWithoutCommit)
  .returns(GitServiceMock.mergeWithoutCommit)
  .object();
