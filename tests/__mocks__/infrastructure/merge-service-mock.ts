import {Mock} from 'moq.ts';

import {MergeService} from '../../../src/infrastructure/gh/services/merge-service';

export const MergeServiceMock = {
  mergeWithCommit: vi.fn(),
};

export const MergeServiceMoq = new Mock<MergeService>()
  .setup(x => x.mergeWithCommit)
  .returns(MergeServiceMock.mergeWithCommit)
  .object();
