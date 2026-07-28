import {Mock} from 'moq.ts';

import {PullRequestService} from '../../../src/infrastructure/gh/services/pull-request-service';

export const PullRequestServiceMock = {
  hasPullRequest: vi.fn(),
  createPullRequest: vi.fn(),
};

export const PullRequestServiceMoq = new Mock<PullRequestService>()
  .setup(x => x.hasPullRequest)
  .returns(PullRequestServiceMock.hasPullRequest)
  .setup(x => x.createPullRequest)
  .returns(PullRequestServiceMock.createPullRequest)
  .object();
