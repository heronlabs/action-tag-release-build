import {Mock} from 'moq.ts';

import {GitService} from '../../../src/infrastructure/git/services/git-service';

export const GitServiceMock = {
  getDescriptionSince: vi.fn(),
  apply: vi.fn(),
  resetToRemote: vi.fn(),
};

export const GitServiceMoq = new Mock<GitService>()
  .setup(x => x.getDescriptionSince)
  .returns(GitServiceMock.getDescriptionSince)
  .setup(x => x.applyTags)
  .returns(GitServiceMock.apply)
  .setup(x => x.resetToRemote)
  .returns(GitServiceMock.resetToRemote)
  .object();
