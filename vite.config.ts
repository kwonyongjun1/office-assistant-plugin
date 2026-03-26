import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "index.html",
        background: "src/app/background.ts",
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/chunk-[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
