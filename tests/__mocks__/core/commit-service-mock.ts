import {Mock} from 'moq.ts';

import {CommitService} from '../../../src/core/services/commit-service';

export const CommitServiceMock = {
  parseDescriptionSince: vi.fn(),
  classifyLastCommit: vi.fn(),
};

export const CommitServiceMoq = new Mock<CommitService>()
  .setup(x => x.parseDescriptionSince)
  .returns(CommitServiceMock.parseDescriptionSince)
  .setup(x => x.classifyLastCommit)
  .returns(CommitServiceMock.classifyLastCommit)
  .object();
