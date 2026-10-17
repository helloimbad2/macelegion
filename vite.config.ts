import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Plugin order matters: paths, then TanStack Start, then React.
// Nitro only runs for production builds. It picks its deploy target automatically
// (Vercel is detected on Vercel); set `nitro({ preset: "cloudflare-module" })` etc. to force one.
export default defineConfig(({ command }) => ({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      // Use src/server.ts (our SSR error wrapper) as the server entry.
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    ...(command === "build" ? [nitro()] : []),
  ],
  build: {
    // Never inline images as base64: the small kit icons repeat on every row and would bloat the HTML.
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query", "@tanstack/react-start"],
  },
}));
