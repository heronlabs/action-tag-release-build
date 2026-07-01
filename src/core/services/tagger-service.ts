import {Semantic} from '../types/semantic';

export class TaggerService {
  classify(message: string) {
    try {
      const subject = message.split('\n')[0]!;
      let data: Semantic = 'patch';
      const breaking =
        subject.includes('!:') || /\bBREAKING[ -]CHANGE\b/.test(message);
      if (breaking) data = 'major';
      else if (/^feat\b/.test(subject)) data = 'minor';
      return {ok: true as const, data};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  calculate(version: string, bump: Semantic) {
    try {
      const numeric = version.replace(/^\D+/, '');
      const [major = '0', minor = '0', patch = '0'] = numeric.split('.');

      const m = parseInt(major, 10);
      const n = parseInt(minor, 10);
      const p = parseInt(patch, 10);

      let nextMajor = m;
      let nextMinor = n;
      let nextPatch = p;

      if (bump === 'major') {
        nextMajor = m + 1;
        nextMinor = 0;
        nextPatch = 0;
      } else if (bump === 'minor') {
        nextMinor = n + 1;
        nextPatch = 0;
      } else if (bump === 'patch') {
        nextPatch = p + 1;
      }

      const nextVersion = `${nextMajor}.${nextMinor}.${nextPatch}`;

      return {
        ok: true as const,
        data: {
          nextVersion,
          major: `${nextMajor}`,
          minor: `${nextMinor}`,
          patch: `${nextPatch}`,
        },
      };
    } catch (error) {
      return {ok: false as const, error};
    }
  }
}
