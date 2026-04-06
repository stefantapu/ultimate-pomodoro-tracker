import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@supabase")) {
            return "supabase-auth-data";
          }

          if (
            id.includes("react-activity-calendar") ||
            id.includes("@floating-ui") ||
            id.includes("tabbable")
          ) {
            return "calendar-tooltip";
          }

          if (id.includes("sonner")) {
            return "ui-overlays";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@features": path.resolve(__dirname, "src/features"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
    },
  },
});
