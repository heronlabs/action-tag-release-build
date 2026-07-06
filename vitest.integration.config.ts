import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/cli.ts', '**/*.d.ts', 'types/*', 'interfaces/*'],
      enabled: true,
    },
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    testTimeout: 30_000,
    pool: 'threads',
  },
});
