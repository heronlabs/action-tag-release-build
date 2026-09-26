import {Bumper} from '../../../core/interfaces/bumper';
import {ChangelogService} from '../../../core/services/changelog-service';
import {SemverService} from '../../../core/services/semver-service';
import {SyncService} from '../../../core/services/sync-service';
import {Inputs} from './types/inputs';
import {Outputs, ReleasedRef} from './types/outputs';

const RELEASE_ATTEMPTS = 3;

export class Command {
  public run(inputs: Inputs): Outputs {
    const {versionFile, semantic, tagPrefix, changelogFile, ref, overrideTag} =
      inputs;

    let refMoved: unknown;

    for (let attempt = 0; attempt < RELEASE_ATTEMPTS; attempt++) {
      const reset = this.changelogService.resetToRemote(ref);
      if (!reset.ok) throw reset.error;

      const semver = this.semverService.calculateNextVersion(
        versionFile,
        tagPrefix,
        semantic,
      );
      if (!semver.ok) throw semver.error;

      if (!semver.data) {
        process.stderr.write(
          '⏭️ Release skipped: no releasable commit since the last tag\n',
        );
        return {
          version: '',
          tag: '',
          tagMajor: '',
          tagMinor: '',
          releasedRefs: [],
        };
      }

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

      if (tags.ok) return this.publish(inputs, nextVersion, tags.data);

      if (!('refMoved' in tags) || !tags.refMoved) throw tags.error;

      process.stderr.write(
        `🔁 Push rejected: ${ref} moved, releasing again from its new tip\n`,
      );
      refMoved = tags.error;
    }

    throw refMoved;
  }

  private publish(
    inputs: Inputs,
    nextVersion: string,
    {
      tag,
      tagMajor,
      tagMinor,
      sha,
    }: {tag: string; tagMajor: string; tagMinor: string; sha: string},
  ): Outputs {
    const {ref, overrideTag, target, mergeCommit} = inputs;

    let tagMessage = `🏷️ Tagged: ${tag}`;
    if (overrideTag)
      tagMessage += ` with major: ${tagMajor} and minor: ${tagMinor}`;
    process.stderr.write(`${tagMessage}\n`);

    const releasedRefs: ReleasedRef[] = [{target: ref, sha}];

    if (target) {
      const envsSynced = this.syncService.cascadeEnvironments(
        ref,
        sha,
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
