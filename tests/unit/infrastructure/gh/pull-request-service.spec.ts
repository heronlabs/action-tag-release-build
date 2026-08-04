import {faker} from '@faker-js/faker';

import {PullRequestService} from '../../../../src/infrastructure/gh/services/pull-request-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

describe('Given a pull request service', () => {
  let service: PullRequestService;

  beforeEach(() => {
    service = new PullRequestService(ChildProcessServiceMoq);
  });

  describe('Given has pull request', () => {
    it('Should return true when open pull request exists', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '1',
      });

      const output = service.hasPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: true,
      });
    });

    it('Should return false when no open pull request exists', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '0',
      });

      const output = service.hasPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: false,
      });
    });

    it('Should call exec with gh pr list command', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '0',
      });

      service.hasPullRequest('main', 'development');

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('gh', [
        'pr',
        'list',
        '--base',
        'development',
        '--head',
        'main',
        '--state',
        'open',
        '--json',
        'number',
        '--jq',
        'length',
      ]);
    });

    it('Should return error listing pull requests', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.hasPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error when listing pull requests throws', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.hasPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });

  describe('Given create pull request', () => {
    it('Should create pull request', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      const output = service.createPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: 'OK',
      });
    });

    it('Should call exec with gh pr create command', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.createPullRequest('main', 'development');

      const title = '🔗 Sync main into development';
      const body =
        'Automatic sync of main into development failed ' +
        '(diverged branch or merge conflict). Merge this pull request ' +
        'to sync development with main.';
      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('gh', [
        'pr',
        'create',
        '--base',
        'development',
        '--head',
        'main',
        '--title',
        title,
        '--body',
        body,
      ]);
    });

    it('Should return error when creating pull request throws', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.createPullRequest('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });
});
