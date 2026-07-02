describe('ChildProcessService', () => {
  describe('exec()', () => {
    it.todo('should return ok with command output when command succeeds');
    it.todo(
      'should return ok with trimmed output when command produces trailing whitespace',
    );
    it.todo(
      'should return ok with empty string when command produces no output',
    );
    it.todo('should return error result when command exits with non-zero code');
    it.todo('should pass cwd option to execSync when executing command');
    it.todo(
      'should return error result when execSync throws a non-Error value',
    );
  });

  describe('execChain()', () => {
    it.todo(
      'should return ok result with chainable execChain method on success',
    );
    it.todo('should return failure result with noop execChain on error');
    it.todo('should chain multiple successful commands and return last result');
    it.todo('should stop chain at first failure and return error');
    it.todo('should propagate failure through all subsequent execChain calls');
    it.todo('should pass cwd option to execSync for chained commands');
  });
});
