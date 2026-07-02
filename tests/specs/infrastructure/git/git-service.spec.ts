describe('GitService', () => {
  describe('getLastCommit()', () => {
    it.todo('should return last commit message when git log succeeds');
    it.todo('should return error when git log command fails');
  });

  describe('getCommits()', () => {
    it.todo('should return commits between previous tag and HEAD');
    it.todo('should return all commits when no previous tag exists');
    it.todo('should return error when git log fails after successful describe');
    it.todo(
      'should return error when git describe fails and git log also fails',
    );
    it.todo('should use tagPrefix in describe --match pattern');
  });

  describe('apply()', () => {
    describe('without override', () => {
      it.todo(
        'should chain git config, add, commit, pull, tag, and push successfully',
      );
      it.todo('should return error when git config user.name fails');
      it.todo('should return error when git config user.email fails');
      it.todo('should return error when git add fails');
      it.todo('should return error when git commit fails');
      it.todo('should return error when git pull rebase fails');
      it.todo('should return error when git tag fails');
      it.todo('should return error when git push fails');
      it.todo('should format commit message with version');
      it.todo('should use refName in pull rebase command');
    });

    describe('with override', () => {
      it.todo(
        'should force-tag major and minor after initial tag before pushing',
      );
      it.todo('should return error when force-tag major fails');
      it.todo('should return error when force-tag minor fails');
      it.todo('should return error when push after force-tags fails');
    });
  });

  describe('rollbackFireForget()', () => {
    it.todo('should delete tag remotely and locally when no override tags');
    it.todo(
      'should delete main, major, and minor tags remotely and locally when override tags provided',
    );
    it.todo('should not propagate errors from failed delete commands');
  });
});
