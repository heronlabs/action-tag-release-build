import {Bumper} from '../../../core/interfaces/bumper';
import {ChangelogService} from '../../../core/services/changelog-service';
import {SemverService} from '../../../core/services/semver-service';
import {SyncService} from '../../../core/services/sync-service';
import {Inputs} from './types/inputs';
import {Outputs, ReleasedRef} from './types/outputs';

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
      mergeCommit,
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

    const {tag, tagMajor, tagMinor, sha} = tags.data;

    let tagMessage = `🏷️ Tagged: ${tag}`;
    if (overrideTag)
      tagMessage += ` with major: ${tagMajor} and minor: ${tagMinor}`;
    process.stderr.write(`${tagMessage}\n`);

    const releasedRefs: ReleasedRef[] = [{target: ref, sha}];

    if (target) {
      const envsSynced = this.syncService.cascadeEnvironments(
        ref,
        target,
        mergeCommit,
      );

      if (!envsSynced.ok) {
        process.stderr.write(
          `🔗 Sync: Error during environments synchronization: ${String(envsSynced.error)}\n`,
        );
      } else if (!envsSynced.data.length) {
        process.stderr.write(
          `🔗 Sync: No target branch parsed from "${target}"\n`,
        );
      } else {
        const synced = envsSynced.data.filter(result => result.ok);
        const failed = envsSynced.data.filter(result => !result.ok);

        if (synced.length) {
          const syncedTargets = synced.map(env => env.target).join(',');
          process.stderr.write(
            `🔗 Sync: Environments ${syncedTargets} synced\n`,
          );
        }

        failed.forEach(failure =>
          process.stderr.write(`🔗 Sync: ${failure.error}\n`),
        );

        releasedRefs.push(
          ...synced.map(env => ({target: env.target, sha: env.sha})),
        );
      }
    }

    return {
      version: nextVersion,
      tag: tag,
      tagMajor: tagMajor,
      tagMinor: tagMinor,
      releasedRefs: releasedRefs,
    };
  }

  constructor(
    private readonly bumpers: Bumper[],
    private readonly semverService: SemverService,
    private readonly changelogService: ChangelogService,
    private readonly syncService: SyncService,
  ) {}
}
