import {Bumper} from '../../core/interfaces/bumper';
import {ChangelogService} from '../../core/services/changelog-service';
import {SemverService} from '../../core/services/semver-service';
import {BumpInputs} from './dtos/input-bump';
import {BumpOutputs} from './dtos/output-bump';

export class BumpCommand {
  public run(inputs: BumpInputs): BumpOutputs {
    const semver = this.semverService.calculateNextVersion(
      inputs.versionFile,
      inputs.semantic,
    );
    if (!semver.ok) throw semver.error;

    for (const bumper of this.bumpers) {
      const bump = bumper.bump(semver.data.nextVersion);
      if (!bump.ok) throw bump.error;
      process.stdout.write(
        `✅ Bumper ${bumper.name} -> ${semver.data.nextVersion}\n`,
      );
    }

    const tags = this.changelogService.applyReleaseChangelog(
      inputs.tagPrefix,
      semver.data.nextVersion,
      semver.data.major,
      semver.data.minor,
      inputs.changelogFile,
      inputs.refName,
      inputs.overrideTag,
    );
    if (!tags.ok) throw tags.error;

    let tagMessage = `🏷️ Tagged: ${tags.data.tag}\n`;
    if (inputs.overrideTag)
      tagMessage = `🗂️ Tagged: ${tags.data.tag} with ${tags.data.tagMajor} ${tags.data.tagMinor}\n`;
    process.stdout.write(tagMessage);

    return {
      version: semver.data.nextVersion,
      tag: tags.data.tag,
      tagMajor: tags.data.tagMajor,
      tagMinor: tags.data.tagMinor,
    };
  }

  constructor(
    private readonly bumpers: Bumper[],
    private readonly semverService: SemverService,
    private readonly changelogService: ChangelogService,
  ) {}
}
