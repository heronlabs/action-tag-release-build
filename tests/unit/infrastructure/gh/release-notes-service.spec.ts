import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {faker} from '@faker-js/faker';

import {ReleaseNotesService} from '../../../../src/infrastructure/gh/services/release-notes-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

describe('Given a release notes service', () => {
  const cwd = faker.system.directoryPath();
  let service: ReleaseNotesService;

  beforeEach(() => {
    service = new ReleaseNotesService(cwd, ChildProcessServiceMoq);
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

  it('Should write release notes to correct temp file path with encoding', () => {
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const tag = faker.string.alpha(2);
    const releaseNotes = faker.lorem.paragraph();
    service.createRelease(tag, releaseNotes);

    const expectedPath = join(cwd, '.release-notes.tmp.md');
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedPath,
      releaseNotes,
      'utf8',
    );
  });

  it('Should call release notes create with correct command', () => {
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const tag = faker.string.alpha(2);
    const releaseNotes = faker.lorem.paragraph();
    service.createRelease(tag, releaseNotes);

    const expectedPath = join(cwd, '.release-notes.tmp.md');
    expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith(
      `gh release create "${tag}" --title "${tag}" --notes-file "${expectedPath}"`,
    );
  });

  it('Should return error creating release notes tmp file', () => {
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
