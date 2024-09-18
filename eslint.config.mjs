import eslintConfigLove from 'eslint-config-love'
// import eslintPluginImport from "eslint-plugin-import";
import eslintPluginRegexp from "eslint-plugin-regexp";

export default [
  {
    ...eslintConfigLove,
    // TODO: eslintPluginImport
    ...eslintPluginRegexp,
    files: ['**/*.ts'],
    ignores: ['coverage', 'node_modules', 'dist', 'docs']
  }
]
