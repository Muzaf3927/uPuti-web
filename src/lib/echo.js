import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { safeLocalStorage } from './localStorage';

// Инициализируем Pusher
window.Pusher = Pusher;

// Получаем переменные окружения
const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'yerhxxguhoccbizaiivc';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'localhost';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || 8080;
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'http';

// Получаем базовый URL API для авторизации
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
// Убираем /api из конца для получения базового URL
const BASE_URL = API_BASE.replace('/api', '');

// Создаем экземпляр Echo
let echoInstance = null;

export const initializeEcho = () => {
  // Если уже инициализирован, возвращаем существующий экземпляр
  if (echoInstance) {
    return echoInstance;
  }

  const token = safeLocalStorage.getItem('token');

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    // Дополнительные опции для отладки
    // disableStats: true,
    // enableLogging: true,
  });

  // Обновляем токен при изменении
  const updateToken = () => {
    const newToken = safeLocalStorage.getItem('token');
    if (newToken && echoInstance) {
      echoInstance.connector.pusher.config.auth.headers.Authorization = `Bearer ${newToken}`;
    }
  };

  // Слушаем изменения в localStorage (если используется)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        updateToken();
      }
    });
  }

  return echoInstance;
};

export const getEcho = () => {
  if (!echoInstance) {
    return initializeEcho();
  }
  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

// Обновить токен авторизации
export const updateEchoToken = () => {
  const token = safeLocalStorage.getItem('token');
  if (echoInstance && token) {
    echoInstance.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`;
  }
};

