import eslintConfigLove from "eslint-config-love"
import eslintPluginRegexp from "eslint-plugin-regexp"

export default [
  {
    ...eslintConfigLove,
    files: ["src/**/*.ts"],
    rules: {
      ...eslintConfigLove.rules,
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  {
    ...eslintPluginRegexp.configs["flat/recommended"],
    files: ["src/**/*.ts"],
  },
]
