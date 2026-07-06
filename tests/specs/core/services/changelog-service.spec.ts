import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

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

  it('Should return error getting last commits', () => {
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

  it('Should return error getting creating release notes', () => {
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

  it('Should return error writing changelog', () => {
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

  it('Should return error applying git changes', () => {
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

  it('Should return error github release and rollback with tags', () => {
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

  it('Should return error github release and rollback without tags', () => {
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

  it('Should write breaking entry with scope in parentheses', () => {
    const commitHash = faker.string.alpha(40);
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: commitHash,
          type: 'fix',
          scope: 'my-scope',
          breaking: true,
          description: 'critical fix',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringContaining(`* fix(my-scope)!: critical fix (${commitHash})`),
    );
  });

  it('Should write breaking entry without scope and no parentheses', () => {
    const commitHash = faker.string.alpha(40);
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: commitHash,
          type: 'fix',
          scope: undefined,
          breaking: true,
          description: 'critical fix',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringContaining(`* fix!: critical fix (${commitHash})`),
    );
  });

  it('Should not contain Stryker artifacts in release notes', () => {
    const commitHash = faker.string.alpha(40);
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: commitHash,
          type: 'fix',
          scope: undefined,
          breaking: true,
          description: 'critical fix',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.not.stringContaining('Stryker was here'),
    );
  });

  it('Should write empty release notes when no commits exist', () => {
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.not.stringContaining('### '),
    );
  });

  it('Should separate multiple entries in same section with newline', () => {
    const firstHash = faker.string.alpha(40);
    const secondHash = faker.string.alpha(40);
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: firstHash,
          type: 'feat',
          scope: undefined,
          breaking: false,
          description: 'first feature',
        },
        {
          hash: secondHash,
          type: 'feat',
          scope: undefined,
          breaking: false,
          description: 'second feature',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringContaining(
        `* feat: first feature (${firstHash})\n* feat: second feature (${secondHash})`,
      ),
    );
  });

  it('Should include breaking change marker in features section', () => {
    const commitHash = faker.string.alpha(40);
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: commitHash,
          type: 'feat',
          scope: 'api',
          breaking: true,
          description: 'breaking feature',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringContaining(`* feat(api)!: breaking feature (${commitHash})`),
    );
  });

  it('Should include changelog header with date in written content', () => {
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'fix',
          scope: undefined,
          breaking: false,
          description: 'bug fix',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringMatching(/^## v1\.0\.0 \(\d{4}-\d{2}-\d{2}\)\n\n/),
    );
  });

  it('Should not include breaking changes section for non-breaking commits', () => {
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'feat',
          scope: undefined,
          breaking: false,
          description: 'simple feature',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.not.stringContaining('### ⚠ BREAKING CHANGES'),
    );
  });

  it('Should prepend new entry before existing changelog content', () => {
    const existingContent = '# Old Changelog';
    CommitServiceMock.parseDescriptionSince.mockReturnValueOnce({
      ok: true as const,
      data: [
        {
          hash: faker.string.alpha(40),
          type: 'fix',
          scope: undefined,
          breaking: false,
          description: 'bug fix',
        },
      ],
    });
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(existingContent);
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});
    GitServiceMock.apply.mockReturnValueOnce({ok: true});
    GhServiceMock.createRelease.mockReturnValueOnce({ok: true, data: ''});

    service.applyReleaseChangelog({
      tagPrefix: 'v',
      nextVersion: '1.0.0',
      major: '1',
      minor: '0',
      changelogFile: 'CHANGELOG.md',
      refName: 'main',
      overrideTag: false,
    });

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'CHANGELOG.md'),
      expect.stringContaining(existingContent),
    );
  });
});
