import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { safeLocalStorage } from './localStorage';

// Инициализируем Pusher
window.Pusher = Pusher;

// Используем значения напрямую из вашего бэкенда
// НЕ используем переменные окружения, чтобы избежать проблем с неправильными настройками на сервере
const REVERB_APP_KEY = 'Ch1q03StfKvXs9tZVmLm';
const REVERB_HOST = 'ws-a09d837c-dc24-4d84-add2-3ce2dca3e47e-reverb.laravel.cloud';
const REVERB_PORT = 443;
const REVERB_SCHEME = 'https';

// Получаем базовый URL API для авторизации
const PRODUCTION_API_BASE = 'https://api.uputi.net/api';
const LOCAL_API_BASE = 'http://localhost:8000/api';
const envApiBase = import.meta.env.VITE_API_BASE;
// Проверяем, что API_BASE не содержит опечаток (например, https:/.uputi.net)
const API_BASE = (envApiBase && !envApiBase.includes('https:/.') && envApiBase.includes('api.uputi.net')) 
  ? envApiBase 
  : PRODUCTION_API_BASE;
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
  
  console.log('Echo config (hardcoded values):', {
    REVERB_APP_KEY,
    cleanHost,
    REVERB_PORT,
    REVERB_SCHEME,
    BASE_URL
  });
  
  // Для Laravel Reverb конфигурация
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: cleanHost,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    // Отключаем автоматическое определение хоста
    cluster: null,
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    // Включаем логирование для отладки
    enableLogging: true,
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

