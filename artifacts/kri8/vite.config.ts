import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig(async () => ({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production"
      ? [
          await import("@replit/vite-plugin-runtime-error-modal")
            .then((m) => m.default())
            .catch(() => null),
        ].filter(Boolean)
      : []),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? await Promise.all([
          import("@replit/vite-plugin-cartographer")
            .then((m) => m.cartographer({ root: path.resolve(import.meta.dirname, "..") }))
            .catch(() => null),
          import("@replit/vite-plugin-dev-banner")
            .then((m) => m.devBanner())
            .catch(() => null),
        ]).then((plugins) => plugins.filter(Boolean))
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
}));
