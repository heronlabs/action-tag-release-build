import {faker} from '@faker-js/faker';

import {SyncService} from '../../../../src/core/services/sync-service';
import {
  GitServiceMock,
  GitServiceMoq,
} from '../../../__mocks__/infrastructure/git-service-mock';
import {
  PullRequestServiceMock,
  PullRequestServiceMoq,
} from '../../../__mocks__/infrastructure/pull-request-service-mock';

describe('Given a sync service', () => {
  let service: SyncService;

  beforeEach(() => {
    service = new SyncService(GitServiceMoq, PullRequestServiceMoq);
  });

  describe('Given cascade environments', () => {
    it('Should sync single environment', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      const output = service.cascadeEnvironments('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: ['development => main'],
      });
    });

    it('Should sync multiple environments trimming whitespace', () => {
      GitServiceMock.mergeWithoutCommit
        .mockReturnValueOnce({
          ok: true,
          data: '',
        })
        .mockReturnValueOnce({
          ok: true,
          data: '',
        });

      const output = service.cascadeEnvironments(
        'main',
        ' development, sandbox ',
      );

      expect(output).toStrictEqual({
        ok: true,
        data: ['development => main', 'sandbox => main'],
      });
    });

    it('Should call merge without commit with ref and environment', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      service.cascadeEnvironments('main', 'development');

      expect(GitServiceMock.mergeWithoutCommit).toHaveBeenCalledWith(
        'main',
        'development',
      );
    });

    it('Should mark environment as not synced when merge fails', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: true,
      });

      const output = service.cascadeEnvironments('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: ['development xx main'],
      });
    });

    it('Should create pull request when merge fails and none open', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: false,
      });
      PullRequestServiceMock.createPullRequest.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.cascadeEnvironments('main', 'development');

      expect(PullRequestServiceMock.createPullRequest).toHaveBeenCalledWith(
        'main',
        'development',
      );
    });

    it('Should mark PR created when pull request creation succeeds', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: false,
      });
      PullRequestServiceMock.createPullRequest.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      const output = service.cascadeEnvironments('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: ['development xx main (PR created)'],
      });
    });

    it('Should mark PR creation failure when pull request creation fails', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: false,
      });
      PullRequestServiceMock.createPullRequest.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      const output = service.cascadeEnvironments('main', 'development');

      expect(output).toStrictEqual({
        ok: true,
        data: ['development xx main (PR creation failed)'],
      });
    });

    it('Should not create pull request when one already open', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: true,
      });

      service.cascadeEnvironments('main', 'development');

      expect(PullRequestServiceMock.createPullRequest).not.toHaveBeenCalled();
    });

    it('Should not create pull request when listing pull requests fails', () => {
      GitServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      service.cascadeEnvironments('main', 'development');

      expect(PullRequestServiceMock.createPullRequest).not.toHaveBeenCalled();
    });

    it('Should filter empty environment names from consecutive commas', () => {
      GitServiceMock.mergeWithoutCommit
        .mockReturnValueOnce({
          ok: true,
          data: '',
        })
        .mockReturnValueOnce({
          ok: true,
          data: '',
        });

      const output = service.cascadeEnvironments('main', 'sandbox,,staging');

      expect(output).toStrictEqual({
        ok: true,
        data: ['sandbox => main', 'staging => main'],
      });
    });

    it('Should return error when merge throws', () => {
      const error = new Error(faker.lorem.sentence());
      GitServiceMock.mergeWithoutCommit.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.cascadeEnvironments('main', 'development');

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });
});
