"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
class Command {
    bumpers;
    semverService;
    changelogService;
    run(inputs) {
        const { versionFile, semantic, tagPrefix, changelogFile, refName, overrideTag, } = inputs;
        const semver = this.semverService.calculateNextVersion(versionFile, semantic);
        if (!semver.ok)
            throw semver.error;
        const { nextVersion, major, minor } = semver.data;
        for (const bumper of this.bumpers) {
            const bump = bumper.bump(nextVersion);
            if (!bump.ok)
                throw bump.error;
            process.stderr.write(`✅ Bumper ${bumper.constructor.name} ${nextVersion}\n`);
        }
        const tags = this.changelogService.applyReleaseChangelog({
            tagPrefix,
            nextVersion,
            major,
            minor,
            changelogFile,
            refName,
            overrideTag,
        });
        if (!tags.ok)
            throw tags.error;
        const { tag, tagMajor, tagMinor } = tags.data;
        let tagMessage = `🏷️ Tagged: ${tag}`;
        if (inputs.overrideTag)
            tagMessage += ` with major: ${tagMajor} and minor: ${tagMinor}`;
        process.stderr.write(`${tagMessage}\n`);
        // Given a source branch like main.
        // Given target branches like sandbox, development, staging;
        // Get the latest version of source branch and merge on each target branch.
        // If mergeMessage is provided merge with message else merge without any merge commit.
        // If a conflict appears during the merge, create or delete and recreate if any previously existing PR.
        return {
            version: nextVersion,
            tag: tag,
            tagMajor: tagMajor,
            tagMinor: tagMinor,
        };
    }
    constructor(bumpers, semverService, changelogService) {
        this.bumpers = bumpers;
        this.semverService = semverService;
        this.changelogService = changelogService;
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map