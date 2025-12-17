# Настройка WebSockets на фронтенде

## Что было сделано

1. ✅ Установлены пакеты `laravel-echo` и `pusher-js`
2. ✅ Создан файл `src/lib/echo.js` для инициализации Laravel Echo
3. ✅ Создан хук `src/hooks/useWebSocket.jsx` для удобной работы с WebSocket подписками
4. ✅ Добавлены переменные окружения в `.env`:
   - `VITE_REVERB_APP_KEY`
   - `VITE_REVERB_HOST`
   - `VITE_REVERB_PORT`
   - `VITE_REVERB_SCHEME`
5. ✅ Добавлены WebSocket подписки в компонентах:
   - `Trips.jsx` - подписка на события трипов
   - `Orders.jsx` - подписка на события трипов и бронирований
   - `Requests.jsx` - подписка на события бронирований
6. ✅ Echo инициализируется автоматически при загрузке приложения в `main.jsx`

## Как это работает

### Автоматическое обновление данных

При создании или обновлении трипа/бронирования на бэкенде:
1. Бэкенд отправляет событие через WebSocket
2. Фронтенд получает событие через подписку
3. Автоматически обновляется кэш React Query
4. Компоненты автоматически перерисовываются с новыми данными

### Каналы

- **Публичные каналы** (доступны всем):
  - `trips` - все активные трипы
  - `bookings` - все бронирования

- **Приватные каналы** (требуют авторизации):
  - `trip.{tripId}` - канал для конкретного трипа
  - `user.{userId}` - канал для конкретного пользователя

### События

- `trip.created` - новый трип создан
- `trip.updated` - трип обновлен
- `booking.created` - новое бронирование создано
- `booking.updated` - бронирование обновлено

## Использование

### Базовое использование хука

```jsx
import { useTripsWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  useTripsWebSocket(
    (trip) => {
      // Обработчик создания трипа
      console.log('Новый трип:', trip);
    },
    (trip) => {
      // Обработчик обновления трипа
      console.log('Трип обновлен:', trip);
    }
  );
}
```

### Подписка на приватный канал

```jsx
import { useUserWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const userId = 123;
  
  useUserWebSocket(userId, {
    '.booking.created': (data, queryClient) => {
      // Обработчик события
      queryClient.invalidateQueries({ queryKey: ['data'] });
    }
  });
}
```

## Настройка для продакшена

При деплое на продакшен обновите переменные окружения в `.env`:

```env
VITE_REVERB_APP_KEY=your-production-key
VITE_REVERB_HOST=your-production-host
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Эти значения будут предоставлены Laravel Cloud после включения WebSockets.

## Отладка

Для включения логирования WebSocket, раскомментируйте в `src/lib/echo.js`:

```javascript
enableLogging: true,
```

Также можно проверить подключение в консоли браузера:
- Откройте DevTools → Console
- Проверьте сообщения о подключении к WebSocket
- Проверьте события в Network → WS

## Troubleshooting

### WebSocket не подключается

1. Проверьте, что Reverb сервер запущен на бэкенде:
   ```bash
   php artisan reverb:start
   ```

2. Проверьте переменные окружения в `.env`

3. Проверьте CORS настройки на бэкенде

4. Проверьте токен авторизации в localStorage

### События не приходят

1. Убедитесь, что события отправляются с бэкенда (проверьте логи Laravel)

2. Проверьте, что подписка активна (компонент не размонтирован)

3. Проверьте консоль браузера на наличие ошибок

### Приватные каналы не работают

1. Убедитесь, что пользователь авторизован (токен в localStorage)

2. Проверьте маршрут `/broadcasting/auth` на бэкенде

3. Проверьте правила доступа в `routes/channels.php` на бэкенде

