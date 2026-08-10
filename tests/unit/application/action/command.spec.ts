import {faker} from '@faker-js/faker';

import {Command} from '../../../../src/application/action/command/command';
import {Inputs} from '../../../../src/application/action/command/types/inputs';
import {
  BumperMock,
  BumperMoq,
} from '../../../__mocks__/core/bumper-interface-mock';
import {
  ChangelogServiceMock,
  ChangelogServiceMoq,
} from '../../../__mocks__/core/changelog-service-mock';
import {
  SemverServiceMock,
  SemverServiceMoq,
} from '../../../__mocks__/core/semver-service-mock';
import {
  SyncServiceMock,
  SyncServiceMoq,
} from '../../../__mocks__/core/sync-service-mock';

describe('Given a bump command', () => {
  let command: Command;

  beforeEach(() => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    command = new Command(
      [BumperMoq],
      SemverServiceMoq,
      ChangelogServiceMoq,
      SyncServiceMoq,
    );
  });

  it('Should calculate next version without tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: false,
      tagPrefix,
    };

    const output = command.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
      releasedRefs: [{target: ref, sha}],
    });
  });

  it('Should apply calculate next version without tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
    };

    command.run(inputs);

    expect(ChangelogServiceMock.applyReleaseChangelog).toHaveBeenCalledWith({
      tagPrefix,
      nextVersion,
      major: major,
      minor: minor,
      changelogFile: 'CHANGELOG.md',
      ref: inputs.ref,
      overrideTag: false,
    });
  });

  it('Should log version calculate next version without tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      1,
      `✅ Bumper  ${nextVersion}\n`,
    );
  });

  it('Should log tag calculate next version without tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      2,
      `🏷️ Tagged: ${tag}\n`,
    );
  });

  it('Should calculate next version with tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: true,
      tagPrefix,
    };

    const output = command.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
      releasedRefs: [{target: ref, sha}],
    });
  });

  it('Should apply calculate next version with tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix,
    };

    command.run(inputs);

    expect(ChangelogServiceMock.applyReleaseChangelog).toHaveBeenCalledWith({
      tagPrefix,
      nextVersion,
      major: major,
      minor: minor,
      changelogFile: 'CHANGELOG.md',
      ref: inputs.ref,
      overrideTag: true,
    });
  });

  it('Should log tags calculate next version with tags override', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix,
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      2,
      `🏷️ Tagged: ${tag} with major: ${tagMajor} and minor: ${tagMinor}\n`,
    );
  });

  it('Should throw error when semver calculation fails', () => {
    const error = new Error(faker.lorem.sentence());
    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => command.run(inputs)).toThrow(error);
  });

  it('Should throw error when a bumper fails', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    const error = new Error(faker.lorem.sentence());
    BumperMock.bump.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => command.run(inputs)).toThrow(error);
  });

  it('Should throw error when changelog apply fails', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const error = new Error(faker.lorem.sentence());
    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => command.run(inputs)).toThrow(error);
  });

  it('Should call cascade environments with ref and target', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [
        {
          ok: true,
          ref: 'main',
          target: 'development',
          sha: faker.git.commitSha(),
        },
      ],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
      target: 'development',
    };

    command.run(inputs);

    expect(SyncServiceMock.cascadeEnvironments).toHaveBeenCalledWith(
      inputs.ref,
      'development',
      undefined,
    );
  });

  it('Should log sync when environments are synced', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const syncedSha = faker.git.commitSha();
    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [
        {ok: true, ref: 'main', target: 'development', sha: syncedSha},
        {ok: true, ref: 'main', target: 'sandbox', sha: syncedSha},
      ],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
      target: 'development,sandbox',
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      3,
      '🔗 Sync: Environments development,sandbox synced\n',
    );
  });

  it('Should log the failure cause when some environments fail', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const syncedSha = faker.git.commitSha();
    const syncFailure = faker.lorem.sentence();
    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [
        {ok: true, ref: 'main', target: 'development', sha: syncedSha},
        {ok: false, error: syncFailure},
      ],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
      target: 'development,sandbox',
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      4,
      `🔗 Sync: ${syncFailure}\n`,
    );
  });

  it('Should not log synced environments when every environment fails', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const syncFailure = faker.lorem.sentence();
    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [{ok: false, error: syncFailure}],
    });

    const tagPrefix = faker.string.alpha();
    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
      target: 'development',
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      3,
      `🔗 Sync: ${syncFailure}\n`,
    );
    expect(vi.mocked(process.stderr.write)).not.toHaveBeenCalledWith(
      expect.stringContaining('synced'),
    );
  });

  it('Should log sync error when environments synchronization fails', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const error = new Error(faker.lorem.sentence());

    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
      target: 'development',
    };

    command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      3,
      `🔗 Sync: Error during environments synchronization: ${String(error)}\n`,
    );
  });

  it('Should not sync environments without target', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix,
    };

    command.run(inputs);

    expect(SyncServiceMock.cascadeEnvironments).not.toHaveBeenCalled();
  });

  it('Should extend released refs with every environment synced', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    const syncedSha = faker.git.commitSha();
    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [
        {ok: true, ref, target: 'development', sha: syncedSha},
        {ok: false, error: faker.lorem.sentence()},
      ],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: false,
      tagPrefix,
      target: 'development,sandbox',
    };

    const output = command.run(inputs);

    expect(output.releasedRefs).toStrictEqual([
      {target: ref, sha},
      {target: 'development', sha: syncedSha},
    ]);
  });

  it('Should extend released refs with all synced targets when every environment succeeds', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    const devSha = faker.git.commitSha();
    const sandboxSha = faker.git.commitSha();
    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [
        {ok: true, ref, target: 'development', sha: devSha},
        {ok: true, ref, target: 'sandbox', sha: sandboxSha},
      ],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: false,
      tagPrefix,
      target: 'development,sandbox',
    };

    const output = command.run(inputs);

    expect(output.releasedRefs).toStrictEqual([
      {target: ref, sha},
      {target: 'development', sha: devSha},
      {target: 'sandbox', sha: sandboxSha},
    ]);
  });

  it('Should keep only the released ref when environments synchronization fails', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: false,
      error: new Error(faker.lorem.sentence()),
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: false,
      tagPrefix,
      target: 'development',
    };

    const output = command.run(inputs);

    expect(output.releasedRefs).toStrictEqual([{target: ref, sha}]);
  });

  it('Should log when no target branch is parsed from the target input', () => {
    const nextVersion = faker.system.semver();
    const major = `${nextVersion.split('.')[0]}`;
    const minor = `${nextVersion.split('.')[1]}`;
    const patch = `${nextVersion.split('.')[2]}`;

    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: {nextVersion, major: major, minor: minor, patch: patch},
    });

    BumperMock.bump.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    const tag = `v${nextVersion}`;
    const tagMajor = `v${major}`;
    const tagMinor = `v${major}.${minor}`;
    const tagPrefix = faker.string.alpha();
    const sha = faker.git.commitSha();
    const ref = faker.string.alpha(4);

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
    });

    SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
      ok: true,
      data: [],
    });

    const inputs: Inputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref,
      overrideTag: false,
      tagPrefix,
      target: ' , ',
    };

    const output = command.run(inputs);

    expect(vi.mocked(process.stderr.write)).toHaveBeenNthCalledWith(
      3,
      '🔗 Sync: No target branch parsed from " , "\n',
    );
    expect(output.releasedRefs).toStrictEqual([{target: ref, sha}]);
  });
});
