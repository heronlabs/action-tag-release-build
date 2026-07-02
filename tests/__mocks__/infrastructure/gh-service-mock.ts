import {Mock} from 'moq.ts';

import {GhService} from '../../../src/infrastructure/gh/gh-service';

export const ghServiceMock = {
  createRelease: vi.fn(),
};

export const ghServiceMoq = new Mock<GhService>()
  .setup(x => x.createRelease)
  .returns(ghServiceMock.createRelease)
  .object();
