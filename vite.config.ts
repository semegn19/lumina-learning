// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },

  // ── Dev proxy — avoids CORS errors in development ──
  // All requests to /api/* are forwarded to the Django server.
  // This is only active during `npm run dev`.
  // In production, configure your reverse proxy (nginx/Caddy) to route /api/* to Django.
  vite: {
    server: {
      proxy: {
        "/api": {
          target: process.env["VITE_API_URL"] ?? "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});
