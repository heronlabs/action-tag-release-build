import {defineConfig, mergeConfig} from 'vitest/config';

import baseConfig from './vitest.unit.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        reportsDirectory: 'reports/vitest/integration',
      },
    },
  }),
);
