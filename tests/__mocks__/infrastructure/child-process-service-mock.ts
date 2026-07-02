import {Mock} from 'moq.ts';

import {ChildProcessService} from '../../../src/infrastructure/terminal/child-process-service';

export const childProcessServiceMock = {
  exec: vi.fn(),
};

export const childProcessServiceMoq = new Mock<ChildProcessService>()
  .setup(x => x.exec)
  .returns(childProcessServiceMock.exec)
  .object();
