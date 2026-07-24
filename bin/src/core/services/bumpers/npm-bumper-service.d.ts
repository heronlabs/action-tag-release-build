import { ChildProcessService } from '../../../infrastructure/terminal/child-process-service';
import { Bumper } from '../../interfaces/bumper';
export declare class NpmService implements Bumper {
    private readonly childProcessService;
    bump(version: string): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
    constructor(childProcessService: ChildProcessService);
}
//# sourceMappingURL=npm-bumper-service.d.ts.map