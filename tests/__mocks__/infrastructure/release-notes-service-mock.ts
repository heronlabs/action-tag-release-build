import {Mock} from 'moq.ts';

import {ReleaseNotesService} from '../../../src/infrastructure/gh/services/release-notes-service';

export const ReleaseNotesServiceMock = {
  createRelease: vi.fn(),
};

export const ReleaseNotesServiceMoq = new Mock<ReleaseNotesService>()
  .setup(x => x.createRelease)
  .returns(ReleaseNotesServiceMock.createRelease)
  .object();
