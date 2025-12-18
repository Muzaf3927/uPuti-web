import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { safeLocalStorage } from './localStorage';

// Инициализируем Pusher
window.Pusher = Pusher;

// Получаем переменные окружения
// Значения по умолчанию соответствуют продакшн настройкам бекенда
const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'Ch1q03StfKvXs9tZVmLm';
// Laravel Cloud Reverb host
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'ws-a09d837c-dc24-4d84-add2-3ce2dca3e47e-reverb.laravel.cloud';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || 443;
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'https';

// Получаем базовый URL API для авторизации
const PRODUCTION_API_BASE = 'https://api.uputi.net/api';
const LOCAL_API_BASE = 'http://localhost:8000/api';
const API_BASE = import.meta.env.VITE_API_BASE || PRODUCTION_API_BASE;
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

  // Формируем правильный host для WebSocket
  // Убираем протокол если он есть (ws:// или wss://)
  const cleanHost = REVERB_HOST.replace(/^(wss?:\/\/)?/, '');
  
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: cleanHost,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    // Отключаем автоматическое определение хоста
    disableStats: true,
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    // Дополнительные опции для отладки
    // enableLogging: true,
  });

  // Обновляем токен при изменении
  const updateToken = () => {
    const newToken = safeLocalStorage.getItem('token');
    if (newToken && echoInstance?.connector?.pusher?.config?.auth?.headers) {
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
  if (echoInstance?.connector?.pusher?.config?.auth?.headers && token) {
    echoInstance.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`;
  }
};

