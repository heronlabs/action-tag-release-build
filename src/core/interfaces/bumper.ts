export interface Bumper {
  readonly name: string;
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
