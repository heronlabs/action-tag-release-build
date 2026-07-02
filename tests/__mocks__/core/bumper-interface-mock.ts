import {Mock} from 'moq.ts';

import {Bumper} from '../../../src/core/interfaces/bumper';

export const BumperMock = {
  bump: vi.fn(),
};

export const BumperMoq = new Mock<Bumper>()
  .setup(x => x.bump)
  .returns(BumperMock.bump)
  .object();
