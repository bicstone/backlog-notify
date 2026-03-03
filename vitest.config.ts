import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: {
      include: ["src/**/*.ts"],
    },
  },
});
