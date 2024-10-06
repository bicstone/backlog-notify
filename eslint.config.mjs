import eslintConfigLove from "eslint-config-love"
import eslintPluginImport from "eslint-plugin-import"
import eslintPluginRegexp from "eslint-plugin-regexp"

export default [
  {
    ...eslintConfigLove,
    ...eslintPluginImport.flatConfigs.recommended,
    ...eslintPluginRegexp.configs["flat/recommended"],
    files: ["**/*.ts"],
    ignores: ["coverage", "node_modules", "dist", "docs"],
  },
]
