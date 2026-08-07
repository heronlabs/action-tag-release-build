import {faker} from '@faker-js/faker';

import {SyncService} from '../../../../src/core/services/sync-service';
import {
  MergeServiceMock,
  MergeServiceMoq,
} from '../../../__mocks__/infrastructure/merge-service-mock';
import {
  PullRequestServiceMock,
  PullRequestServiceMoq,
} from '../../../__mocks__/infrastructure/pull-request-service-mock';

describe('Given a sync service', () => {
  let service: SyncService;

  beforeEach(() => {
    service = new SyncService(PullRequestServiceMoq, MergeServiceMoq);
  });

  describe('Given cascade environments', () => {
    it('Should sync single environment', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      const sha = faker.git.commitSha();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: true,
        data: sha,
      });

      const output = service.cascadeEnvironments(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: [{ok: true, ref, target: environment, sha}],
      });
    });

    it('Should sync multiple environments trimming whitespace', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      const otherEnvironment = `${environment}-${faker.git.branch()}`;
      const sha = faker.git.commitSha();
      MergeServiceMock.mergeWithoutCommit
        .mockReturnValueOnce({
          ok: true,
          data: sha,
        })
        .mockReturnValueOnce({
          ok: true,
          data: sha,
        });

      const output = service.cascadeEnvironments(
        ref,
        ` ${environment}, ${otherEnvironment} `,
      );

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {ok: true, ref, target: environment, sha},
          {ok: true, ref, target: otherEnvironment, sha},
        ],
      });
    });

    it('Should call merge without commit with ref and environment', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      service.cascadeEnvironments(ref, environment);

      expect(MergeServiceMock.mergeWithoutCommit).toHaveBeenCalledWith(
        ref,
        environment,
      );
    });

    it('Should sync environment when merge commit enabled', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      const sha = faker.git.commitSha();
      MergeServiceMock.mergeWithCommit.mockReturnValueOnce({
        ok: true,
        data: sha,
      });

      const output = service.cascadeEnvironments(ref, environment, true);

      expect(output).toStrictEqual({
        ok: true,
        data: [{ok: true, ref, target: environment, sha}],
      });
    });

    it('Should call merge with commit with ref and environment', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithCommit.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.cascadeEnvironments(ref, environment, true);

      expect(MergeServiceMock.mergeWithCommit).toHaveBeenCalledWith(
        ref,
        environment,
      );
    });

    it('Should not merge without commit when merge commit enabled', () => {
      MergeServiceMock.mergeWithCommit.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.cascadeEnvironments(faker.git.branch(), faker.git.branch(), true);

      expect(MergeServiceMock.mergeWithoutCommit).not.toHaveBeenCalled();
    });

    it('Should mark environment as not synced when merge fails', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: true,
      });

      const output = service.cascadeEnvironments(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            ok: false,
            error: `Merging ${ref} into ${environment} failed, open PR already exists;`,
          },
        ],
      });
    });

    it('Should create pull request when merge fails and none open', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
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

      service.cascadeEnvironments(ref, environment);

      expect(PullRequestServiceMock.createPullRequest).toHaveBeenCalledWith(
        ref,
        environment,
      );
    });

    it('Should mark PR created when pull request creation succeeds', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
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

      const output = service.cascadeEnvironments(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            ok: false,
            error: `Merging ${ref} into ${environment} failed, no PR found. PR created;`,
          },
        ],
      });
    });

    it('Should mark PR creation failure when pull request creation fails', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
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

      const output = service.cascadeEnvironments(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            ok: false,
            error: `Merging ${ref} into ${environment} failed, no PR found. Then PR creation failed;`,
          },
        ],
      });
    });

    it('Should not create pull request when one already open', () => {
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: true,
        data: true,
      });

      service.cascadeEnvironments(faker.git.branch(), faker.git.branch());

      expect(PullRequestServiceMock.createPullRequest).not.toHaveBeenCalled();
    });

    it('Should not create pull request when listing pull requests fails', () => {
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      service.cascadeEnvironments(faker.git.branch(), faker.git.branch());

      expect(PullRequestServiceMock.createPullRequest).not.toHaveBeenCalled();
    });

    it('Should report the lookup failure when listing pull requests fails', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      MergeServiceMock.mergeWithoutCommit.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });
      PullRequestServiceMock.hasPullRequest.mockReturnValueOnce({
        ok: false,
        error: new Error(faker.lorem.sentence()),
      });

      const output = service.cascadeEnvironments(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            ok: false,
            error: `Merging ${ref} into ${environment} failed, then checking for open PR failed too;`,
          },
        ],
      });
    });

    it('Should filter empty environment names from consecutive commas', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      const otherEnvironment = `${environment}-${faker.git.branch()}`;
      const sha = faker.git.commitSha();
      MergeServiceMock.mergeWithoutCommit
        .mockReturnValueOnce({
          ok: true,
          data: sha,
        })
        .mockReturnValueOnce({
          ok: true,
          data: sha,
        });

      const output = service.cascadeEnvironments(
        ref,
        `${environment},,${otherEnvironment}`,
      );

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {ok: true, ref, target: environment, sha},
          {ok: true, ref, target: otherEnvironment, sha},
        ],
      });
    });

    it('Should return error when merge throws', () => {
      const error = new Error(faker.lorem.sentence());
      MergeServiceMock.mergeWithoutCommit.mockImplementationOnce(() => {
        throw error;
      });

      const output = service.cascadeEnvironments(
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
