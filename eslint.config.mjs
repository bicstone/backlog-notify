import eslintConfigLove from "eslint-config-love";
import eslintPluginRegexp from "eslint-plugin-regexp";

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    ...eslintConfigLove,
    files: ["src/**/*.ts"],
    rules: {
      ...eslintConfigLove.rules,
      // Tentatively changed from error to warn due to migration
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  {
    ...eslintPluginRegexp.configs["flat/recommended"],
    files: ["src/**/*.ts"],
  },
];
