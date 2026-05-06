const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expo,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.expo/**'],
  },
];
