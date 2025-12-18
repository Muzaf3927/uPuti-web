import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// redux toolkit
import { Provider } from "react-redux";
import { store } from "./app/store";

// others
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { I18nProvider } from "./app/i18n.jsx";

// Initialize Echo for WebSocket connections
import { initializeEcho } from "./lib/echo";

// Инициализируем Echo при загрузке приложения
if (typeof window !== 'undefined') {
  console.log('🚀 [App] Инициализация WebSocket (Echo)...');
  const echo = initializeEcho();
  console.log('🚀 [App] Echo инициализирован:', echo ? '✅' : '❌');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <App />
      </I18nProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  </Provider>
);
