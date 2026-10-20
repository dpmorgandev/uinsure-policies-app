import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const barrelOnly = {
  // Every kit folder except tokens/: the entry loads tokens.css, a stylesheet and not a component.
  group: ['**/kit/layouts/**', '**/kit/patterns/**', '**/kit/primitives/**', '**/kit/project/**', '**/kit/sink/**'],
  message: 'Import the kit through its barrel (kit/index.ts) only.',
};
const outside = { group: ['**/docs/**', '**/tests/**'], message: 'src/web never imports docs/ or tests/.' };
const noWorkbench = { group: ['**/workbench/**'], message: 'The explorer never imports the workbench.' };
const noExplorer = { group: ['**/explorer/**'], message: 'The workbench never imports the explorer.' };
const compilerOnly = {
  group: ['**/app/**', '**/kit/**', '**/.claude/**', '**/docs/**', '**/tests/**'],
  message: 'The compiler uses Node built-ins only.',
};

export default tseslint.config(
  { ignores: ['dist/**', 'public/**', 'node_modules/**', 'kit/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['app/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', { patterns: [barrelOnly, outside] }],
    },
  },
  {
    files: ['app/explorer/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [barrelOnly, outside, noWorkbench] }] },
  },
  {
    files: ['app/workbench/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [barrelOnly, outside, noExplorer] }] },
  },
  {
    files: ['compiler/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [compilerOnly] }] },
  },
);
