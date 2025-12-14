import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Разрешить доступ с других устройств
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      // Проксируем только запросы к API
      "^/api/.*": {
        // Локальный API для тестирования
        target: "http://localhost:8000",
        // target: "https://api.uputi.net", // Основной API (закомментирован)
        changeOrigin: true,
        secure: false, // false для localhost
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
