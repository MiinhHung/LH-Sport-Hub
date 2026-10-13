import path from "node:path";
import { defineConfig } from "vitest/config";

const currentDir = import.meta.dirname ?? path.resolve(".");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
