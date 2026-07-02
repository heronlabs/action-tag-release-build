import {Mock} from 'moq.ts';

import {SemverService} from '../../../src/core/services/semver-service';

export const SemverServiceMock = {
  calculateNextVersion: vi.fn(),
};

export const SemverServiceMoq = new Mock<SemverService>()
  .setup(x => x.calculateNextVersion)
  .returns(SemverServiceMock.calculateNextVersion)
  .object();
