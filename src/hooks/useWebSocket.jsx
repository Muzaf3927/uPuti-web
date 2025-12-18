import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho, updateEchoToken } from '@/lib/echo';
import { safeLocalStorage } from '@/lib/localStorage';

/**
 * Хук для подписки на WebSocket каналы
 * @param {string|string[]} channels - Канал или массив каналов для подписки
 * @param {object} handlers - Объект с обработчиками событий { 'event.name': (data) => {} }
 * @param {boolean} isPrivate - Приватный канал (требует авторизации)
 * @param {object} options - Дополнительные опции
 */
export const useWebSocket = (channels, handlers = {}, isPrivate = false, options = {}) => {
  const queryClient = useQueryClient();
  const echoRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    // Если канал null или undefined, не подписываемся
    if (!channels) {
      return;
    }

    const token = safeLocalStorage.getItem('token');
    
    // Если нет токена и канал приватный, не подписываемся
    if (isPrivate && !token) {
      return;
    }

    // Обновляем токен если нужно
    if (token) {
      updateEchoToken();
    }

    const echo = getEcho();
    echoRef.current = echo;

    // Нормализуем каналы в массив и фильтруем null/undefined
    const channelsArray = Array.isArray(channels) 
      ? channels.filter(ch => ch != null)
      : [channels].filter(ch => ch != null);

    // Если нет валидных каналов, не подписываемся
    if (channelsArray.length === 0) {
      return;
    }

    // Подписываемся на каждый канал
    channelsArray.forEach((channelName) => {
      if (!channelName) return; // Дополнительная проверка

      const channel = isPrivate 
        ? echo.private(channelName)
        : echo.channel(channelName);

      console.log(`[WebSocket] Подписка на канал: ${isPrivate ? 'private' : 'public'}.${channelName}`);

      // Подписываемся на все события из handlers
      Object.entries(handlers).forEach(([eventName, handler]) => {
        console.log(`[WebSocket] Подписка на событие: ${eventName} в канале ${channelName}`);
        
        const listener = channel.listen(eventName, (data) => {
          console.log(`[WebSocket] Событие получено: ${eventName} в канале ${channelName}`, data);
          // Вызываем обработчик с данными и queryClient для обновления кэша
          handler(data, queryClient);
        });
        
        listenersRef.current.push({ channel, listener, eventName });
      });

      // Также слушаем все события для отладки
      channel.subscribed(() => {
        console.log(`[WebSocket] ✅ Успешно подписан на канал: ${channelName}`);
      });

      channel.error((error) => {
        console.error(`[WebSocket] ❌ Ошибка в канале ${channelName}:`, error);
      });

      // Универсальный слушатель всех событий для отладки
      // Это поможет увидеть, какие события вообще приходят
      const wildcardListener = channel.listen('.', (data) => {
        console.log(`[WebSocket] 🔔 Получено событие в канале ${channelName}:`, data);
      });
      
      // Также слушаем события без точки
      try {
        const wildcardListener2 = channel.listen('*', (eventName, data) => {
          console.log(`[WebSocket] 🔔 Получено событие * в канале ${channelName}:`, eventName, data);
        });
      } catch (e) {
        // Игнорируем ошибку, если wildcard не поддерживается
      }
    });

    // Очистка при размонтировании
    return () => {
      listenersRef.current.forEach(({ channel, listener, eventName }) => {
        try {
          channel.stopListening(eventName, listener);
        } catch (error) {
          console.warn('Error stopping listener:', error);
        }
      });
      listenersRef.current = [];
    };
  }, [channels, isPrivate, JSON.stringify(Object.keys(handlers))]);

  return echoRef.current;
};

/**
 * Хук для подписки на события трипов
 */
export const useTripsWebSocket = (onTripCreated, onTripUpdated, onTripCompleted, onTripCancelled) => {
  // Обработчик для события создания трипа (поддерживаем разные форматы)
  const handleTripCreated = (data, queryClient) => {
    console.log('[useTripsWebSocket] Trip created event:', data);
    queryClient.invalidateQueries({ queryKey: ['data'] });
    if (onTripCreated) {
      onTripCreated(data.trip || data);
    }
  };

  // Обработчик для события обновления трипа
  const handleTripUpdated = (data, queryClient) => {
    console.log('[useTripsWebSocket] Trip updated event:', data);
    queryClient.invalidateQueries({ queryKey: ['data'] });
    if (onTripUpdated) {
      onTripUpdated(data.trip || data);
    }
  };

  // Обработчик для события завершения трипа
  const handleTripCompleted = (data, queryClient) => {
    console.log('[useTripsWebSocket] Trip completed event:', data);
    queryClient.invalidateQueries({ queryKey: ['data'] });
    if (onTripCompleted) {
      onTripCompleted(data.trip || data);
    }
  };

  // Обработчик для события отмены трипа
  const handleTripCancelled = (data, queryClient) => {
    console.log('[useTripsWebSocket] Trip cancelled event:', data);
    queryClient.invalidateQueries({ queryKey: ['data'] });
    if (onTripCancelled) {
      onTripCancelled(data.trip || data);
    }
  };

  return useWebSocket(
    'trips',
    {
      // Laravel формат с точкой
      '.trip.created': handleTripCreated,
      '.trip.updated': handleTripUpdated,
      '.trip.completed': handleTripCompleted,
      '.trip.cancelled': handleTripCancelled,
      // Альтернативные форматы (без точки, с заглавными буквами)
      'TripCreated': handleTripCreated,
      'TripUpdated': handleTripUpdated,
      'TripCompleted': handleTripCompleted,
      'TripCancelled': handleTripCancelled,
      'trip.created': handleTripCreated,
      'trip.updated': handleTripUpdated,
      'trip.completed': handleTripCompleted,
      'trip.cancelled': handleTripCancelled,
    },
    false
  );
};

/**
 * Хук для подписки на события бронирований
 */
export const useBookingsWebSocket = (onBookingCreated, onBookingUpdated, onBookingCompleted, onBookingCancelled) => {
  return useWebSocket(
    'bookings',
    {
      '.booking.created': (data, queryClient) => {
        // Инвалидируем кэш бронирований
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onBookingCreated) {
          onBookingCreated(data.booking);
        }
      },
      '.booking.updated': (data, queryClient) => {
        // Инвалидируем кэш бронирований
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onBookingUpdated) {
          onBookingUpdated(data.booking);
        }
      },
      '.booking.completed': (data, queryClient) => {
        // Инвалидируем кэш бронирований
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onBookingCompleted) {
          onBookingCompleted(data.booking);
        }
      },
      '.booking.cancelled': (data, queryClient) => {
        // Инвалидируем кэш бронирований
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onBookingCancelled) {
          onBookingCancelled(data.booking);
        }
      },
    },
    false
  );
};

/**
 * Хук для подписки на приватный канал пользователя
 */
export const useUserWebSocket = (userId, handlers = {}) => {
  // Всегда вызываем хук, но передаем null канал если userId отсутствует
  // Это важно для соблюдения правил хуков React
  return useWebSocket(
    userId ? `user.${userId}` : null,
    handlers,
    true
  );
};

/**
 * Хук для подписки на приватный канал трипа
 */
export const useTripWebSocket = (tripId, handlers = {}) => {
  // Всегда вызываем хук, но передаем null канал если tripId отсутствует
  return useWebSocket(
    tripId ? `trip.${tripId}` : null,
    handlers,
    true
  );
};

/**
 * Хук для подписки на обновление пользователя
 */
export const useUserUpdateWebSocket = (userId, onUserUpdated) => {
  // Всегда вызываем хук, даже если userId отсутствует
  return useUserWebSocket(userId, {
    '.user.updated': (data, queryClient) => {
      // Обновляем кэш пользователя
      queryClient.invalidateQueries({ queryKey: ['data', '/user'] });
      queryClient.invalidateQueries({ queryKey: ['data', '/users/me'] });
      
      // Обновляем данные в localStorage
      if (data.user) {
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
      }
      
      if (onUserUpdated) {
        onUserUpdated(data.user);
      }
    },
  });
};

/**
 * Хук для подписки на канал drivers.trips (для водителей - новые заказы от пассажиров)
 */
export const useDriversTripsWebSocket = (onTripCreated, onTripUpdated, onTripCancelled) => {
  return useWebSocket(
    'drivers.trips',
    {
      '.trip.created': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripCreated) {
          onTripCreated(data.trip || data);
        }
      },
      '.trip.updated': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripUpdated) {
          onTripUpdated(data.trip || data);
        }
      },
      '.trip.cancelled': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripCancelled) {
          onTripCancelled(data.trip || data);
        }
      },
    },
    false // Публичный канал
  );
};

/**
 * Хук для подписки на события поездок через канал user.{id} (для пассажиров)
 */
export const useUserTripsWebSocket = (userId, onTripCreated, onTripUpdated, onBookingCreated, onBookingUpdated, onBookingCancelled) => {
  // Всегда вызываем хук, даже если userId отсутствует
  return useUserWebSocket(userId, {
    '.trip.created': (data, queryClient) => {
      // Инвалидируем кэш трипов для обновления списка
      queryClient.invalidateQueries({ queryKey: ['data'] });
      if (onTripCreated) {
        onTripCreated(data.trip || data);
      }
    },
    '.trip.updated': (data, queryClient) => {
      // Инвалидируем кэш трипов для обновления списка
      queryClient.invalidateQueries({ queryKey: ['data'] });
      if (onTripUpdated) {
        onTripUpdated(data.trip || data);
      }
    },
    '.booking.created': (data, queryClient) => {
      // Инвалидируем кэш бронирований
      queryClient.invalidateQueries({ queryKey: ['data'] });
      if (onBookingCreated) {
        onBookingCreated(data.booking || data);
      }
    },
    '.booking.updated': (data, queryClient) => {
      // Инвалидируем кэш бронирований
      queryClient.invalidateQueries({ queryKey: ['data'] });
      if (onBookingUpdated) {
        onBookingUpdated(data.booking || data);
      }
    },
    '.booking.cancelled': (data, queryClient) => {
      // Инвалидируем кэш бронирований
      queryClient.invalidateQueries({ queryKey: ['data'] });
      if (onBookingCancelled) {
        onBookingCancelled(data.booking || data);
      }
    },
  });
};

