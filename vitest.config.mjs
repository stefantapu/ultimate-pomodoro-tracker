import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@features": path.resolve(__dirname, "src/features"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    maxWorkers: 1,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "utils/**/*.ts"],
      exclude: [
        "src/main.tsx",
        "src/test/**",
        "**/*.d.ts",
      ],
    },
  },
});
