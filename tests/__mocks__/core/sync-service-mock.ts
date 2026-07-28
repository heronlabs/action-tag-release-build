import {Mock} from 'moq.ts';

import {SyncService} from '../../../src/core/services/sync-service';

export const SyncServiceMock = {
  cascadeEnvironments: vi.fn(),
};

export const SyncServiceMoq = new Mock<SyncService>()
  .setup(x => x.cascadeEnvironments)
  .returns(SyncServiceMock.cascadeEnvironments)
  .object();
