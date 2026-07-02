import {existsSync, readFileSync, writeFileSync} from 'node:fs';

import {faker} from '@faker-js/faker';

import {ChangelogService} from '../../../../src/core/services/changelog-service';
import {
  ghServiceMock,
  ghServiceMoq,
} from '../../../__mocks__/infrastructure/gh-service-mock';
import {
  gitServiceMock,
  gitServiceMoq,
} from '../../../__mocks__/infrastructure/git-service-mock';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('Given a changelog service', () => {
  const cwd = faker.system.directoryPath();
  let service: ChangelogService;

  beforeEach(() => {
    service = new ChangelogService(cwd, gitServiceMoq, ghServiceMoq);
  });

  it('Should generate release notes on empty changelog and github with conventional commits', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat(scope)!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should generate release notes on empty changelog and github with conventional commits without scope', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should generate release notes on empty changelog and github with different conventional commits', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} ci: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should generate release notes on empty changelog and github without conventional commits', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should generate release notes on empty changelog and github with edge case commit', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} __foo__`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should generate release notes on existing changelog and github without conventional commits', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce('# Changelog');
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: true,
      data: '',
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: true,
      data: {
        tag: `${inputs.tagPrefix}${inputs.nextVersion}`,
        tagMajor: `${inputs.tagPrefix}${inputs.major}`,
        tagMinor: `${inputs.tagPrefix}${inputs.major}.${inputs.minor}`,
      },
    });
  });

  it('Should throw error getting last commits', () => {
    const error = new Error(faker.lorem.sentence());
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error getting creating release notes', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: [],
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error: expect.any(Error),
    });
  });

  it('Should throw error writing changelog', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat(scope)!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);

    const error = new Error(faker.lorem.sentence());
    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw error;
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error applying git changes', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat(scope)!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const error = new Error(faker.lorem.sentence());
    gitServiceMock.apply.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error github release and rollback with tags', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat(scope)!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    const error = new Error(faker.lorem.sentence());
    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: false,
      error,
    });

    gitServiceMock.rollbackFireForget.mockReturnValueOnce({
      ok: true,
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: true,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });

  it('Should throw error github release and rollback without tags', () => {
    gitServiceMock.getCommits.mockReturnValueOnce({
      ok: true,
      data: `${faker.string.alpha(40)} feat(scope)!: add some feature`,
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    gitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    const error = new Error(faker.lorem.sentence());
    ghServiceMock.createRelease.mockReturnValueOnce({
      ok: false,
      error,
    });

    gitServiceMock.rollbackFireForget.mockReturnValueOnce({
      ok: true,
    });

    const inputs = {
      tagPrefix: faker.string.alpha(),
      nextVersion: faker.system.semver(),
      major: faker.string.alpha(),
      minor: faker.string.alpha(),
      changelogFile: `${faker.string.alpha()}.md`,
      refName: faker.string.alpha(),
      overrideTag: false,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
