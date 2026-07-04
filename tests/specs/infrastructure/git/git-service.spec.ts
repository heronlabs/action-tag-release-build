import {faker} from '@faker-js/faker';

import {GitService} from '../../../../src/infrastructure/git/git-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

describe('Given a git service', () => {
  let service: GitService;

  beforeEach(() => {
    service = new GitService(ChildProcessServiceMoq);
  });

  describe('Given get last commit', () => {
    it('Should return last commit', () => {
      const data =
        'feat(scope)!: add some feature\nfix: add some other feature';
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data,
      });

      const output = service.getLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data,
      });
    });

    it('Should throw error getting last commit', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.getLastCommit();

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });

  describe('Given get description since', () => {
    it('Should return descriptions since last version', () => {
      const data = `${faker.string.alpha(40)} feat(scope)!: add some feature\n`;
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({
          ok: true,
          data: 'v5',
        })
        .mockReturnValueOnce({
          ok: true,
          data,
        });

      const output = service.getDescriptionSince('v');

      expect(output).toStrictEqual({
        ok: true,
        data,
      });
    });

    it('Should return all descriptions', () => {
      const data = `${faker.string.alpha(40)} feat(scope)!: add some feature\n`;
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({
          ok: false,
          error: new Error(faker.lorem.sentence()),
        })
        .mockReturnValueOnce({
          ok: true,
          data,
        });

      const output = service.getDescriptionSince('v');

      expect(output).toStrictEqual({
        ok: true,
        data,
      });
    });
  });

  describe('Given apply', () => {
    it('Should add, commit and push the new tag', () => {
      const execChainMock = ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      const input = {
        version: '1.2.3',
        tag: 'v1.2.3',
        refName: 'main',
      };
      service.apply(input);

      expect(execChainMock).toHaveBeenCalledTimes(7);
    });

    it('Should add, commit and push the new tags including override', () => {
      const execChainMock = ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      const input = {
        version: '1.2.3',
        tag: 'v1.2.3',
        refName: 'main',
        tags: {
          major: 'v1',
          minor: 'v2',
        },
      };
      service.apply(input);

      expect(execChainMock).toHaveBeenCalledTimes(9);
    });

    it('Should throw error tagging', () => {
      const error = new Error(faker.lorem.sentence());
      const result = {
        ok: false as const,
        error,
        execChain: () => result,
      };
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: false as const,
        error,
        execChain: () => result,
      });

      const input = {
        version: '1.2.3',
        tag: 'v1.2.3',
        refName: 'main',
      };
      const output = service.apply(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should throw pushing new tag', () => {
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      };
      const error = new Error(faker.lorem.sentence());
      const result = {
        ok: false as const,
        error,
        execChain: () => result,
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue({
          ok: false as const,
          error,
          execChain: () => result,
        });

      const input = {
        version: '1.2.3',
        tag: 'v1.2.3',
        refName: 'main',
      };
      const output = service.apply(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should throw pushing new override tags', () => {
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      };
      const error = new Error(faker.lorem.sentence());
      const result = {
        ok: false as const,
        error,
        execChain: () => result,
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue({
          ok: false as const,
          error,
          execChain: () => result,
        });

      const input = {
        version: '1.2.3',
        tag: 'v1.2.3',
        refName: 'main',
        tags: {
          major: 'v1',
          minor: 'v2',
        },
      };
      const output = service.apply(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });
  });
});
