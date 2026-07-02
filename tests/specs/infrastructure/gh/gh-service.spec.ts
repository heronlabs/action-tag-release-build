describe('GhService', () => {
  describe('createRelease()', () => {
    it.todo(
      'should write release notes to temp file and run gh release create command',
    );
    it.todo('should use tag as both tag and title in gh command');
    it.todo('should write temp file to .release-notes.tmp.md in cwd');
    it.todo('should return ok with command output on success');
    it.todo('should return error when gh release create command fails');
    it.todo('should return error when writing temp file fails');
  });
});
