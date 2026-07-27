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

describe('Given a bump command', () => {
  let command: Command;

  beforeEach(() => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    command = new Command([BumperMoq], SemverServiceMoq, ChangelogServiceMoq);
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

    const output = command.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
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

    const output = command.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
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
});
