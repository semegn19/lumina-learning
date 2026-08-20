import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),

    tanstackStart(),

    nitro(),

    react(),
  ],

  server: {
    proxy: {
      "/api": {
        target:
          process.env["VITE_API_URL"] ?? "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});