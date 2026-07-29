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
    it('Should merge with commit', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      const output = service.mergeWithCommit('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: 'OK',
      });
    });

    it('Should call exec with gh api merges command', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.mergeWithCommit('main', 'development');

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith(
        'gh api "repos/{owner}/{repo}/merges" -f base="development" -f head="main" -f commit_message="Merge main into development"',
      );
    });

    it('Should return error merging with commit', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.mergeWithCommit('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error when merging with commit throws', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.mergeWithCommit('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });
});
