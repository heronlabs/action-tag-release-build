import {Mock} from 'moq.ts';

import {ChildProcessService} from '../../../src/infrastructure/terminal/services/child-process-service';

export const ChildProcessServiceMock = {
  exec: vi.fn(),
  execChain: vi.fn(),
};

export const ChildProcessServiceMoq = new Mock<ChildProcessService>()
  .setup(x => x.exec)
  .returns(ChildProcessServiceMock.exec)
  .setup(x => x.execChain)
  .returns(ChildProcessServiceMock.execChain)
  .object();
