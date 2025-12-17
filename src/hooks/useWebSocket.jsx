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

    // Нормализуем каналы в массив
    const channelsArray = Array.isArray(channels) ? channels : [channels];

    // Подписываемся на каждый канал
    channelsArray.forEach((channelName) => {
      const channel = isPrivate 
        ? echo.private(channelName)
        : echo.channel(channelName);

      // Подписываемся на все события из handlers
      Object.entries(handlers).forEach(([eventName, handler]) => {
        const listener = channel.listen(eventName, (data) => {
          // Вызываем обработчик с данными и queryClient для обновления кэша
          handler(data, queryClient);
        });
        
        listenersRef.current.push({ channel, listener, eventName });
      });
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
  return useWebSocket(
    'trips',
    {
      '.trip.created': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripCreated) {
          onTripCreated(data.trip);
        }
      },
      '.trip.updated': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripUpdated) {
          onTripUpdated(data.trip);
        }
      },
      '.trip.completed': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripCompleted) {
          onTripCompleted(data.trip);
        }
      },
      '.trip.cancelled': (data, queryClient) => {
        // Инвалидируем кэш трипов для обновления списка
        queryClient.invalidateQueries({ queryKey: ['data'] });
        if (onTripCancelled) {
          onTripCancelled(data.trip);
        }
      },
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
  if (!userId) return null;

  return useWebSocket(
    `user.${userId}`,
    handlers,
    true
  );
};

/**
 * Хук для подписки на приватный канал трипа
 */
export const useTripWebSocket = (tripId, handlers = {}) => {
  if (!tripId) return null;

  return useWebSocket(
    `trip.${tripId}`,
    handlers,
    true
  );
};

/**
 * Хук для подписки на обновление пользователя
 */
export const useUserUpdateWebSocket = (userId, onUserUpdated) => {
  if (!userId) return null;

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

