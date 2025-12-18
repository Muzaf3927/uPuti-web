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
  
  // Проверяем, работаем ли в WebView
  const isWebView = /AndroidUPuti|UputiIOS/i.test(navigator.userAgent || '');
  console.log('🔌 [Echo] Окружение:', {
    isWebView,
    userAgent: navigator.userAgent?.substring(0, 100)
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
    enabledTransports: ['ws', 'wss'], // Пробуем оба транспорта для совместимости
    disableStats: true,
    cluster: null,
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    enableLogging: true,
    // Дополнительные настройки для стабильности
    activityTimeout: 30000, // 30 секунд
    pongTimeout: 6000, // 6 секунд
    unavailableTimeout: 10000, // 10 секунд
  };

  console.log('🔌 [Echo] Полная конфигурация:', echoConfig);
  console.log('🔌 [Echo] Попытка подключения к:', `wss://${cleanHost}:${REVERB_PORT}`);
  console.log('🔌 [Echo] Endpoint авторизации:', `${BASE_URL}/broadcasting/auth`);
  
  try {
    echoInstance = new Echo(echoConfig);
    
    // Принудительно подключаемся сразу после создания
    setTimeout(() => {
      const connection = echoInstance?.connector?.pusher?.connection;
      if (connection && connection.state !== 'connected' && connection.state !== 'connecting') {
        console.log('🔌 [Echo] Принудительное подключение...');
        try {
          connection.connect();
        } catch (e) {
          console.error('🔌 [Echo] Ошибка принудительного подключения:', e);
        }
      }
    }, 100);
  } catch (error) {
    console.error('🔌 [Echo] Ошибка при создании экземпляра Echo:', error);
    throw error;
  }

  // Логируем события подключения
  echoInstance.connector.pusher.connection.bind('connected', () => {
    console.log('🔌 [WebSocket] ✅✅✅ ПОДКЛЮЧЕНО К REVERB СЕРВЕРУ!');
    console.log('🔌 [WebSocket] Готов к подписке на каналы');
  });

  echoInstance.connector.pusher.connection.bind('disconnected', () => {
    console.log('🔌 [WebSocket] ❌ Отключено от Reverb сервера');
    
    // В WebView автоматически переподключаемся
    if (isWebView) {
      console.log('🔌 [WebSocket] WebView: Попытка переподключения...');
      setTimeout(() => {
        if (echoInstance && echoInstance.connector.pusher.connection.state === 'disconnected') {
          try {
            echoInstance.connector.pusher.connect();
          } catch (e) {
            console.error('🔌 [WebSocket] Ошибка переподключения:', e);
          }
        }
      }, 2000); // Переподключение через 2 секунды
    }
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
    
    // Детальный разбор ошибки
    if (error?.error) {
      console.error('🔌 [WebSocket] Детали ошибки:', {
        errorType: error.error.type,
        errorMessage: error.error.message,
        errorData: error.error.data,
        errorCode: error.error.code,
        fullErrorObject: error.error
      });
    }
    
    // НЕ переподключаемся автоматически при ошибке - это может создать бесконечный цикл
    // Вместо этого ждем, пока пользователь не обновит страницу или не исправит проблему
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
      
      // Агрессивное переподключение при ошибке
      console.log('🔌 [WebSocket] Попытка переподключения через 3 секунды...');
      setTimeout(() => {
        try {
          if (echoInstance && echoInstance.connector.pusher.connection.state !== 'connected') {
            console.log('🔌 [WebSocket] Переподключение...');
            echoInstance.connector.pusher.connect();
          }
        } catch (e) {
          console.error('🔌 [WebSocket] Ошибка переподключения:', e);
        }
      }, 3000);
    } else if (states.current === 'connected') {
      console.log('🔌 [WebSocket] ✅✅✅ УСПЕШНО ПОДКЛЮЧЕНО!');
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
    console.error('  6. Проверьте логи Laravel на наличие ошибок авторизации');
    
    // Детальный разбор ошибки Pusher
    if (error?.error) {
      console.error('🔌 [Pusher] Детали ошибки:', {
        errorType: error.error.type,
        errorMessage: error.error.message,
        errorData: error.error.data,
        errorCode: error.error.code,
        fullErrorObject: error.error
      });
    }
    
    // НЕ переподключаемся автоматически - это может создать бесконечный цикл
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

    // В WebView обрабатываем видимость страницы для переподключения
    if (isWebView) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('🔌 [WebSocket] WebView: Страница видна, проверяем подключение...');
          // Если отключено, переподключаемся
          if (echoInstance && echoInstance.connector.pusher.connection.state === 'disconnected') {
            setTimeout(() => {
              try {
                echoInstance.connector.pusher.connect();
                console.log('🔌 [WebSocket] WebView: Переподключение инициировано');
              } catch (e) {
                console.error('🔌 [WebSocket] WebView: Ошибка переподключения:', e);
              }
            }, 500);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Также слушаем focus для переподключения
      window.addEventListener('focus', () => {
        if (echoInstance && echoInstance.connector.pusher.connection.state === 'disconnected') {
          setTimeout(() => {
            try {
              echoInstance.connector.pusher.connect();
            } catch (e) {
              console.error('🔌 [WebSocket] WebView: Ошибка переподключения при focus:', e);
            }
          }, 500);
        }
      });

      // Периодическая проверка подключения в WebView (каждые 30 секунд)
      const connectionCheckInterval = setInterval(() => {
        if (echoInstance) {
          const state = echoInstance.connector.pusher.connection.state;
          if (state === 'disconnected' || state === 'failed' || state === 'unavailable') {
            console.log('🔌 [WebSocket] WebView: Обнаружено отключение, переподключаемся...');
            try {
              echoInstance.connector.pusher.connect();
            } catch (e) {
              console.error('🔌 [WebSocket] WebView: Ошибка периодического переподключения:', e);
            }
          } else if (state === 'connected') {
            // Подключение активно, ничего не делаем
            console.log('🔌 [WebSocket] WebView: Подключение активно');
          }
        }
      }, 30000); // Проверка каждые 30 секунд

      // Очищаем интервал при размонтировании (если будет функция очистки)
      if (typeof window !== 'undefined') {
        window._echoConnectionCheckInterval = connectionCheckInterval;
      }
    }
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
  // Очищаем интервал проверки подключения
  if (typeof window !== 'undefined' && window._echoConnectionCheckInterval) {
    clearInterval(window._echoConnectionCheckInterval);
    window._echoConnectionCheckInterval = null;
  }

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

