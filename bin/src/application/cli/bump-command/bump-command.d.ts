import { Bumper } from '../../../core/interfaces/bumper';
import { ChangelogService } from '../../../core/services/changelog-service';
import { SemverService } from '../../../core/services/semver-service';
import { BumpInputs } from './types/inputs';
import { BumpOutputs } from './types/outputs';
export declare class BumpCommand {
    private readonly bumpers;
    private readonly semverService;
    private readonly changelogService;
    run(inputs: BumpInputs): BumpOutputs;
    constructor(bumpers: Bumper[], semverService: SemverService, changelogService: ChangelogService);
}
//# sourceMappingURL=bump-command.d.ts.map