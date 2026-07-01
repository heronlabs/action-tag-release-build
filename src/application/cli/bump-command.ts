import {Bumper} from '../../core/interfaces/bumper';
import {ChangelogService} from '../../core/services/changelog-service';
import {TaggerService} from '../../core/services/tagger-service';
import {VersionService} from '../../core/services/version-service';
import {Semantic} from '../../core/types/semantic';
import {GhService} from '../../infrastructure/gh/gh-service';
import {GitService} from '../../infrastructure/git/git-service';
import {BumpInputs} from './dtos/input-bump';
import {BumpOutputs} from './dtos/output-bump';

export class BumpCommand {
  private getSemVer(
    versionFile: string,
    semantic?: string,
  ): {version: string; semantic: Semantic} {
    const {
      ok: versionOk,
      data: version,
      error: versionError,
    } = this.versionService.get(versionFile);
    if (!versionOk) throw versionError;
    process.stdout.write(`✅  Get current version: ${version}\n`);

    if (semantic) {
      semantic = semantic as Semantic;
      if (!['major', 'minor', 'patch'].includes(semantic)) {
        throw new Error(`🚫 Invalid semantic: '${semantic}'`);
      }
    } else {
      const {
        ok: lastCommitOk,
        data: lastCommit,
        error: lastCommitError,
      } = this.gitService.getLastCommit();
      if (!lastCommitOk) throw lastCommitError;
      process.stdout.write('✅ Get last commit\n');

      const {
        ok: semanticOk,
        data: semanticData,
        error: semanticError,
      } = this.taggerService.classify(lastCommit);
      if (!semanticOk) throw semanticError;
      semantic = semanticData;
      process.stdout.write(`✅  Classify bump: ${semantic}\n`);
    }

    return {version, semantic: semantic as Semantic};
  }

  private setVersion(
    version: string,
    versionFile: string,
    semantic: Semantic,
  ): {
    nextVersion: string;
    major: string;
    minor: string;
    patch: string;
  } {
    const {
      ok: semverOk,
      data: semver,
      error: semverError,
    } = this.taggerService.calculate(version, semantic);
    if (!semverOk) throw semverError;
    process.stdout.write(
      `✅ Calculate: ${version} -> ${semver.nextVersion} (${semantic})\n`,
    );

    const {ok: setVersionOk, error: setVersionError} = this.versionService.set(
      semver.nextVersion,
      versionFile,
    );
    if (!setVersionOk) throw setVersionError;
    process.stdout.write('✅  Set next version\n');

    return {
      nextVersion: semver.nextVersion,
      major: semver.major,
      minor: semver.minor,
      patch: semver.patch,
    };
  }

  private bumpBumpers(nextVersion: string): void {
    for (const bumper of this.bumpers) {
      process.stdout.write(
        `✅  Syncing ${bumper.name} version -> ${nextVersion}\n`,
      );
      const {ok: bumperOk, error: bumperError} = bumper.bump(nextVersion);
      if (!bumperOk) throw bumperError;
      process.stdout.write(`✅ Bumper ${bumper.name} -> ${nextVersion}\n`);
    }
  }

  private applyReleaseChangelog(
    tagPrefix: string,
    nextVersion: string,
    major: string,
    minor: string,
    changelogFile: string,
    refName: string,
    overrideTag: boolean,
  ): {
    tag: string;
    tagMajor: string;
    tagMinor: string;
  } {
    const tag = `${tagPrefix}${nextVersion}`;
    const tagMajor = `${tagPrefix}${major}`;
    const tagMinor = `${tagPrefix}${major}.${minor}`;

    const {
      ok: releaseNotesOk,
      data: releaseNotes,
      error: releaseNotesError,
    } = this.changelogService.generateReleaseNotes(tagPrefix);
    if (!releaseNotesOk) throw releaseNotesError;
    process.stdout.write('✅ Generated release notes\n');

    const {ok: changelogOk, error: changelogError} =
      this.changelogService.updateChangelog(tag, releaseNotes, changelogFile);
    if (!changelogOk) throw changelogError;
    process.stdout.write(`✅ Updated ${changelogFile}\n`);

    const {ok: gitApplyOk, error: gitApplyError} = this.gitService.apply(
      nextVersion,
      tag,
      tagMajor,
      tagMinor,
      refName,
      overrideTag,
    );
    if (!gitApplyOk) throw gitApplyError;
    process.stdout.write('✅ Pushed changes\n');

    const {ok: githubReleaseOk, error: githubReleaseError} =
      this.githubService.createRelease(tag, releaseNotes);
    if (!githubReleaseOk) {
      const rollbackTags = overrideTag ? {tagMajor, tagMinor} : undefined;
      this.gitService.rollbackFireForget(tag, rollbackTags);
      throw githubReleaseError;
    }
    process.stdout.write('✅ Released on Github\n');

    if (overrideTag) {
      process.stdout.write(
        `🗂️ Updated floating tags: ${tagMajor} -> ${nextVersion}, ${tagMinor} -> ${nextVersion}\n`,
      );
    }
    process.stdout.write(`🏷️ Tagged: ${tag}\n`);

    return {tag, tagMajor, tagMinor};
  }

  public run(inputs: BumpInputs): BumpOutputs {
    const {version, semantic} = this.getSemVer(
      inputs.versionFile,
      inputs.semantic,
    );

    const {nextVersion, major, minor} = this.setVersion(
      version,
      inputs.versionFile,
      semantic,
    );

    this.bumpBumpers(nextVersion);

    const {tag, tagMajor, tagMinor} = this.applyReleaseChangelog(
      inputs.tagPrefix,
      nextVersion,
      major,
      minor,
      inputs.changelogFile,
      inputs.refName,
      inputs.overrideTag,
    );

    return {
      version: nextVersion,
      tag,
      tagMajor,
      tagMinor,
    };
  }

  constructor(
    private readonly bumpers: Bumper[],
    private readonly versionService: VersionService,
    private readonly taggerService: TaggerService,
    private readonly gitService: GitService,
    private readonly githubService: GhService,
    private readonly changelogService: ChangelogService,
  ) {}
}
