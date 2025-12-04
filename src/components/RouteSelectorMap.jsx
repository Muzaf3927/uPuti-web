import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";

function RouteSelectorMap({ onRouteSelect, fromCity, toCity, setFromCity, setToCity, isOpen = true }) {
  const { t } = useI18n();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fromMarkerRef = useRef(null);
  const toMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const scriptLoadedRef = useRef(false);
  const selectingFromRef = useRef(true); // Ref для актуального значения
  
  // Обновляем ref при изменении состояния
  useEffect(() => {
    selectingFromRef.current = selectingFrom;
  }, [selectingFrom]);

  useEffect(() => {
    // Если диалог не открыт, не инициализируем карту
    if (!isOpen) return;
    
    let isMounted = true;
    
    const loadMap = () => {
      if (!isMounted) return;
      
      // Если карта уже инициализирована, ничего не делаем
      if (mapInstanceRef.current) {
        console.log("Map already initialized");
        return;
      }
      
      // Проверяем, есть ли уже загруженный скрипт Яндекс.Карт
      const existingScript = document.getElementById("yandex-maps-script") || document.getElementById("yandex-maps-route-script");
      
      if (window.ymaps) {
        // Скрипт уже загружен
        window.ymaps.ready(() => {
          if (isMounted && !mapInstanceRef.current) {
            setTimeout(() => {
              initMap();
            }, 200);
          }
        });
      } else if (!scriptLoadedRef.current && !existingScript) {
        // Загружаем скрипт
        scriptLoadedRef.current = true;
        const script = document.createElement("script");
        script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
        script.async = true;
        script.id = "yandex-maps-route-script";
        
        script.onload = () => {
          console.log("Yandex Maps script loaded");
          if (window.ymaps && isMounted) {
            window.ymaps.ready(() => {
              console.log("Yandex Maps ready");
              if (isMounted && !mapInstanceRef.current) {
                setTimeout(() => {
                  initMap();
                }, 200);
              }
            });
          }
        };
        
        script.onerror = () => {
          console.error("Failed to load Yandex Maps script");
          scriptLoadedRef.current = false;
        };
        
        document.head.appendChild(script);
      } else if (existingScript && !window.ymaps) {
        // Скрипт загружается, ждем
        const checkYmaps = setInterval(() => {
          if (window.ymaps && isMounted) {
            clearInterval(checkYmaps);
            window.ymaps.ready(() => {
              if (isMounted && !mapInstanceRef.current) {
                setTimeout(() => {
                  initMap();
                }, 200);
              }
            });
          }
        }, 100);
        
        // Таймаут на случай, если скрипт не загрузится
        setTimeout(() => {
          clearInterval(checkYmaps);
        }, 10000);
      }
    };
    
    // Небольшая задержка, чтобы убедиться, что DOM готов
    const timer = setTimeout(() => {
      loadMap();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (fromCity && toCity && mapInstanceRef.current) {
      updateRoute();
    }
  }, [fromCity, toCity]);

  const initMap = () => {
    if (!mapRef.current) {
      console.log("mapRef.current is null");
      return;
    }
    
    if (mapInstanceRef.current) {
      console.log("Map already initialized");
      return;
    }
    
    if (!window.ymaps) {
      console.log("window.ymaps is not available");
      return;
    }

    try {
      console.log("Initializing map...");
      const map = new window.ymaps.Map(mapRef.current, {
        center: [41.3111, 69.2797], // Ташкент (широта, долгота)
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl']
      });

      mapInstanceRef.current = map;
      setMapReady(true);
      console.log("Map initialized successfully");

      // Обработка клика на карте - работает везде
      map.events.add('click', (e) => {
        console.log("=== MAP CLICKED ===");
        try {
          const coords = e.get('coords');
          console.log("Coordinates from click:", coords);
          if (coords && Array.isArray(coords) && coords.length === 2) {
            console.log("Calling handleMapClick with:", coords);
            handleMapClick(coords);
          } else {
            console.error("Invalid coords format:", coords);
          }
        } catch (err) {
          console.error("Error handling click:", err);
        }
      });
      
      console.log("Click handler added to map");
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const handleMapClick = async (coords) => {
    // Используем ref для получения актуального значения
    const isSelectingFrom = selectingFromRef.current;
    console.log("=== handleMapClick START ===", { coords, selectingFrom: isSelectingFrom, stateSelectingFrom: selectingFrom });
    
    if (!window.ymaps || !mapInstanceRef.current) {
      console.error("Map not ready!");
      return;
    }

    // Сразу сохраняем координаты и ставим маркер
    let address = `Координаты: ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
    
    console.log("Coordinates saved:", coords, "Mode:", isSelectingFrom ? "FROM" : "TO");

    try {
      // Пытаемся получить адрес
      console.log("Trying to geocode...");
      const geocodeResult = await window.ymaps.geocode(coords);
      const firstGeoObject = geocodeResult.geoObjects.get(0);
      
      if (firstGeoObject) {
        const geocodedAddress = firstGeoObject.getAddressLine();
        if (geocodedAddress) {
          address = geocodedAddress;
          console.log("Got address:", address);
        } else {
          console.log("No address from geocode, using coordinates");
        }
      } else {
        console.log("No geocode result, using coordinates");
      }

      if (isSelectingFrom) {
        // Удаляем старый маркер отправления
        if (fromMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.geoObjects.remove(fromMarkerRef.current);
        }

        // Создаем новый маркер отправления
        fromMarkerRef.current = new window.ymaps.Placemark(
          coords,
          {
            balloonContent: `${t("orders.map.from")}: ${address}`,
            iconCaption: t("orders.map.from")
          },
          {
            preset: 'islands#blueCircleDotIcon'
          }
        );

        mapInstanceRef.current.geoObjects.add(fromMarkerRef.current);
        
        // Вызываем callback для обновления родителя - передаем только "from"
        console.log("Calling onRouteSelect with:", { from: address, fromCoords: coords });
        if (onRouteSelect) {
          onRouteSelect({
            from: address,
            fromCoords: coords,
            // НЕ передаем to и toCoords - они сохранятся из предыдущего состояния
          });
          console.log("onRouteSelect called successfully");
        }
        
        // Обновляем маршрут если обе точки выбраны
        setTimeout(() => {
          if (toCity) {
            updateRoute();
          }
        }, 100);
      } else {
        // Удаляем старый маркер назначения
        if (toMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.geoObjects.remove(toMarkerRef.current);
        }

        // Создаем новый маркер назначения
        toMarkerRef.current = new window.ymaps.Placemark(
          coords,
          {
            balloonContent: `${t("orders.map.to")}: ${address}`,
            iconCaption: t("orders.map.to")
          },
          {
            preset: 'islands#redCircleDotIcon'
          }
        );

        mapInstanceRef.current.geoObjects.add(toMarkerRef.current);
        
        // Вызываем callback для обновления родителя - передаем только "to"
        console.log("Calling onRouteSelect with:", { to: address, toCoords: coords });
        if (onRouteSelect) {
          onRouteSelect({
            to: address,
            toCoords: coords,
            // НЕ передаем from и fromCoords - они сохранятся из предыдущего состояния
          });
          console.log("onRouteSelect called successfully");
        }
        
        // Обновляем маршрут если обе точки выбраны
        setTimeout(() => {
          if (fromCity) {
            updateRoute();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error in handleMapClick:", error);
      // Даже если ошибка, сохраняем координаты
      const fallbackAddress = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
      
      if (isSelectingFrom) {
        if (fromMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.geoObjects.remove(fromMarkerRef.current);
        }
        
        fromMarkerRef.current = new window.ymaps.Placemark(
          coords,
          { iconCaption: t("orders.map.from") },
          { preset: 'islands#blueCircleDotIcon' }
        );
        
        mapInstanceRef.current.geoObjects.add(fromMarkerRef.current);
        
        if (onRouteSelect) {
          onRouteSelect({
            from: fallbackAddress,
            fromCoords: coords,
            // НЕ передаем to и toCoords - они сохранятся
          });
        }
      } else {
        if (toMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.geoObjects.remove(toMarkerRef.current);
        }
        
        toMarkerRef.current = new window.ymaps.Placemark(
          coords,
          { iconCaption: t("orders.map.to") },
          { preset: 'islands#redCircleDotIcon' }
        );
        
        mapInstanceRef.current.geoObjects.add(toMarkerRef.current);
        
        if (onRouteSelect) {
          onRouteSelect({
            to: fallbackAddress,
            toCoords: coords,
            // НЕ передаем from и fromCoords - они сохранятся
          });
        }
      }
    }
  };

  const updateRoute = async () => {
    if (!window.ymaps || !mapInstanceRef.current || !fromCity || !toCity) return;

    try {
      // Удаляем старую линию маршрута
      if (routeLineRef.current) {
        mapInstanceRef.current.geoObjects.remove(routeLineRef.current);
      }

      // Создаем маршрут
      const multiRoute = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [fromCity, toCity],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true
      });

      mapInstanceRef.current.geoObjects.add(multiRoute);
      routeLineRef.current = multiRoute;

      // Подстраиваем карту под маршрут
      mapInstanceRef.current.setBounds(
        multiRoute.getBounds(),
        { checkZoomRange: true, duration: 300 }
      );
    } catch (error) {
      console.error("Route calculation error:", error);
    }
  };

  const clearFrom = () => {
    if (fromMarkerRef.current) {
      mapInstanceRef.current.geoObjects.remove(fromMarkerRef.current);
      fromMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      mapInstanceRef.current.geoObjects.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    // Уведомляем родителя об очистке - передаем только очищенное значение
    if (onRouteSelect) {
      onRouteSelect({
        from: "",
        fromCoords: null,
        // НЕ передаем to и toCoords - они сохранятся
      });
    }
  };

  const clearTo = () => {
    if (toMarkerRef.current) {
      mapInstanceRef.current.geoObjects.remove(toMarkerRef.current);
      toMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      mapInstanceRef.current.geoObjects.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    // Уведомляем родителя об очистке - передаем только очищенное значение
    if (onRouteSelect) {
      onRouteSelect({
        to: "",
        toCoords: null,
        // НЕ передаем from и fromCoords - они сохранятся
      });
    }
  };

  return (
      <div className="w-full flex flex-col gap-2 sm:gap-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex gap-1 sm:gap-2 items-center flex-1">
          <Button
            type="button"
            variant={selectingFrom ? "default" : "outline"}
            size="sm"
            onClick={() => {
              selectingFromRef.current = true;
              setSelectingFrom(true);
            }}
            className="text-[10px] sm:text-xs flex-1 sm:flex-initial"
          >
            <span className="truncate">
              {fromCity ? fromCity : t("orders.map.from")}
            </span>
          </Button>
          {fromCity && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFrom}
              className="text-xs h-8 w-8 p-0 flex-shrink-0"
            >
              ✕
            </Button>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2 items-center flex-1">
          <Button
            type="button"
            variant={!selectingFrom ? "default" : "outline"}
            size="sm"
            onClick={() => {
              selectingFromRef.current = false;
              setSelectingFrom(false);
            }}
            className="text-[10px] sm:text-xs flex-1 sm:flex-initial"
          >
            <span className="truncate">
              {toCity ? toCity : t("orders.map.to")}
            </span>
          </Button>
          {toCity && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearTo}
              className="text-xs h-8 w-8 p-0 flex-shrink-0"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
      <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden border shadow-lg relative">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: "250px" }} />
        {!mapReady && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-sm text-gray-500">{t("orders.loading")}</div>
          </div>
        )}
        {mapReady && selectingFrom && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs z-20 pointer-events-none shadow-lg">
            👆 {t("orders.map.from")}
          </div>
        )}
        {mapReady && !selectingFrom && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs z-20 pointer-events-none shadow-lg">
            👆 {t("orders.map.to")}
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteSelectorMap;

