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
    ChangelogServiceMock.resetToRemote.mockReturnValue({ok: true, data: ''});

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

  it('Should calculate next version with the version file, tag prefix and semantic', () => {
    SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
      ok: true,
      data: null,
    });

    const inputs: Inputs = {
      semantic: 'minor',
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: faker.string.alpha(4),
      overrideTag: true,
      tagPrefix: faker.string.alpha(),
    };

    command.run(inputs);

    expect(SemverServiceMock.calculateNextVersion).toHaveBeenCalledWith(
      'version.txt',
      inputs.tagPrefix,
      'minor',
    );
  });

  describe('Given no releasable commit since the last tag', () => {
    const inputs: Inputs = {
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: 'main',
      overrideTag: true,
      tagPrefix: 'v',
      target: 'development,sandbox',
    };

    beforeEach(() => {
      SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
        ok: true,
        data: null,
      });
    });

    it('Should return empty outputs and no released ref', () => {
      const output = command.run(inputs);

      expect(output).toStrictEqual({
        version: '',
        tag: '',
        tagMajor: '',
        tagMinor: '',
        releasedRefs: [],
      });
    });

    it('Should log that the release was skipped', () => {
      command.run(inputs);

      expect(vi.mocked(process.stderr.write)).toHaveBeenCalledWith(
        '⏭️ Release skipped: no releasable commit since the last tag\n',
      );
    });

    it('Should log a single line', () => {
      command.run(inputs);

      expect(vi.mocked(process.stderr.write)).toHaveBeenCalledTimes(1);
    });

    it('Should not run the bumpers', () => {
      command.run(inputs);

      expect(BumperMock.bump).not.toHaveBeenCalled();
    });

    it('Should not tag nor push', () => {
      command.run(inputs);

      expect(ChangelogServiceMock.applyReleaseChangelog).not.toHaveBeenCalled();
    });

    it('Should not sync the targets', () => {
      command.run(inputs);

      expect(SyncServiceMock.cascadeEnvironments).not.toHaveBeenCalled();
    });
  });

  describe('Given each release attempt starts from the remote tip', () => {
    const inputs: Inputs = {
      versionFile: 'version.txt',
      changelogFile: 'CHANGELOG.md',
      ref: 'main',
      overrideTag: true,
      tagPrefix: 'v',
      target: 'development',
    };
    const semver = (nextVersion: string) => ({
      ok: true,
      data: {
        nextVersion,
        major: nextVersion.split('.')[0],
        minor: nextVersion.split('.')[1],
        patch: nextVersion.split('.')[2],
      },
    });
    const released = (nextVersion: string, sha: string) => ({
      ok: true,
      data: {
        tag: `v${nextVersion}`,
        tagMajor: 'v1',
        tagMinor: 'v1.3',
        sha,
      },
    });
    const refMoved = (error: Error) => ({ok: false, error, refMoved: true});

    it('Should reset to the remote ref before calculating the version', () => {
      SemverServiceMock.calculateNextVersion.mockReturnValueOnce({
        ok: true,
        data: null,
      });

      command.run(inputs);

      expect(ChangelogServiceMock.resetToRemote).toHaveBeenCalledWith('main');
    });

    describe('Given the reset fails', () => {
      const error = new Error(faker.lorem.sentence());
      let thrown: unknown;

      beforeEach(() => {
        ChangelogServiceMock.resetToRemote.mockReturnValueOnce({
          ok: false,
          error,
        });
        thrown = undefined;

        try {
          command.run(inputs);
        } catch (failure) {
          thrown = failure;
        }
      });

      it('Should throw the reset error', () => {
        expect(thrown).toBe(error);
      });

      it('Should not calculate the version', () => {
        expect(SemverServiceMock.calculateNextVersion).not.toHaveBeenCalled();
      });
    });

    describe('Given the push is rejected once because the ref moved', () => {
      const releasedSha = faker.git.commitSha();
      let output: ReturnType<Command['run']>;

      beforeEach(() => {
        SemverServiceMock.calculateNextVersion
          .mockReturnValueOnce(semver('1.2.4'))
          .mockReturnValueOnce(semver('1.3.0'));
        BumperMock.bump.mockReturnValue({ok: true, data: 'OK'});
        ChangelogServiceMock.applyReleaseChangelog
          .mockReturnValueOnce(refMoved(new Error(faker.lorem.sentence())))
          .mockReturnValueOnce(released('1.3.0', releasedSha));
        SyncServiceMock.cascadeEnvironments.mockReturnValueOnce({
          ok: true,
          data: [],
        });

        output = command.run(inputs);
      });

      it('Should release the version computed on the new tip', () => {
        expect(output.version).toBe('1.3.0');
      });

      it('Should reset to the remote ref once per attempt', () => {
        expect(ChangelogServiceMock.resetToRemote).toHaveBeenCalledTimes(2);
      });

      it('Should calculate the version again', () => {
        expect(SemverServiceMock.calculateNextVersion).toHaveBeenCalledTimes(2);
      });

      it('Should run the bumpers again with the new version', () => {
        expect(BumperMock.bump).toHaveBeenLastCalledWith('1.3.0');
      });

      it('Should write the changelog again with the new version', () => {
        expect(
          ChangelogServiceMock.applyReleaseChangelog,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({nextVersion: '1.3.0'}),
        );
      });

      it('Should log that the release starts again', () => {
        expect(vi.mocked(process.stderr.write)).toHaveBeenCalledWith(
          '🔁 Push rejected: main moved, releasing again from its new tip\n',
        );
      });

      it('Should sync the targets once to the released sha', () => {
        expect(SyncServiceMock.cascadeEnvironments).toHaveBeenCalledWith(
          'main',
          releasedSha,
          'development',
          undefined,
        );
      });
    });

    describe('Given the new tip has nothing left to release', () => {
      it('Should skip the release', () => {
        SemverServiceMock.calculateNextVersion
          .mockReturnValueOnce(semver('1.2.4'))
          .mockReturnValueOnce({ok: true, data: null});
        BumperMock.bump.mockReturnValue({ok: true, data: 'OK'});
        ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce(
          refMoved(new Error(faker.lorem.sentence())),
        );

        const output = command.run(inputs);

        expect(output.releasedRefs).toStrictEqual([]);
      });
    });

    describe('Given the push is rejected on every attempt because the ref moved', () => {
      const lastError = new Error(faker.lorem.sentence());
      let thrown: unknown;

      beforeEach(() => {
        SemverServiceMock.calculateNextVersion.mockReturnValue(semver('1.2.4'));
        BumperMock.bump.mockReturnValue({ok: true, data: 'OK'});
        ChangelogServiceMock.applyReleaseChangelog
          .mockReturnValueOnce(refMoved(new Error(faker.lorem.sentence())))
          .mockReturnValueOnce(refMoved(new Error(faker.lorem.sentence())))
          .mockReturnValueOnce(refMoved(lastError))
          .mockReturnValue(released('1.2.4', faker.git.commitSha()));
        thrown = undefined;

        try {
          command.run(inputs);
        } catch (error) {
          thrown = error;
        }
      });

      it('Should throw the last rejection', () => {
        expect(thrown).toBe(lastError);
      });

      it('Should stop after three attempts', () => {
        expect(
          ChangelogServiceMock.applyReleaseChangelog,
        ).toHaveBeenCalledTimes(3);
      });

      it('Should not sync the targets', () => {
        expect(SyncServiceMock.cascadeEnvironments).not.toHaveBeenCalled();
      });
    });

    describe('Given the push fails for another reason', () => {
      const error = new Error(faker.lorem.sentence());
      let thrown: unknown;

      beforeEach(() => {
        SemverServiceMock.calculateNextVersion.mockReturnValue(semver('1.2.4'));
        BumperMock.bump.mockReturnValue({ok: true, data: 'OK'});
        ChangelogServiceMock.applyReleaseChangelog
          .mockReturnValueOnce({ok: false, error, refMoved: false})
          .mockReturnValue(released('1.2.4', faker.git.commitSha()));
        thrown = undefined;

        try {
          command.run(inputs);
        } catch (failure) {
          thrown = failure;
        }
      });

      it('Should throw the push error', () => {
        expect(thrown).toBe(error);
      });

      it('Should not retry', () => {
        expect(ChangelogServiceMock.resetToRemote).toHaveBeenCalledTimes(1);
      });
    });
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

  it('Should call cascade environments with ref, released sha and target', () => {
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

    ChangelogServiceMock.applyReleaseChangelog.mockReturnValueOnce({
      ok: true,
      data: {tag, tagMajor, tagMinor, sha},
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
      sha,
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
