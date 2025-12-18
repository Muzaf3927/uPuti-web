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
  build: {
    // Увеличиваем лимит предупреждения о размере чанков до 1000 KB (1 MB)
    chunkSizeWarningLimit: 1000,
    // Оптимизация разделения чанков для лучшей производительности
    rollupOptions: {
      output: {
        manualChunks: {
          // Выделяем vendor библиотеки в отдельные чанки
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          'map-vendor': ['leaflet', 'react-leaflet', 'leaflet-routing-machine'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
