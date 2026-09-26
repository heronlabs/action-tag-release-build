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

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(1, 'git', [
        'describe',
        '--tags',
        '--abbrev=0',
        '--match',
        'v[0-9]*',
        'HEAD',
      ]);
    });

    it('Should call git describe with a digit anchored match for custom prefix', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: 'release-5'})
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('release-');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(1, 'git', [
        'describe',
        '--tags',
        '--abbrev=0',
        '--match',
        'release-[0-9]*',
        'HEAD',
      ]);
    });

    it('Should call git log with range when previous tag found', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: 'v5'})
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('v');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'git', [
        'log',
        '--no-merges',
        '--pretty=format:%H %s%n%b%x1e',
        'v5..HEAD',
      ]);
    });

    it('Should call git log with empty range when no previous tag found', () => {
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({
          ok: false,
          error: new Error(faker.lorem.sentence()),
        })
        .mockReturnValueOnce({ok: true, data: ''});

      service.getDescriptionSince('v');

      expect(ChildProcessServiceMock.exec).toHaveBeenNthCalledWith(2, 'git', [
        'log',
        '--no-merges',
        '--pretty=format:%H %s%n%b%x1e',
      ]);
    });

    it('Should exclude merge commits from the descriptions', () => {
      const feature = `${faker.string.alpha(40)} feat(scope): add some feature`;
      const merge = `${faker.string.alpha(40)} Merge pull request #4 from heronlabs/feat-scope`;
      ChildProcessServiceMock.exec
        .mockReturnValueOnce({ok: true, data: 'v5'})
        .mockImplementationOnce((command: string, args: string[]) => ({
          ok: true,
          data: args.includes('--no-merges') ? feature : `${merge}\n${feature}`,
        }));

      const output = service.getDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: feature});
    });
  });

  describe('Given apply', () => {
    it('Should run eight chain steps without override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(8);
    });

    it('Should run ten chain steps with override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(10);
    });

    it('Should call git config user name on first chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        1,
        'git',
        ['config', 'user.name', 'github-actions[bot]'],
      );
    });

    it('Should call git config user email on second chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        2,
        'git',
        [
          'config',
          'user.email',
          'github-actions[bot]@users.noreply.github.com',
        ],
      );
    });

    it('Should call git add on third chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        3,
        'git',
        ['add', '-A'],
      );
    });

    it('Should call git commit with skip ci message and version tag', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        4,
        'git',
        ['commit', '-m', '[skip ci] bump v1.2.3'],
      );
    });

    it('Should call git pull rebase with origin and ref name', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        5,
        'git',
        ['pull', '--rebase', 'origin', 'main'],
      );
    });

    it('Should force the annotated version tag with release message', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        6,
        'git',
        ['tag', '-fa', 'v1.2.3', '-m', 'Release 1.2.3'],
      );
    });

    it('Should push branch and exact tag atomically without override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        7,
        'git',
        [
          'push',
          '--atomic',
          'origin',
          'refs/heads/main:refs/heads/main',
          'refs/tags/v1.2.3',
        ],
      );
    });

    it('Should read head sha on eighth chain step without override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        8,
        'git',
        ['rev-parse', 'HEAD'],
      );
    });

    it('Should call git tag force for major override on seventh chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        7,
        'git',
        ['tag', '-fa', 'v1', '-m', 'Latest v1.x.x release'],
      );
    });

    it('Should call git tag force for minor override on eighth chain step', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        8,
        'git',
        ['tag', '-fa', 'v1.2', '-m', 'Latest v1.2.x release'],
      );
    });

    it('Should push branch, exact tag and floating tags atomically', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        9,
        'git',
        [
          'push',
          '--atomic',
          'origin',
          'refs/heads/main:refs/heads/main',
          'refs/tags/v1.2.3',
          '+refs/tags/v1',
          '+refs/tags/v1.2',
        ],
      );
    });

    it('Should read head sha on tenth chain step with override tags', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        10,
        'git',
        ['rev-parse', 'HEAD'],
      );
    });

    it('Should return the head sha when apply succeeds without override tags', () => {
      const sha = faker.git.commitSha();
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce({...success, data: sha});

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
      });

      expect(output).toStrictEqual({ok: true, data: sha});
    });

    it('Should return the head sha when apply succeeds with override tags', () => {
      const sha = faker.git.commitSha();
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce({...success, data: sha});

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(output).toStrictEqual({ok: true, data: sha});
    });

    it('Should not abort the rebase when apply succeeds', () => {
      ChildProcessServiceMock.execChain.mockReturnValue({
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      });

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.exec).not.toHaveBeenCalledWith('git', [
        'rebase',
        '--abort',
      ]);
    });

    it('Should return error tagging', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
      });

      expect(output).toStrictEqual({ok: false, error});
    });

    it('Should stop each attempt at its failing step', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(8);
    });

    it('Should abort the rebase when a chain step fails', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

      expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('git', [
        'rebase',
        '--abort',
      ]);
    });

    it('Should return error for pushing new tag', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
      });

      expect(output).toStrictEqual({ok: false, error});
    });

    it('Should return error for pushing new override tags', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
        tags: {major: 'v1', minor: 'v1.2'},
      });

      expect(output).toStrictEqual({ok: false, error});
    });

    it('Should return error reading the head sha', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {
        ok: false as const,
        error,
        execChain: () => failure,
      };
      const success = {
        ok: true as const,
        data: 'OK',
        execChain: (command: string, args: string[] = []) =>
          ChildProcessServiceMock.execChain(command, args),
      };
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValueOnce(success)
        .mockReturnValue(failure);

      const output = service.applyTags({
        version: '1.2.3',
        tag: 'v1.2.3',
        ref: 'main',
      });

      expect(output).toStrictEqual({ok: false, error});
    });

    describe('Given the commit fails', () => {
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        const failure = {
          ok: false as const,
          error,
          execChain: () => failure,
        };
        const success = {
          ok: true as const,
          data: 'OK',
          execChain: (command: string, args: string[] = []) =>
            ChildProcessServiceMock.execChain(command, args),
        };
        ChildProcessServiceMock.execChain
          .mockReturnValueOnce(success)
          .mockReturnValueOnce(success)
          .mockReturnValueOnce(success)
          .mockReturnValueOnce(failure)
          .mockReturnValue(success);
      });

      it('Should return the commit error', () => {
        const output = service.applyTags({
          version: '1.2.3',
          tag: 'v1.2.3',
          ref: 'main',
        });

        expect(output).toStrictEqual({ok: false, error});
      });

      it('Should not pull, tag or push', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(4);
      });
    });

    describe('Given the push is rejected once', () => {
      const sha = faker.git.commitSha();
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        let rejections = 1;
        ChildProcessServiceMock.execChain.mockImplementation(
          (command: string, args: string[]) => {
            if (args[0] === 'push' && rejections-- > 0) {
              const failure = {
                ok: false as const,
                error,
                execChain: () => failure,
              };
              return failure;
            }
            return {
              ok: true as const,
              data: args[0] === 'rev-parse' ? sha : 'OK',
              execChain: (next: string, nextArgs: string[] = []) =>
                ChildProcessServiceMock.execChain(next, nextArgs),
            };
          },
        );
      });

      it('Should return the head sha of the second attempt', () => {
        const output = service.applyTags({
          version: '1.2.3',
          tag: 'v1.2.3',
          ref: 'main',
        });

        expect(output).toStrictEqual({ok: true, data: sha});
      });

      it('Should commit once and run two attempts', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(11);
      });

      it('Should pull again before the second push', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          8,
          'git',
          ['pull', '--rebase', 'origin', 'main'],
        );
      });

      it('Should recreate the version tag on the new head', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          9,
          'git',
          ['tag', '-fa', 'v1.2.3', '-m', 'Release 1.2.3'],
        );
      });

      it('Should abort the rebase once', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.exec).toHaveBeenCalledTimes(1);
      });

      it('Should commit a single bump', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        const commits = ChildProcessServiceMock.execChain.mock.calls.filter(
          ([, args]) => args[0] === 'commit',
        );
        expect(commits).toHaveLength(1);
      });
    });

    describe('Given the push is rejected on every attempt', () => {
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        ChildProcessServiceMock.execChain.mockImplementation(
          (command: string, args: string[]) => {
            if (args[0] === 'push') {
              const failure = {
                ok: false as const,
                error,
                execChain: () => failure,
              };
              return failure;
            }
            return {
              ok: true as const,
              data: 'OK',
              execChain: (next: string, nextArgs: string[] = []) =>
                ChildProcessServiceMock.execChain(next, nextArgs),
            };
          },
        );
      });

      it('Should return the push error after the last attempt', () => {
        const output = service.applyTags({
          version: '1.2.3',
          tag: 'v1.2.3',
          ref: 'main',
        });

        expect(output).toStrictEqual({ok: false, error});
      });

      it('Should stop after three attempts', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        const pushes = ChildProcessServiceMock.execChain.mock.calls.filter(
          ([, args]) => args[0] === 'push',
        );
        expect(pushes).toHaveLength(3);
      });

      it('Should commit once and run three attempts', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(13);
      });

      it('Should abort the rebase after each attempt', () => {
        service.applyTags({version: '1.2.3', tag: 'v1.2.3', ref: 'main'});

        expect(ChildProcessServiceMock.exec).toHaveBeenCalledTimes(3);
      });
    });
  });
});
