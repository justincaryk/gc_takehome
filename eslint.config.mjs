export default [
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    // Specify the rules
    rules: {
      // Add any specific ESLint rules here
      // Example: 'no-console': 'warn'
    },
    ignores: ['dist', 'node_modules', 'coverage', '.sql'],
  },
];
