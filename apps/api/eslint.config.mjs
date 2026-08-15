// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'pg', message: 'Domain code cannot depend on PostgreSQL.' },
            { name: 'redis', message: 'Domain code cannot depend on Redis.' },
            {
              name: 'drizzle-orm',
              message: 'Domain code cannot depend on Drizzle.',
            },
          ],
          patterns: [
            {
              group: ['@nestjs/*', '**/infrastructure/**', '**/presentation/**'],
              message:
                'Domain code must remain independent from frameworks and adapters.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/application/{ports,models}/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'pg',
              message: 'Application contracts cannot expose PostgreSQL types.',
            },
            {
              name: 'redis',
              message: 'Application contracts cannot expose Redis types.',
            },
            {
              name: 'drizzle-orm',
              message: 'Application contracts cannot expose Drizzle types.',
            },
          ],
          patterns: [
            {
              group: ['@nestjs/*', '**/infrastructure/**', '**/presentation/**'],
              message:
                'Application contracts must not depend on frameworks or adapters.',
            },
          ],
        },
      ],
    },
  },
);
