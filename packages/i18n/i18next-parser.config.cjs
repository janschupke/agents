module.exports = {
  locales: ['en'],
  defaultNamespace: 'common',
  namespaceSeparator: ':',
  keySeparator: '.',
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  input: [
    '../../apps/client/src/**/*.{ts,tsx}',
    '../../apps/admin/src/**/*.{ts,tsx}',
    '../../apps/api/src/**/*.{ts}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  sort: true,
  keepRemoved: false,
  defaultValue: (locale, namespace, key) => {
    return key;
  },
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
    default: ['JavascriptLexer'],
  },
  lineEnding: 'auto',
  createOldCatalogs: false,
  indentation: 2,
  skipDefaultValues: false,
  useKeysAsDefaultValue: true,
  // Context function to determine namespace from useTranslation calls
  contextSeparator: '_',
  contextDefaultValues: [],
  // Custom function to extract namespace from useTranslation(I18nNamespace.XXX) pattern
  // This will be handled by the lexer automatically
};
