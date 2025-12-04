import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        // Локальный API для тестирования
        target: "http://localhost:8000",
        // target: "https://api.uputi.net", // Основной API (закомментирован)
        changeOrigin: true,
        secure: false, // false для localhost
      },
    },
  },
});
