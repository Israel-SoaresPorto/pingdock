// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config({
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: process.cwd(),
      project: ['./tsconfig.json', './apps/*/tsconfig.json'],
    },
  },
});