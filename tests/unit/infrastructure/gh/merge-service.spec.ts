import {faker} from '@faker-js/faker';

import {MergeService} from '../../../../src/infrastructure/gh/services/merge-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

describe('Given a merge service', () => {
  let service: MergeService;

  beforeEach(() => {
    service = new MergeService(ChildProcessServiceMoq);
  });

  describe('Given merge with commit', () => {
    it('Should return the sha of the merge commit it created', () => {
      const sha = faker.git.commitSha();
      ChildProcessServiceMock.exec.mockReturnValueOnce({ok: true, data: sha});

      const output = service.mergeWithCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: true,
        data: sha,
      });
    });

    it('Should not read the branch head when the merge returned a sha', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: faker.git.commitSha(),
      });

      service.mergeWithCommit(faker.git.branch(), faker.git.branch());

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledTimes(1);
    });

    it('Should call exec with gh api merges command', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: faker.git.commitSha(),
      });

      service.mergeWithCommit(ref, environment);

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(1, 'gh', [
        'api',
        'repos/{owner}/{repo}/merges',
        '-f',
        `base=${environment}`,
        '-f',
        `head=${ref}`,
        '-f',
        `commit_message=Merge ${ref} into ${environment}`,
        '--jq',
        '.sha',
      ]);
    });

    it('Should fall back to the branch head when the merge returns no body', () => {
      const sha = faker.git.commitSha();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: ''})
        .mockReturnValueOnce({ok: true, data: sha});

      const output = service.mergeWithCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: true,
        data: sha,
      });
    });

    it('Should call exec with gh api branch sha command on the fallback', () => {
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: ''})
        .mockReturnValueOnce({ok: true, data: faker.git.commitSha()});

      service.mergeWithCommit(faker.git.branch(), environment);

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'gh', [
        'api',
        `repos/{owner}/{repo}/branches/${environment}`,
        '--jq',
        '.commit.sha',
      ]);
    });

    it('Should encode branch path segments on the gh api branch sha command', () => {
      const segment = faker.git.branch();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: ''})
        .mockReturnValueOnce({ok: true, data: faker.git.commitSha()});

      service.mergeWithCommit(faker.git.branch(), `${segment}/next thing`);

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'gh', [
        'api',
        `repos/{owner}/{repo}/branches/${segment}/next%20thing`,
        '--jq',
        '.commit.sha',
      ]);
    });

    it('Should return error merging with commit', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({ok: false, error});

      const output = service.mergeWithCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should not read the branch head when the merge failed', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      service.mergeWithCommit(faker.git.branch(), faker.git.branch());

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledTimes(1);
    });

    it('Should return error when merging with commit throws', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.mergeWithCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });

  describe('Given merge without commit', () => {
    it('Should return the fast-forwarded sha', () => {
      const sha = faker.git.commitSha();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: sha})
        .mockReturnValueOnce({ok: true, data: ''});

      const output = service.mergeWithoutCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: true,
        data: sha,
      });
    });

    it('Should call exec with gh api ref lookup command', () => {
      const ref = faker.git.branch();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: faker.git.commitSha()})
        .mockReturnValueOnce({ok: true, data: ''});

      service.mergeWithoutCommit(ref, faker.git.branch());

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(1, 'gh', [
        'api',
        `repos/{owner}/{repo}/git/ref/heads/${ref}`,
        '--jq',
        '.object.sha',
      ]);
    });

    it('Should call exec with gh api ref update command', () => {
      const environment = faker.git.branch();
      const sha = faker.git.commitSha();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: sha})
        .mockReturnValueOnce({ok: true, data: ''});

      service.mergeWithoutCommit(faker.git.branch(), environment);

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'gh', [
        'api',
        `repos/{owner}/{repo}/git/refs/heads/${environment}`,
        '-X',
        'PATCH',
        '-f',
        `sha=${sha}`,
      ]);
    });

    it('Should encode branch path segments on the gh api ref update command', () => {
      const segment = faker.git.branch();
      const sha = faker.git.commitSha();
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: sha})
        .mockReturnValueOnce({ok: true, data: ''});

      service.mergeWithoutCommit(faker.git.branch(), `${segment}/next thing`);

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'gh', [
        'api',
        `repos/{owner}/{repo}/git/refs/heads/${segment}/next%20thing`,
        '-X',
        'PATCH',
        '-f',
        `sha=${sha}`,
      ]);
    });

    it('Should return error when the ref lookup fails', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.mergeWithoutCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should not update the ref when the ref lookup fails', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      service.mergeWithoutCommit(faker.git.branch(), faker.git.branch());

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledTimes(1);
    });

    it('Should return error when the ref update fails', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: faker.git.commitSha()})
        .mockReturnValueOnce({ok: false, error});

      const output = service.mergeWithoutCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error when merging without commit throws', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.mergeWithoutCommit(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });
});
