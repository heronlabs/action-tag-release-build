"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BumpCommand = void 0;
class BumpCommand {
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
exports.BumpCommand = BumpCommand;
//# sourceMappingURL=bump-command.js.map