import {writeFileSync} from 'node:fs';

import {faker} from '@faker-js/faker';

import {GhService} from '../../../../src/infrastructure/gh/gh-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

describe('Given a gh service', () => {
  const cwd = faker.system.directoryPath();
  let service: GhService;

  beforeEach(() => {
    service = new GhService(cwd, ChildProcessServiceMoq);
  });

  it('Should create release notes based on tmp file', () => {
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const tag = faker.string.alpha(2);
    const releaseNotes = faker.lorem.paragraph();
    const output = service.createRelease(tag, releaseNotes);

    expect(output).toStrictEqual({
      ok: true,
      data: 'OK',
    });
  });

  it('Should throw error creating release notes tmp file', () => {
    const error = new Error(faker.lorem.sentence());
    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw error;
    });

    const tag = faker.string.alpha(2);
    const releaseNotes = faker.lorem.paragraph();
    const output = service.createRelease(tag, releaseNotes);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
