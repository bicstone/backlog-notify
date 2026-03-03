import eslintConfigLove from "eslint-config-love";
import eslintPluginRegexp from "eslint-plugin-regexp";
import eslintPluginVitest from "@vitest/eslint-plugin";

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
      "max-nested-callbacks": "warn",
      complexity: "warn",
    },
  },
  {
    ...eslintPluginRegexp.configs["flat/recommended"],
    files: ["src/**/*.ts"],
    rules: {
      ...eslintPluginRegexp.configs["flat/recommended"].rules,
      "require-unicode-regexp": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    plugins: { vitest: eslintPluginVitest },
    rules: {
      ...eslintPluginVitest.configs.recommended.rules,
      "vitest/no-conditional-expect": "warn",
      "max-lines": "off",
    },
  },
];
