import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: { jsx: "automatic" },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**", "src/lib/**"],
          testTimeout: 15000,
        },
      },
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/lib/**/*.test.{ts,tsx}"],
          testTimeout: 15000,
        },
      },
    ],
  },
});
