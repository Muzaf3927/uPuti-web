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
// Используем правильный URL напрямую
const PRODUCTION_API_BASE = 'https://api.uputi.net/api';
const BASE_URL = 'https://api.uputi.net';

// Создаем экземпляр Echo
let echoInstance = null;

export const initializeEcho = () => {
  // Если уже инициализирован, возвращаем существующий экземпляр
  if (echoInstance) {
    console.log('🔌 [Echo] Используется существующий экземпляр Echo');
    return echoInstance;
  }

  console.log('🔌 [Echo] Инициализация нового экземпляра Echo...');
  const token = safeLocalStorage.getItem('token');

  // Формируем правильный host для WebSocket
  // Убираем протокол если он есть (ws:// или wss://)
  const cleanHost = REVERB_HOST.replace(/^(wss?:\/\/)?/, '');
  
  console.log('🔌 [Echo] Конфигурация:', {
    REVERB_APP_KEY,
    cleanHost,
    REVERB_PORT,
    REVERB_SCHEME,
    BASE_URL,
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    hasToken: !!token
  });
  
  // Для Laravel Cloud Reverb конфигурация
  // Laravel Cloud использует wss (WebSocket Secure) на порту 443
  const echoConfig = {
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: cleanHost,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: true, // Всегда true для Laravel Cloud
    enabledTransports: ['wss'], // Используем только wss для Laravel Cloud
    disableStats: true,
    cluster: null,
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
    enableLogging: true,
  };

  console.log('🔌 [Echo] Полная конфигурация:', echoConfig);
  console.log('🔌 [Echo] Попытка подключения к:', `wss://${cleanHost}:${REVERB_PORT}`);
  
  try {
    echoInstance = new Echo(echoConfig);
  } catch (error) {
    console.error('🔌 [Echo] Ошибка при создании экземпляра Echo:', error);
    throw error;
  }

  // Логируем события подключения
  echoInstance.connector.pusher.connection.bind('connected', () => {
    console.log('🔌 [WebSocket] ✅ Подключено к Reverb серверу');
  });

  echoInstance.connector.pusher.connection.bind('disconnected', () => {
    console.log('🔌 [WebSocket] ❌ Отключено от Reverb сервера');
  });

  echoInstance.connector.pusher.connection.bind('error', (error) => {
    console.error('🔌 [WebSocket] ❌ Ошибка подключения:', {
      error,
      type: error?.type,
      errorData: error?.error,
      message: error?.error?.message || error?.message,
      code: error?.error?.code,
      host: cleanHost,
      port: REVERB_PORT,
      scheme: REVERB_SCHEME,
      authEndpoint: `${BASE_URL}/broadcasting/auth`,
      fullError: JSON.stringify(error, null, 2)
    });
  });

  echoInstance.connector.pusher.connection.bind('state_change', (states) => {
    console.log('🔌 [WebSocket] 📡 Изменение состояния:', states.previous, '→', states.current);
    if (states.current === 'failed' || states.current === 'unavailable') {
      console.error('🔌 [WebSocket] ❌ Не удалось подключиться. Проверьте:');
      console.error('  1. Запущен ли Reverb сервер на бэкенде? (php artisan reverb:start)');
      console.error('  2. Правильный ли хост:', cleanHost);
      console.error('  3. Правильный ли порт:', REVERB_PORT);
      console.error('  4. Правильный ли ключ:', REVERB_APP_KEY);
      console.error('  5. Доступен ли сервер по адресу:', `${REVERB_SCHEME}://${cleanHost}:${REVERB_PORT}`);
      console.error('  6. Проверьте CORS настройки на бэкенде');
      console.error('  7. Проверьте, что BROADCAST_CONNECTION=reverb в .env бэкенда');
      console.error('  8. Проверьте маршрут /broadcasting/auth на бэкенде');
    }
  });

  // Дополнительное логирование для Pusher
  echoInstance.connector.pusher.bind('pusher:error', (error) => {
    console.error('🔌 [Pusher] Ошибка:', {
      error,
      type: error?.type,
      data: error?.data,
      message: error?.message
    });
  });

  echoInstance.connector.pusher.bind('pusher:connection_error', (error) => {
    console.error('🔌 [Pusher] Ошибка соединения:', {
      error,
      type: error?.type,
      message: error?.error?.message || error?.message,
      code: error?.error?.code,
      data: error?.data,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Дополнительная диагностика
    console.error('🔌 [Диагностика] Проверьте:');
    console.error('  1. Доступен ли Reverb сервер:', `wss://${cleanHost}:${REVERB_PORT}`);
    console.error('  2. Правильный ли ключ:', REVERB_APP_KEY);
    console.error('  3. Проверьте маршрут авторизации:', `${BASE_URL}/broadcasting/auth`);
    console.error('  4. Проверьте CORS настройки на бэкенде');
    console.error('  5. Проверьте, что BROADCAST_CONNECTION=reverb в .env бэкенда');
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

