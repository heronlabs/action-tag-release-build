import {Mock} from 'moq.ts';

import {MergeService} from '../../../src/infrastructure/gh/services/merge-service';

export const MergeServiceMock = {
  mergeWithCommit: vi.fn(),
  mergeWithoutCommit: vi.fn(),
};

export const MergeServiceMoq = new Mock<MergeService>()
  .setup(x => x.mergeWithCommit)
  .returns(MergeServiceMock.mergeWithCommit)
  .setup(x => x.mergeWithoutCommit)
  .returns(MergeServiceMock.mergeWithoutCommit)
  .object();
