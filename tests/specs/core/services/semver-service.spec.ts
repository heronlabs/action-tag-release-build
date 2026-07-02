describe('SemverService', () => {
  describe('classify()', () => {
    it.todo('should classify feat commit as minor');
    it.todo('should classify feat with scope as minor');
    it.todo('should classify fix commit as patch');
    it.todo('should classify chore commit as patch');
    it.todo('should classify docs commit as patch');
    it.todo('should classify unknown type prefix as patch');

    it.todo('should detect breaking change from !: in subject line');
    it.todo('should detect breaking change from feat!: in subject line');
    it.todo('should detect breaking change from fix(scope)!: in subject line');
    it.todo(
      'should detect breaking change from BREAKING CHANGE in commit body',
    );
    it.todo(
      'should detect breaking change from BREAKING-CHANGE in commit body',
    );
    it.todo('should classify breaking feat as major (not minor)');

    it.todo('should return error when classify throws unexpectedly');
  });

  describe('calculate()', () => {
    it.todo('should bump major version and reset minor and patch to 0');
    it.todo('should bump minor version and reset patch to 0');
    it.todo('should bump patch version');
    it.todo('should strip leading non-digit prefix from version');
    it.todo('should default missing minor segment to 0');
    it.todo('should default missing patch segment to 0');
    it.todo('should handle version 0.0.0 bumping to 0.1.0 for minor');
    it.todo('should handle version 0.0.0 bumping to 0.0.1 for patch');
    it.todo('should handle version 1.0.0 bumping to 2.0.0 for major');
    it.todo('should handle large version numbers without overflow issues');
    it.todo('should return error when version is unparseable');
  });

  describe('get()', () => {
    it.todo('should read and trim version from version file');
    it.todo('should return error when version file does not exist');
    it.todo('should return error when version file is empty');
    it.todo('should return error when readFileSync throws unexpected error');
    it.todo(
      'should strip leading and trailing whitespace from version content',
    );
  });

  describe('set()', () => {
    it.todo('should write version to version file with trailing newline');
    it.todo('should return error when writeFileSync fails');
  });

  describe('calculateNextVersion()', () => {
    it.todo('should calculate next version using explicit semantic input');
    it.todo(
      'should calculate next version from git last commit when no semantic provided',
    );
    it.todo(
      'should not call git last commit when explicit semantic is provided',
    );

    it.todo('should return error when version file is not found');
    it.todo('should return error when version file is empty');
    it.todo('should return error when explicit semantic string is invalid');
    it.todo(
      'should return error when semantic is empty and git last commit fails',
    );
    it.todo('should return error when commit classification fails');
    it.todo('should return error when version calculation fails');
    it.todo('should return error when writing updated version file fails');

    it.todo('should write updated version to version file on success');
    it.todo('should return nextVersion, major, minor, and patch on success');
    it.todo('should pass correct version and semantic to internal calculate');
  });
});
