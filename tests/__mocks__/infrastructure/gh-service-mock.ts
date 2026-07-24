import {Mock} from 'moq.ts';

import {GhService} from '../../../src/infrastructure/gh/services/gh-service';

export const GhServiceMock = {
  createRelease: vi.fn(),
};

export const GhServiceMoq = new Mock<GhService>()
  .setup(x => x.createRelease)
  .returns(GhServiceMock.createRelease)
  .object();
