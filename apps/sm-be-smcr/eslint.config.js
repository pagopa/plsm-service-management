import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  prettier,
  {
    files: ['src/**/*.ts'], // Solo i file .ts in src/ (esclude __tests__)
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts', '.d.ts'],
        },
      },
      'import/ignore': ['hono', '@azure/identity', 'vitest'],
    },
    rules: {
      'import/order': 'error',
      'import/no-unresolved': 'off', // Disabilita temporaneamente per risolvere i percorsi
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
    // 'ignores' rimosso da questo blocco
  },
  // Aggiunto un blocco 'ignores' globale alla fine
  {
    ignores: ['dist/', 'node_modules/', 'src/__tests__/**/*.ts'],
  },
];
