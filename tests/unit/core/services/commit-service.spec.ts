import {faker} from '@faker-js/faker';

import {CommitService} from '../../../../src/core/services/commit-service';
import {
  GitServiceMock,
  GitServiceMoq,
} from '../../../__mocks__/infrastructure/git-service-mock';

describe('Given a commit service', () => {
  let service: CommitService;

  beforeEach(() => {
    service = new CommitService(GitServiceMoq);
  });

  describe('Given parse description method', () => {
    it('Should get get descriptions for conventional commits with breaking changes and scope', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat(scope)!: add some feature\n${faker.string.alpha(40)} feat(scope)!: add some other feature`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: expect.arrayContaining([
          {
            hash,
            type: 'feat',
            scope: 'scope',
            breaking: true,
            description: 'add some feature',
          },
        ]),
      });
    });

    it('Should get get descriptions for conventional commits with breaking changes and without scope', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat!: add some feature`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: true,
            description: 'add some feature',
          },
        ],
      });
    });

    it('Should get get descriptions for conventional commits without breaking changes and scope', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat: add some feature`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: false,
            description: 'add some feature',
          },
        ],
      });
    });

    it('Should get get descriptions for non conventional commits', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} add some feature`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            breaking: false,
            description: 'add some feature',
          },
        ],
      });
    });

    it('Should return error getting description since last version', () => {
      const error = new Error(faker.lorem.sentence());
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: false,
        error,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should filter empty and whitespace-only lines from commit data', () => {
      const hash = faker.string.alpha(40);
      const hash2 = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat: add feature\n\n  \n${hash2} fix: fix bug`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: false,
            description: 'add feature',
          },
          {
            hash: hash2,
            type: 'fix',
            scope: undefined,
            breaking: false,
            description: 'fix bug',
          },
        ],
      });
    });

    it('Should not match conventional commit pattern when not at start of subject', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} prefix text feat: add feature`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            breaking: false,
            description: 'prefix text feat: add feature',
          },
        ],
      });
    });

    it('Should match conventional commit without space after colon', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat:message`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: false,
            description: 'message',
          },
        ],
      });
    });

    it('Should match conventional commit with space before colon', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat : message`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: false,
            description: 'message',
          },
        ],
      });
    });

    it('Should match conventional commit with trailing text after message', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat: add feature more text here`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'feat',
            scope: undefined,
            breaking: false,
            description: 'add feature more text here',
          },
        ],
      });
    });

    it('Should return error parsing descriptions', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: {},
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('Given classify last commit method', () => {
    it('Should get last commit for major', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: 'feat(scope)!: add some feature\nfix: add some other feature',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'major',
      });
    });

    it('Should get last commit for minor', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: 'feat(scope): add some feature\nfix: add some other feature',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'minor',
      });
    });

    it('Should get last commit for patch', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: 'fix(scope): add some feature\nfix: add some other feature',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'patch',
      });
    });

    it('Should get patch for empty last commit', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'patch',
      });
    });

    it('Should return error getting last commit', () => {
      const error = new Error(faker.lorem.sentence());
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should filter whitespace-only lines in last commit', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: '   \nfeat: add feature',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'minor',
      });
    });

    it('Should return patch when all lines are whitespace only', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: '   \n\t\n',
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: true,
        data: 'patch',
      });
    });

    it('Should return error parsing last commit', () => {
      GitServiceMock.getLastCommit.mockReturnValueOnce({
        ok: true,
        data: {},
      });

      const output = service.classifyLastCommit();

      expect(output).toStrictEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });
});
