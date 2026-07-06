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

  it('Should calculate next version with version prefix', () => {
    const versionFileContent = 'v1.2.3';
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

  it('Should calculate next version with single digit version defaulting missing parts', () => {
    const versionFileContent = '1';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'minor');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.1.0',
        major: '1',
        minor: '1',
        patch: '0',
      },
    });
  });

  it('Should calculate next version with single digit version defaulting patch', () => {
    const versionFileContent = '1';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'patch');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.0.1',
        major: '1',
        minor: '0',
        patch: '1',
      },
    });
  });

  it('Should calculate next version with multiple prefix characters', () => {
    const versionFileContent = 'vv1.2.3';
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

  it('Should return error for version with no numeric part', () => {
    const versionFileContent = 'v';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const output = service.calculateNextVersion('version.txt', 'major');

    expect(output).toStrictEqual({
      ok: false,
      error: new Error("version 'v' has no numeric part"),
    });
  });

  it('Should return error for whitespace-only version file content', () => {
    const versionFileContent = '   \n  ';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);

    const versionFile = faker.string.alpha();
    const output = service.calculateNextVersion(versionFile, 'major');

    const path = join(cwd, versionFile);

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(`version file '${path}' is empty`),
    });
  });

  it('Should calculate next version with two digit version defaulting missing patch', () => {
    const versionFileContent = '1.2';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.calculateNextVersion('version.txt', 'patch');

    expect(output).toStrictEqual({
      ok: true,
      data: {
        nextVersion: '1.2.1',
        major: '1',
        minor: '2',
        patch: '1',
      },
    });
  });

  it('Should read version file with utf8 encoding and trim', () => {
    const versionFileContent = '  1.2.3  \n';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    service.calculateNextVersion('version.txt', 'major');

    const path = join(cwd, 'version.txt');
    expect(readFileSync).toHaveBeenCalledWith(path, 'utf8');
  });

  it('Should write version file with newline', () => {
    const versionFileContent = '1.2.3';
    vi.mocked(readFileSync).mockReturnValueOnce(versionFileContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    service.calculateNextVersion('version.txt', 'major');

    const path = join(cwd, 'version.txt');
    expect(writeFileSync).toHaveBeenCalledWith(path, '2.0.0\n');
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

  it('Should return error version file not found error', () => {
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

  it('Should return error empty version file error', () => {
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

  it('Should return error error for invalid semantic', () => {
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

  it('Should return error error for getting last commit', () => {
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

  it('Should return error error when calculating semantic', () => {
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

  it('Should return error error when setting next version', () => {
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
