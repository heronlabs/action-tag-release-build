export interface Bumper {
    bump(version: string): {
        ok: true;
        data: string;
        error?: undefined;
    } | {
        ok: false;
        error: unknown;
        data?: undefined;
    };
}
//# sourceMappingURL=bumper.d.ts.map