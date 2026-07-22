import { Bumper } from '../../../core/interfaces/bumper';
import { ChangelogService } from '../../../core/services/changelog-service';
import { SemverService } from '../../../core/services/semver-service';
import { Inputs } from './types/inputs';
import { Outputs } from './types/outputs';
export declare class Command {
    private readonly bumpers;
    private readonly semverService;
    private readonly changelogService;
    run(inputs: Inputs): Outputs;
    constructor(bumpers: Bumper[], semverService: SemverService, changelogService: ChangelogService);
}
//# sourceMappingURL=command.d.ts.map