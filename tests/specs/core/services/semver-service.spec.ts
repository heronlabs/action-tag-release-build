import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {faker} from '@faker-js/faker';

import {SemverService} from '../../../../src/core/services/semver-service';
import {
  CommitServiceMock,
  CommitServiceMoq,
} from '../../../__mocks__/core/commit-service-mock';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('Given a semver service', () => {
  const cwd = faker.system.directoryPath();
  let service: SemverService;

  beforeEach(() => {
    service = new SemverService(cwd, CommitServiceMoq);
  });

  it('Should calculate next version using explicit major semantic input', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'major');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '2.0.0',
        major: '2',
        minor: '0',
        patch: '0',
      },
    });
  });

  it('Should calculate next version using explicit minor semantic input', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'minor');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.3.0',
        major: '1',
        minor: '3',
        patch: '0',
      },
    });
  });

  it('Should calculate next version using explicit patch semantic input', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'patch');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.2.4',
        major: '1',
        minor: '2',
        patch: '4',
      },
    });
  });

  it('Should calculate next version based on last commmit for major', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    CommitServiceMock.classifyLastCommit.mockReturnValueOnce({
      ok: true,
      data: 'major',
    });

    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '2.0.0',
        major: '2',
        minor: '0',
        patch: '0',
      },
    });
  });

  it('Should calculate next version based on last commmit for minor', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    CommitServiceMock.classifyLastCommit.mockReturnValueOnce({
      ok: true,
      data: 'minor',
    });

    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.3.0',
        major: '1',
        minor: '3',
        patch: '0',
      },
    });
  });

  it('Should throw version file not found error', () => {
    const error = new Error(faker.lorem.sentence());
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      throw error;
    });

    const versionFile = faker.string.alpha();
    const output = service.calculateNextVersion(versionFile, 'major');

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw empty version file error', () => {
    const versionFileContent = '';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const versionFile = faker.string.alpha();
    const output = service.calculateNextVersion(versionFile, 'major');

    const path = join(cwd, versionFile);
    expect(output).toStrictEqual({
      ok: false,
      error: new Error(`version file '${path}' is empty`),
    });
  });

  it('Should throw error for invalid semantic', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const semantic = faker.string.alpha();
    const output = service.calculateNextVersion('version.txt', semantic);

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(`invalid semantic: '${semantic}'`),
    });
  });

  it('Should throw error for getting last commit', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const error = new Error(faker.lorem.sentence());
    CommitServiceMock.classifyLastCommit.mockReturnValueOnce({
      ok: false,
      error,
    });

    const output = service.calculateNextVersion('version.txt');

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error when calculating semantic', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const error = new Error(faker.lorem.sentence());
    vi.spyOn(globalThis, 'parseInt').mockImplementationOnce(() => {
      throw error;
    });

    const output = service.calculateNextVersion('version.txt', 'major');

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error when setting next version', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const error = new Error(faker.lorem.sentence());
    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw error;
    });

    const output = service.calculateNextVersion('version.txt', 'major');

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
