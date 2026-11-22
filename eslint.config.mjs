// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config({
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
      project: ['./tsconfig.json', './apps/*/tsconfig.json'],
    },
  },
});