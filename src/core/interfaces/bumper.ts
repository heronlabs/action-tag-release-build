import {Bumpers} from '../types/bumpers';

export interface Bumper {
  readonly name: Bumpers;
  bump(version: string):
    | {
        ok: true;
        data: string;
        error?: undefined;
      }
    | {
        ok: false;
        error: unknown;
        data?: undefined;
      };
}
