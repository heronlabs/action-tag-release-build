import {defineConfig} from 'eslint/config';
import jsonc from 'eslint-plugin-jsonc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import yml from 'eslint-plugin-yml';
import gts from 'gts';

export default defineConfig([
  ...gts,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message:
            'Use process.stderr.write instead of console.log outside the CLI layer.',
        },
        {
          selector:
            "CallExpression[callee.object.object.name='process'][callee.object.property.name='stdout'][callee.property.name='write']",
          message:
            'Use process.stderr.write instead of process.stdout.write outside the CLI layer.',
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['src/cli.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  ...jsonc.configs['flat/recommended-with-json'],
  {
    files: ['**/*.json'],
    rules: {
      'jsonc/sort-keys': [
        'error',
        'asc',
        {
          caseSensitive: true,
          natural: false,
          minKeys: 2,
        },
      ],
    },
  },
  ...yml.configs['flat/recommended'],
  {
    files: ['.github/**/*.yml', '.github/**/*.yaml'],
    rules: {'yml/sort-keys': 'off'},
  },
  {
    ignores: [
      'node_modules/',
      'bin/',
      'reports/',
      'pnpm-lock.yaml',
      '.serena/',
      '.supera/',
      '.stryker-tmp/',
    ],
  },
]);
