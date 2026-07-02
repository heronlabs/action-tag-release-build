import {Mock} from 'moq.ts';

import {GitService} from '../../../src/infrastructure/git/git-service';

export const gitServiceMock = {
  getCommits: vi.fn(),
  apply: vi.fn(),
  rollbackFireForget: vi.fn(),
};

export const gitServiceMoq = new Mock<GitService>()
  .setup(x => x.getCommits)
  .returns(gitServiceMock.getCommits)
  .setup(x => x.apply)
  .returns(gitServiceMock.apply)
  .setup(x => x.rollbackFireForget)
  .returns(gitServiceMock.rollbackFireForget)
  .object();
