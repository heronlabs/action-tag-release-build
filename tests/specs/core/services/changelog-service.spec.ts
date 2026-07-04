import {existsSync, readFileSync, writeFileSync} from 'node:fs';

import {faker} from '@faker-js/faker';

import {ChangelogService} from '../../../../src/core/services/changelog-service';
import {
  CommitServiceMock,
  CommitServiceMoq,
} from '../../../__mocks__/core/commit-service-mock';
import {
  GhServiceMock,
  GhServiceMoq,
} from '../../../__mocks__/infrastructure/gh-service-mock';
import {
  GitServiceMock,
  GitServiceMoq,
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
    service = new ChangelogService(
      cwd,
      GitServiceMoq,
      GhServiceMoq,
      CommitServiceMoq,
    );
  });

  it('Should generate release notes on empty changelog and github with conventional commits', () => {
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: 'scope',
          breaking: true,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          breaking: true,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'other',
          breaking: false,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'other',
          breaking: false,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'other',
          breaking: false,
          description: '__foo__',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'other',
          breaking: false,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce('# Changelog');
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    GhServiceMock.createRelease.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: {},
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: 'scope',
          breaking: true,
          description: 'add some feature',
        },
      ],
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: 'scope',
          breaking: true,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const error = new Error(faker.lorem.sentence());
    GitServiceMock.apply.mockReturnValueOnce({
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
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: 'scope',
          breaking: true,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    const error = new Error(faker.lorem.sentence());
    GhServiceMock.createRelease.mockReturnValueOnce({
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

  it('Should throw error github release and rollback without tags', () => {
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: 'scope',
          breaking: true,
          description: 'add some feature',
        },
      ],
    });

    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    GitServiceMock.apply.mockReturnValueOnce({
      ok: true,
    });

    const error = new Error(faker.lorem.sentence());
    GhServiceMock.createRelease.mockReturnValueOnce({
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
      overrideTag: false,
    };
    const output = service.applyReleaseChangelog(inputs);

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
