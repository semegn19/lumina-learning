import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
  ],

  // Dev proxy — avoids CORS errors in development
  // All requests to /api/* are forwarded to the Django server.
  server: {
    proxy: {
      "/api": {
        target: process.env["VITE_API_URL"] ?? "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
