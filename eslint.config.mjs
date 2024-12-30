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
      "@typescript-eslint/consistent-type-assertions": "warn",
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-destructuring": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-unsafe-type-assertion": "warn",
      complexity: "warn",
    },
  },
  {
    ...eslintPluginRegexp.configs["flat/recommended"],
    files: ["src/**/*.ts"],
  },
];
