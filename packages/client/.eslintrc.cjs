module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['src/contexts/**/*.tsx', 'src/hooks/**/*.ts'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
  // Treat warnings as errors
  reportUnusedDisableDirectives: true,
};
