import {Mock} from 'moq.ts';

import {ChangelogService} from '../../../src/core/services/changelog-service';

export const ChangelogServiceMock = {
  applyReleaseChangelog: vi.fn(),
};

export const ChangelogServiceMoq = new Mock<ChangelogService>()
  .setup(x => x.applyReleaseChangelog)
  .returns(ChangelogServiceMock.applyReleaseChangelog)
  .object();
