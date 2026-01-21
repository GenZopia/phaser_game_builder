module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Relax some rules for game development
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-case-declarations': 'off', // Allow declarations in case blocks
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    // Allow 'this' in Phaser functions
    'react-hooks/unsupported-syntax': 'off',
  },
}