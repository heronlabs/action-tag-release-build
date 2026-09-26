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

  describe('Given reset to remote', () => {
    const success = (data = 'OK') => ({
      ok: true as const,
      data,
      execChain: (command: string, args: string[] = []) =>
        ChildProcessServiceMock.execChain(command, args),
    });

    it('Should fetch the ref and the tags from origin', () => {
      ChildProcessServiceMock.execChain.mockReturnValue(success());

      service.resetToRemote('main');

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        1,
        'git',
        [
          'fetch',
          '--force',
          '--tags',
          'origin',
          'refs/heads/main:refs/remotes/origin/main',
        ],
      );
    });

    it('Should hard reset the working copy to the fetched tip', () => {
      ChildProcessServiceMock.execChain.mockReturnValue(success());

      service.resetToRemote('main');

      expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
        2,
        'git',
        ['reset', '--hard', 'refs/remotes/origin/main'],
      );
    });

    it('Should return the reset output', () => {
      const data = faker.lorem.sentence();
      ChildProcessServiceMock.execChain
        .mockReturnValueOnce(success())
        .mockReturnValueOnce(success(data));

      const output = service.resetToRemote('main');

      expect(output).toStrictEqual({ok: true, data});
    });

    it('Should return the fetch error', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {ok: false as const, error, execChain: () => failure};
      ChildProcessServiceMock.execChain.mockReturnValueOnce(failure);

      const output = service.resetToRemote('main');

      expect(output).toStrictEqual({ok: false, error});
    });

    it('Should not reset when the fetch fails', () => {
      const error = new Error(faker.lorem.sentence());
      const failure = {ok: false as const, error, execChain: () => failure};
      ChildProcessServiceMock.execChain.mockReturnValueOnce(failure);

      service.resetToRemote('main');

      expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given apply', () => {
    const sha = faker.git.commitSha();

    const respond = (failing?: {step: string; error: Error}) =>
      ChildProcessServiceMock.execChain.mockImplementation(
        (command: string, args: string[]) => {
          if (failing && args[0] === failing.step) {
            const failure = {
              ok: false as const,
              error: failing.error,
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

    const withoutTags = {version: '1.2.3', tag: 'v1.2.3', ref: 'main'};
    const withTags = {...withoutTags, tags: {major: 'v1', minor: 'v1.2'}};

    describe('Given every step succeeds without override tags', () => {
      beforeEach(() => {
        respond();
      });

      it('Should run seven chain steps', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(7);
      });

      it('Should set the git user name first', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          1,
          'git',
          ['config', 'user.name', 'github-actions[bot]'],
        );
      });

      it('Should set the git user email second', () => {
        service.applyTags(withoutTags);

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

      it('Should stage every change third', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          3,
          'git',
          ['add', '-A'],
        );
      });

      it('Should commit with the skip ci bump message', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          4,
          'git',
          ['commit', '-m', '[skip ci] bump v1.2.3'],
        );
      });

      it('Should force the annotated version tag with release message', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          5,
          'git',
          ['tag', '-fa', 'v1.2.3', '-m', 'Release 1.2.3'],
        );
      });

      it('Should push branch and exact tag atomically', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          6,
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

      it('Should read the head sha last', () => {
        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          7,
          'git',
          ['rev-parse', 'HEAD'],
        );
      });

      it('Should never pull nor rebase', () => {
        service.applyTags(withoutTags);

        const pulls = ChildProcessServiceMock.execChain.mock.calls.filter(
          ([, args]) => args[0] === 'pull' || args[0] === 'rebase',
        );
        expect(pulls).toHaveLength(0);
      });

      it('Should return the head sha', () => {
        const output = service.applyTags(withoutTags);

        expect(output).toStrictEqual({ok: true, data: sha});
      });
    });

    describe('Given every step succeeds with override tags', () => {
      beforeEach(() => {
        respond();
      });

      it('Should run nine chain steps', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(9);
      });

      it('Should force the major tag after the version tag', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          6,
          'git',
          ['tag', '-fa', 'v1', '-m', 'Latest v1.x.x release'],
        );
      });

      it('Should force the minor tag after the major tag', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          7,
          'git',
          ['tag', '-fa', 'v1.2', '-m', 'Latest v1.2.x release'],
        );
      });

      it('Should push branch, exact tag and floating tags atomically', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          8,
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

      it('Should read the head sha last', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenNthCalledWith(
          9,
          'git',
          ['rev-parse', 'HEAD'],
        );
      });

      it('Should return the head sha', () => {
        const output = service.applyTags(withTags);

        expect(output).toStrictEqual({ok: true, data: sha});
      });
    });

    describe('Given the commit fails', () => {
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        respond({step: 'commit', error});
      });

      it('Should return the commit error as not a moved ref', () => {
        const output = service.applyTags(withTags);

        expect(output).toStrictEqual({ok: false, error, refMoved: false});
      });

      it('Should stop before tagging and pushing', () => {
        service.applyTags(withTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(4);
      });
    });

    describe('Given a floating tag fails', () => {
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        respond({step: 'tag', error});
      });

      it('Should return the tag error as not a moved ref', () => {
        const output = service.applyTags(withTags);

        expect(output).toStrictEqual({ok: false, error, refMoved: false});
      });

      it('Should not push', () => {
        service.applyTags(withTags);

        const pushes = ChildProcessServiceMock.execChain.mock.calls.filter(
          ([, args]) => args[0] === 'push',
        );
        expect(pushes).toHaveLength(0);
      });
    });

    describe('Given the push is rejected', () => {
      const pushError = (stderr: string) =>
        new Error(`Command failed: git push --atomic origin\n${stderr}\n`);

      it.each([
        ' ! [rejected]        main -> main (fetch first)',
        ' ! [rejected]        main -> main (non-fast-forward)',
        ' ! [rejected]        main -> main (stale info)',
        " ! [remote rejected] main -> main (cannot lock ref 'refs/heads/main': is at 1a2b but expected 3c4d)",
      ])('Should flag %s as a moved ref', stderr => {
        const error = pushError(stderr);
        respond({step: 'push', error});

        const output = service.applyTags(withoutTags);

        expect(output).toStrictEqual({ok: false, error, refMoved: true});
      });

      it.each([
        ' ! [remote rejected] main -> main (pre-receive hook declined)',
        'remote: fetch first, non-fast-forward and stale info are banned words\n ! [remote rejected] main -> main (pre-receive hook declined)',
        "remote: Permission to heronlabs/repo.git denied to github-actions[bot].\nfatal: unable to access 'https://github.com/heronlabs/repo.git/': The requested URL returned error: 403",
        "fatal: unable to access 'https://github.com/heronlabs/repo.git/': Could not resolve host: github.com",
      ])('Should not flag %s as a moved ref', stderr => {
        const error = pushError(stderr);
        respond({step: 'push', error});

        const output = service.applyTags(withoutTags);

        expect(output).toStrictEqual({ok: false, error, refMoved: false});
      });

      it('Should not read the head sha', () => {
        respond({
          step: 'push',
          error: pushError(' ! [rejected] (fetch first)'),
        });

        service.applyTags(withoutTags);

        expect(ChildProcessServiceMock.execChain).toHaveBeenCalledTimes(6);
      });
    });

    describe('Given reading the head sha fails', () => {
      const error = new Error(faker.lorem.sentence());

      beforeEach(() => {
        respond({step: 'rev-parse', error});
      });

      it('Should return the error as not a moved ref', () => {
        const output = service.applyTags(withoutTags);

        expect(output).toStrictEqual({ok: false, error, refMoved: false});
      });
    });
  });
});
