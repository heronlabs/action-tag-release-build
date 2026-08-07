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
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: `${faker.number.int({min: 10, max: 99})}`,
      });

      const output = service.hasPullRequest(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: true,
      });
    });

    it('Should return false when no open pull request exists', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '0',
      });

      const output = service.hasPullRequest(ref, environment);

      expect(output).toStrictEqual({
        ok: true,
        data: false,
      });
    });

    it('Should call exec with gh pr list command', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '0',
      });

      service.hasPullRequest(ref, environment);

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('gh', [
        'pr',
        'list',
        '--base',
        environment,
        '--head',
        ref,
        '--state',
        'open',
        '--json',
        'isCrossRepository',
        '--jq',
        '[.[] | select(.isCrossRepository | not)] | length',
      ]);
    });

    it('Should return error listing pull requests', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

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

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error when the count is not a number', () => {
      const unexpectedOutput = faker.lorem.sentence();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: unexpectedOutput,
      });

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error: new Error(`Unexpected gh pr list output: ${unexpectedOutput}`),
      });
    });

    it('Should return error when the count only ends with digits', () => {
      const unexpectedOutput = `gh: error ${faker.number.int({min: 100, max: 599})}`;
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: unexpectedOutput,
      });

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error: new Error(`Unexpected gh pr list output: ${unexpectedOutput}`),
      });
    });

    it('Should return error when the count only starts with digits', () => {
      const unexpectedOutput = `0 ${faker.lorem.word()}`;
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: unexpectedOutput,
      });

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error: new Error(`Unexpected gh pr list output: ${unexpectedOutput}`),
      });
    });

    it('Should return error when the output is empty', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      const output = service.hasPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: false,
        error: new Error('Unexpected gh pr list output: '),
      });
    });
  });

  describe('Given create pull request', () => {
    it('Should create pull request', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      const output = service.createPullRequest(
        faker.git.branch(),
        faker.git.branch(),
      );

      expect(output).toStrictEqual({
        ok: true,
        data: 'OK',
      });
    });

    it('Should call exec with gh pr create command', () => {
      const ref = faker.git.branch();
      const environment = faker.git.branch();
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: 'OK',
      });

      service.createPullRequest(ref, environment);

      const title = `🔗 Sync ${ref} into ${environment}`;
      const body =
        `Automatic sync of ${ref} into ${environment} failed.\n\n` +
        `Merge this pull request to sync ${environment} with ${ref}.`;
      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('gh', [
        'pr',
        'create',
        '--base',
        environment,
        '--head',
        ref,
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

      const output = service.createPullRequest(
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
