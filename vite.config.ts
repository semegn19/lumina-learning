import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = (process.env["VITE_API_URL"] || env["VITE_API_URL"] || "").replace(/\/+$/, "");

  return {
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
      "process.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
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
          target: apiUrl || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});