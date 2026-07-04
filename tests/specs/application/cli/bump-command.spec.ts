import {faker} from '@faker-js/faker';

import {BumpCommand} from '../../../../src/application/cli/bump-command';
import {BumpInputs} from '../../../../src/application/cli/types/input-bump';
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
  let bumpCommand: BumpCommand;

  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    bumpCommand = new BumpCommand(
      [BumperMoq],
      SemverServiceMoq,
      ChangelogServiceMoq,
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
    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: BumpInputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      refName: faker.string.alpha(4),
      overrideTag: false,
      tagPrefix: faker.string.alpha(),
    };

    const output = bumpCommand.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
    });
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
    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor},
    });

    const inputs: BumpInputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      refName: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    const output = bumpCommand.run(inputs);

    expect(output).toStrictEqual({
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
    });
  });

  it('Should throw error when semver calculation fails', () => {
    const error = new Error(faker.lorem.sentence());
    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: false,
      error,
    });

    const inputs: BumpInputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      refName: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => bumpCommand.run(inputs)).toThrow(error);
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

    const inputs: BumpInputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      refName: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => bumpCommand.run(inputs)).toThrow(error);
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

    const inputs: BumpInputs = {
      semantic: 'major',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      refName: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    expect(() => bumpCommand.run(inputs)).toThrow(error);
  });
});
