import {SyncInputs} from './types/inputs';
import {SyncOutputs} from './types/outputs';

export class SyncCommand {
  public run(inputs: SyncInputs): SyncOutputs {
    const {source, target, mergeMessage} = inputs;

    process.stderr.write(`${source}, ${target}, ${mergeMessage}\n`);

    // Given a source branch like main.
    // Given target branches like sandbox, development, staging;
    // Get the latest version of source branch and merge on each target branch.
    // If mergeMessage is provided merge with message else merge without any merge commit.
    // If a conflict appears during the merge, create or delete and recreate if any previously existing PR.

    return {
      synced: 'OK',
      conflictsUrls: '',
    };
  }

  constructor() {}
}
