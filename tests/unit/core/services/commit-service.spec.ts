import {faker} from '@faker-js/faker';

import {CommitService} from '../../../../src/core/services/commit-service';
import {COMMIT_RECORD_SEPARATOR} from '../../../../src/infrastructure/git/types/commit-record-separator';
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
        data: `${hash} feat(scope)!: add some feature${COMMIT_RECORD_SEPARATOR}${faker.string.alpha(40)} feat(scope)!: add some other feature`,
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
            breakingDescription: undefined,
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
            breakingDescription: undefined,
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
            breakingDescription: undefined,
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
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
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

    it('Should filter empty and whitespace-only records from commit data', () => {
      const hash = faker.string.alpha(40);
      const hash2 = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: [
          `${hash} feat: add feature`,
          '',
          '  ',
          `${hash2} fix: fix bug`,
        ].join(COMMIT_RECORD_SEPARATOR),
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
            breakingDescription: undefined,
            description: 'add feature',
          },
          {
            hash: hash2,
            type: 'fix',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
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
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
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
            breakingDescription: undefined,
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
            breakingDescription: undefined,
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
            breakingDescription: undefined,
            description: 'add feature more text here',
          },
        ],
      });
    });

    it('Should handle unknown commit types', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} chore: update dependencies`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: 'update dependencies',
          },
        ],
      });
    });

    it('Should flag a breaking change declared in the commit body footer', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat: drop node 18\n\nBREAKING CHANGE: node 18 is no longer supported\n${COMMIT_RECORD_SEPARATOR}`,
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
            breakingDescription: 'node 18 is no longer supported',
            description: 'drop node 18',
          },
        ],
      });
    });

    it('Should flag a breaking change declared with the hyphenated footer', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} fix: rename output\n\nBREAKING-CHANGE: the output is now called version\n${COMMIT_RECORD_SEPARATOR}`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'fix',
            scope: undefined,
            breaking: true,
            breakingDescription: 'the output is now called version',
            description: 'rename output',
          },
        ],
      });
    });

    it('Should flag a breaking change declared without a space after the footer colon', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} feat: drop node 18\n\nBREAKING CHANGE:node 18 is no longer supported\n${COMMIT_RECORD_SEPARATOR}`,
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
            breakingDescription: 'node 18 is no longer supported',
            description: 'drop node 18',
          },
        ],
      });
    });

    it('Should not flag a breaking change mentioned mid sentence in the body', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} fix: tighten validation\n\nThe reviewer asked whether this is a BREAKING CHANGE: for old\nclients, but it is not.\n${COMMIT_RECORD_SEPARATOR}`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'fix',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: 'tighten validation',
          },
        ],
      });
    });

    it('Should keep the description limited to the subject when a body is present', () => {
      const hash = faker.string.alpha(40);
      const hash2 = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data:
          `${hash} feat: add feature\n\n* first bullet\n* second bullet\n${COMMIT_RECORD_SEPARATOR}` +
          `\n${hash2} fix: fix bug\n\n${COMMIT_RECORD_SEPARATOR}`,
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
            breakingDescription: undefined,
            description: 'add feature',
          },
          {
            hash: hash2,
            type: 'fix',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: 'fix bug',
          },
        ],
      });
    });

    it('Should keep the description limited to the subject for a non conventional commit with a body', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} add some feature\n\nsome body text\n${COMMIT_RECORD_SEPARATOR}`,
      });

      const tagPrefix = faker.string.alpha();
      const output = service.parseDescriptionSince(tagPrefix);

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: 'add some feature',
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

    it('Should parse a commit with an empty message as other', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} \n${COMMIT_RECORD_SEPARATOR}`,
      });

      const output = service.parseDescriptionSince(faker.string.alpha());

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: '',
          },
        ],
      });
    });

    it('Should drop the bump commits pushed by a previous release', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: [
          `${faker.string.alpha(40)} [skip ci] bump v1.2.4`,
          `${hash} fix: fix bug`,
        ].join(COMMIT_RECORD_SEPARATOR),
      });

      const output = service.parseDescriptionSince(faker.string.alpha());

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'fix',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: 'fix bug',
          },
        ],
      });
    });

    it('Should keep a commit that only mentions a bump after its subject start', () => {
      const hash = faker.string.alpha(40);
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${hash} chore: [skip ci] bump v1.2.4`,
      });

      const output = service.parseDescriptionSince(faker.string.alpha());

      expect(output).toStrictEqual({
        ok: true,
        data: [
          {
            hash,
            type: 'other',
            scope: undefined,
            breaking: false,
            breakingDescription: undefined,
            description: '[skip ci] bump v1.2.4',
          },
        ],
      });
    });
  });

  describe('Given classify description since method', () => {
    const records = (...subjects: string[]) =>
      subjects
        .map(subject => `${faker.string.alpha(40)} ${subject}`)
        .join(COMMIT_RECORD_SEPARATOR);

    it('Should get major when any commit since the last tag is breaking', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records('fix: first', 'feat(scope)!: second', 'fix: third'),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'major'});
    });

    it('Should get major from a BREAKING CHANGE footer in an earlier commit', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records(
          'fix: rename output\n\nBREAKING CHANGE: the output is now called version\n',
          'feat: add thing',
        ),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'major'});
    });

    it('Should get major from an indented BREAKING CHANGE footer', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records(
          'fix: drop node 18\n\n  BREAKING CHANGE : node 18 is no longer supported\n',
        ),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'major'});
    });

    it('Should skip whitespace-only lines before the subject', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: `${faker.string.alpha(40)}    \nfeat: add feature`,
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'minor'});
    });

    it('Should get minor when a feat precedes the last commit', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records('fix: first', 'feat: second', 'fix: third'),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'minor'});
    });

    it('Should get patch when no commit is a feat or breaking', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records('chore: first', 'fix: second', 'random update'),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'patch'});
    });

    it('Should get patch when the breaking phrase appears mid sentence', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records(
          'fix: tighten validation\n\nThe reviewer asked whether this is a BREAKING CHANGE: for old\nclients, but it is not.\n',
        ),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'patch'});
    });

    it('Should ignore the bump commit when classifying', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records('feat: add thing', '[skip ci] bump v1.2.4'),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: 'minor'});
    });

    it('Should get nothing when there is no commit since the last tag', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: null});
    });

    it('Should get nothing when only bump commits remain since the last tag', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: records('[skip ci] bump v1.2.4', '[skip ci] bump v1.2.5'),
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: true, data: null});
    });

    it('Should read the commits since the last tag with the tag prefix', () => {
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: true,
        data: '',
      });

      const tagPrefix = faker.string.alpha();
      service.classifyDescriptionSince(tagPrefix);

      expect(GitServiceMock.getDescriptionSince).toHaveBeenCalledWith(
        tagPrefix,
      );
    });

    it('Should return error reading the commits since the last tag', () => {
      const error = new Error(faker.lorem.sentence());
      GitServiceMock.getDescriptionSince.mockReturnValueOnce({
        ok: false,
        error,
      });

      const output = service.classifyDescriptionSince('v');

      expect(output).toStrictEqual({ok: false, error});
    });
  });
});
