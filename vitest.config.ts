import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["server/**/*.test.ts", "client/src/**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.early.test/**",
      "agent-client-protocol/**",
      "cubic/**",
      "easy-asphalt/**",
    ],
    globals: true,
    environment: "node",
    alias: {
      server: path.resolve(projectRoot, "./server"),
    },
  },
});
