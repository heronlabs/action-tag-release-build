import {faker} from '@faker-js/faker';

import {GitService} from '../../../../src/infrastructure/git/services/git-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../__mocks__/infrastructure/child-process-service-mock';

describe('Given a git service', () => {
  let service: GitService;

  beforeEach(() => {
    service = new GitService(ChildProcessServiceMoq);
  });

  describe('Given get last commit', () => {
    it('Should get last commit', () => {
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

    it('Should return error getting last commit', () => {
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

    it('Should call exec with git log format command', () => {
      ChildProcessServiceMock.exec.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      service.getLastCommit();

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith(
        'git log -1 --pretty=%B',
      );
    });
  });

  describe('Given get description since', () => {
    it('Should get descriptions since last version', () => {
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

    it('Should get all descriptions', () => {
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

    it('Should call git describe with tag prefix match pattern', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: 'v5'})
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('v');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(
        1,
        'git describe --tags --abbrev=0 --match "v*" HEAD',
      );
    });

    it('Should call git log with range when previous tag found', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: 'v5'})
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('v');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(
        2,
        'git log --pretty=format:"%H %s" v5..HEAD',
      );
    });

    it('Should call git log with empty range when no previous tag found', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({
          ok: false,
          error: new Error(faker.lorem.sentence()),
        })
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('v');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(
        2,
        'git log --pretty=format:"%H %s" ',
      );
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
        ref: 'main',
      };
      service.applyTags(input);

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
        ref: 'main',
        tags: {
          major: 'v1',
          minor: 'v2',
        },
      };
      service.applyTags(input);

      expect(execChainMock).toHaveBeenCalledTimes(11);
    });

    it('Should return error tagging', () => {
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
        ref: 'main',
      };
      const output = service.applyTags(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error for pushing new tag', () => {
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
        ref: 'main',
      };
      const output = service.applyTags(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should return error for pushing new override tags', () => {
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
        ref: 'main',
        tags: {
          major: 'v1',
          minor: 'v2',
        },
      };
      const output = service.applyTags(input);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should call git config user name on first chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        1,
        'git config user.name  "github-actions[bot]"',
      );
    });

    it('Should call git config user email on second chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        2,
        'git config user.email "github-actions[bot]@users.noreply.github.com"',
      );
    });

    it('Should call git add on third chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        3,
        'git add -A',
      );
    });

    it('Should call git commit with skip ci message and version tag', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        4,
        'git commit -m "[skip ci] bump v1.2.3"',
      );
    });

    it('Should call git pull rebase with origin and ref name', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        5,
        'git pull --rebase origin "main"',
      );
    });

    it('Should call git tag with annotated tag and release message', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        6,
        'git tag -a "v1.2.3" -m "Release 1.2.3"',
      );
    });

    it('Should call git push with follow tags on final step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        7,
        'git push --follow-tags',
      );
    });

    it('Should call git tag force for major override on seventh step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        7,
        'git tag -fa "v1" -m "Latest v1.x.x release"',
      );
    });

    it('Should call git push with follow tags after override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        9,
        'git push --follow-tags',
      );
    });

    it('Should call git push force for major override tag on tenth step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        10,
        'git push origin "v1" --force',
      );
    });

    it('Should call git push force for minor override tag on eleventh step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        11,
        'git push origin "v2" --force',
      );
    });

    it('Should stop chaining after sixth call when tagging fails', () => {
      const error = new Error(faker.lorem.sentence());
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce({
          ok: true as const,
          data: 'OK',
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        })
        .mockReturnValueOnce({
          ok: true as const,
          data: 'OK',
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        })
        .mockReturnValueOnce({
          ok: true as const,
          data: 'OK',
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        })
        .mockReturnValueOnce({
          ok: true as const,
          data: 'OK',
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        })
        .mockReturnValueOnce({
          ok: true as const,
          data: 'OK',
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        })
        .mockReturnValueOnce({
          ok: false as const,
          error,
          execChain: (nextCommand: string) =>
            ChildProcessServiceMock.execChain(nextCommand),
        });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(6);
    });

    it('Should return ok true when apply succeeds without override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
      });

      expect(output).toStrictEqual({ok: true});
    });

    it('Should return ok true when apply succeeds with override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(output).toStrictEqual({ok: true});
    });

    it('Should call git tag force for minor override on eighth step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (nextCommand: string) =>
          ChildProcessServiceMock.execChain(nextCommand),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        8,
        'git tag -fa "v2" -m "Latest v2.x release"',
      );
    });
  });
});
