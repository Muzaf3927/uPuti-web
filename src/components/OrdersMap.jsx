import React, { useEffect, useRef } from "react";

function OrdersMap({ orders = [], isLoading }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Загружаем Яндекс.Карты API
    if (!window.ymaps && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement("script");
      script.src = "https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU";
      script.async = true;
      script.id = "yandex-maps-script";
      document.head.appendChild(script);
      
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => {
            initMap();
          });
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Yandex Maps API");
        scriptLoadedRef.current = false;
      };
    } else if (window.ymaps) {
      window.ymaps.ready(() => {
        initMap();
      });
    }

    return () => {
      // Не удаляем скрипт, он может использоваться другими компонентами
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [orders]);

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.ymaps) return;

    try {
      // Центр карты - Узбекистан (Ташкент)
      const map = new window.ymaps.Map(mapRef.current, {
        center: [41.3111, 69.2797], // Ташкент
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl']
      });

      mapInstanceRef.current = map;
      
      if (orders && orders.length > 0) {
        updateMarkers();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const updateMarkers = async () => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    // Очищаем существующие маркеры
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.geoObjects.remove(marker);
    });
    markersRef.current = [];

    if (!orders || orders.length === 0) {
      return;
    }

    // Используем координаты напрямую или геокодируем адреса
    const geocodePromises = orders.map(async (order) => {
      try {
        const fromAddress = order.from_address || order.from_city || order.from || '';
        const toAddress = order.to_address || order.to_city || order.to || '';
        
        if (!fromAddress) return null;

        // Используем координаты напрямую, если они есть
        let fromCoords = null;
        if (order.from_lat && order.from_lng) {
          fromCoords = [order.from_lat, order.from_lng];
        } else {
          // Геокодируем точку отправления
          const fromGeocode = await window.ymaps.geocode(`${fromAddress}, Узбекистан`);
          fromCoords = fromGeocode.geoObjects.get(0)?.geometry.getCoordinates();
        }
        
        if (fromCoords) {
          const marker = new window.ymaps.Placemark(
            fromCoords,
            {
              balloonContent: `
                <div style="padding: 8px;">
                  <strong>${fromAddress} → ${toAddress}</strong><br/>
                  ${order.date || ''} • ${order.time || ''}
                </div>
              `,
              hintContent: `${fromAddress} → ${toAddress}`
            },
            {
              preset: 'islands#blueIcon'
            }
          );
          
          mapInstanceRef.current.geoObjects.add(marker);
          markersRef.current.push(marker);
          return fromCoords;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
      return null;
    });

    await Promise.all(geocodePromises);

    // Подстраиваем карту под маркеры
    if (markersRef.current.length > 0) {
      try {
        mapInstanceRef.current.setBounds(
          mapInstanceRef.current.geoObjects.getBounds(),
          { checkZoomRange: true, duration: 300 }
        );
      } catch (error) {
        console.error("Error setting bounds:", error);
      }
    }
  };

  return (
    <div className="w-full h-[calc(100vh-300px)] min-h-[400px] rounded-2xl overflow-hidden border shadow-lg relative">
      <div ref={mapRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-2xl">
          <div className="text-sm">Загрузка карты...</div>
        </div>
      )}
      {!window.ymaps && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-2xl">
          <div className="text-sm text-gray-500">Загрузка карты...</div>
        </div>
      )}
    </div>
  );
}

export default OrdersMap;

