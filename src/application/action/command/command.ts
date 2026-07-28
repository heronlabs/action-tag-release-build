import {Bumper} from '../../../core/interfaces/bumper';
import {ChangelogService} from '../../../core/services/changelog-service';
import {SemverService} from '../../../core/services/semver-service';
import {SyncService} from '../../../core/services/sync-service';
import {Inputs} from './types/inputs';
import {Outputs} from './types/outputs';

export class Command {
  public run(inputs: Inputs): Outputs {
    const {
      versionFile,
      semantic,
      tagPrefix,
      changelogFile,
      ref,
      overrideTag,
      target,
    } = inputs;

    const semver = this.semverService.calculateNextVersion(
      versionFile,
      semantic,
    );
    if (!semver.ok) throw semver.error;

    const {nextVersion, major, minor} = semver.data;

    for (const bumper of this.bumpers) {
      const bump = bumper.bump(nextVersion);
      if (!bump.ok) throw bump.error;
      process.stderr.write(
        `✅ Bumper ${bumper.constructor.name} ${nextVersion}\n`,
      );
    }

    const tags = this.changelogService.applyReleaseChangelog({
      tagPrefix,
      nextVersion,
      major,
      minor,
      changelogFile,
      ref,
      overrideTag,
    });
    if (!tags.ok) throw tags.error;

    const {tag, tagMajor, tagMinor} = tags.data;

    let tagMessage = `🏷️ Tagged: ${tag}`;
    if (overrideTag)
      tagMessage += ` with major: ${tagMajor} and minor: ${tagMinor}`;
    process.stderr.write(`${tagMessage}\n`);

    if (target) {
      const envsSynced = this.syncService.cascadeEnvironments(ref, target);
      let syncMessage = '🔗 Sync: ';

      if (!envsSynced.ok)
        syncMessage += 'Error during environments syncronization';
      else {
        const results = envsSynced.data.join(', ');
        const allSynced = envsSynced.data.every(e => !e.includes(' xx '));
        syncMessage += allSynced
          ? `Environments ${results} synced`
          : `Environments ${results}`;
      }

      process.stderr.write(`${syncMessage}\n`);
    }

    return {
      version: nextVersion,
      tag: tag,
      tagMajor: tagMajor,
      tagMinor: tagMinor,
    };
  }

  constructor(
    private readonly bumpers: Bumper[],
    private readonly semverService: SemverService,
    private readonly changelogService: ChangelogService,
    private readonly syncService: SyncService,
  ) {}
}
