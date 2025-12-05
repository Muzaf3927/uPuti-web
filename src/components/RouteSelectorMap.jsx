import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { Navigation } from "lucide-react";
import { toast } from "sonner";

// Исправляем иконки маркеров для Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Создаем кастомные иконки для маркеров
const fromIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const toIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RouteSelectorMap({ onRouteSelect, fromCity, toCity, isOpen = true, initialFromCoords = null, initialToCoords = null }) {
  const { t } = useI18n();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fromMarkerRef = useRef(null);
  const toMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const selectingFromRef = useRef(true);

  useEffect(() => {
    selectingFromRef.current = selectingFrom;
  }, [selectingFrom]);

  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
      return;
    }

    if (!mapRef.current || mapInstanceRef.current) return;

    // Инициализируем карту
    const map = L.map(mapRef.current, {
      center: [41.3111, 69.2797], // Ташкент
      zoom: 10,
      zoomControl: true,
    });

    // Добавляем тайлы OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Обработка клика на карте
    map.on("click", (e) => {
      const coords = [e.latlng.lat, e.latlng.lng];
      handleMapClick(coords);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (fromCity && toCity && mapInstanceRef.current) {
      updateRoute();
    }
  }, [fromCity, toCity]);

  // Отображаем начальные маркеры, если координаты уже заданы (для режима редактирования)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    // Отображаем маркер "Откуда", если координаты заданы
    if (initialFromCoords && (initialFromCoords.lat || initialFromCoords[0])) {
      const lat = initialFromCoords.lat || initialFromCoords[0];
      const lng = initialFromCoords.lng || initialFromCoords[1];
      const coords = [lat, lng];

      // Удаляем старый маркер, если есть
      if (fromMarkerRef.current) {
        mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      }

      // Создаем маркер с адресом
      const address = fromCity || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      fromMarkerRef.current = L.marker(coords, { icon: fromIcon })
        .bindPopup(`${t("orders.map.from")}: ${address}`)
        .addTo(mapInstanceRef.current);

      // Обновляем состояние выбора
      setSelectingFrom(false);
      selectingFromRef.current = false;
    }

    // Отображаем маркер "Куда", если координаты заданы
    if (initialToCoords && (initialToCoords.lat || initialToCoords[0])) {
      const lat = initialToCoords.lat || initialToCoords[0];
      const lng = initialToCoords.lng || initialToCoords[1];
      const coords = [lat, lng];

      // Удаляем старый маркер, если есть
      if (toMarkerRef.current) {
        mapInstanceRef.current.removeLayer(toMarkerRef.current);
      }

      // Создаем маркер с адресом
      const address = toCity || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      toMarkerRef.current = L.marker(coords, { icon: toIcon })
        .bindPopup(`${t("orders.map.to")}: ${address}`)
        .addTo(mapInstanceRef.current);
    }

    // Рисуем линию маршрута, если обе точки заданы
    if (initialFromCoords && initialToCoords && mapInstanceRef.current) {
      const fromLat = initialFromCoords.lat || initialFromCoords[0];
      const fromLng = initialFromCoords.lng || initialFromCoords[1];
      const toLat = initialToCoords.lat || initialToCoords[0];
      const toLng = initialToCoords.lng || initialToCoords[1];

      // Удаляем старую линию, если есть
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
      }

      // Рисуем линию маршрута
      const routeLine = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
      }).addTo(mapInstanceRef.current);

      routeLineRef.current = routeLine;

      // Подстраиваем карту под маршрут
      const bounds = L.latLngBounds([[fromLat, fromLng], [toLat, toLng]]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [mapReady, initialFromCoords, initialToCoords, fromCity, toCity, t]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
    return null;
  };

  const handleMapClick = async (coords) => {
    const isSelectingFrom = selectingFromRef.current;
    console.log("=== handleMapClick START ===", { coords, selectingFrom: isSelectingFrom });

    if (!mapInstanceRef.current) {
      console.error("Map not ready!");
      return;
    }

    let address = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;

    try {
      const geocodedAddress = await reverseGeocode(coords[0], coords[1]);
      if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
        address = geocodedAddress;
        console.log("Got address:", address);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }

    if (isSelectingFrom) {
      // Удаляем старый маркер отправления
      if (fromMarkerRef.current) {
        mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      }

      // Создаем новый маркер отправления
      fromMarkerRef.current = L.marker(coords, { icon: fromIcon })
        .bindPopup(`${t("orders.map.from")}: ${address}`)
        .addTo(mapInstanceRef.current);

      if (onRouteSelect) {
        onRouteSelect({
          from: address,
          fromCoords: coords,
        });
      }

      // Автоматически переключаемся на выбор "Куда" после выбора "Откуда"
      if (!toCity) {
        // Переключаемся на выбор "Куда" сразу после выбора "Откуда"
        setTimeout(() => {
          selectingFromRef.current = false;
          setSelectingFrom(false);
        }, 100);
      } else {
        // Обновляем маршрут если обе точки выбраны
        setTimeout(() => {
          updateRoute();
        }, 100);
      }
    } else {
      // Удаляем старый маркер назначения
      if (toMarkerRef.current) {
        mapInstanceRef.current.removeLayer(toMarkerRef.current);
      }

      // Создаем новый маркер назначения
      toMarkerRef.current = L.marker(coords, { icon: toIcon })
        .bindPopup(`${t("orders.map.to")}: ${address}`)
        .addTo(mapInstanceRef.current);

      if (onRouteSelect) {
        onRouteSelect({
          to: address,
          toCoords: coords,
        });
      }

      // Обновляем маршрут если обе точки выбраны
      if (fromCity) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      }
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ru`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const updateRoute = async () => {
    if (!mapInstanceRef.current || !fromCity || !toCity) return;

    try {
      // Удаляем старую линию маршрута
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
      }

      // Геокодируем адреса для получения координат
      const fromCoords = await geocodeAddress(fromCity);
      const toCoords = await geocodeAddress(toCity);

      if (fromCoords && toCoords) {
        // Рисуем прямую линию между точками
        const routeLine = L.polyline([fromCoords, toCoords], {
          color: "#3b82f6",
          weight: 4,
          opacity: 0.7,
        }).addTo(mapInstanceRef.current);

        routeLineRef.current = routeLine;

        // Подстраиваем карту под маршрут
        const bounds = L.latLngBounds([fromCoords, toCoords]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } catch (error) {
      console.error("Route calculation error:", error);
    }
  };

  const clearFrom = () => {
    if (fromMarkerRef.current) {
      mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      fromMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (onRouteSelect) {
      onRouteSelect({
        from: "",
        fromCoords: null,
      });
    }
  };

  const clearTo = () => {
    if (toMarkerRef.current) {
      mapInstanceRef.current.removeLayer(toMarkerRef.current);
      toMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (onRouteSelect) {
      onRouteSelect({
        to: "",
        toCoords: null,
      });
    }
  };

  const locateUser = () => {
    if (!mapInstanceRef.current) return;

    setIsLocating(true);

    if (!navigator.geolocation) {
      toast.error("Геолокация не поддерживается вашим браузером");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = [latitude, longitude];

        // Перемещаем карту к местоположению пользователя
        mapInstanceRef.current.setView(userLocation, 15, {
          animate: true,
          duration: 0.5,
        });

        // Автоматически выбираем эту точку как "откуда" или "куда"
        await handleMapClick(userLocation);

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Не удалось определить ваше местоположение";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Доступ к геолокации запрещен. Разрешите доступ в настройках браузера";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Информация о местоположении недоступна";
            break;
          case error.TIMEOUT:
            errorMessage = "Превышено время ожидания определения местоположения";
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 sm:gap-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between flex-shrink-0">
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
            <span className="truncate">{fromCity ? fromCity : t("orders.map.from")}</span>
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
              // Если адрес уже выбран, можно переопределить его
            }}
            className="text-[10px] sm:text-xs flex-1 sm:flex-initial"
          >
            <span className="truncate">{toCity ? toCity : t("orders.map.to")}</span>
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
      <div className="w-full flex-1 min-h-[65vh] sm:min-h-[500px] md:min-h-[550px] rounded-2xl overflow-hidden border shadow-lg relative">
        <div ref={mapRef} className="w-full h-full" />
        {/* Кнопка определения местоположения */}
        {mapReady && (
          <button
            onClick={locateUser}
            disabled={isLocating}
            className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2.5 sm:p-3 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
            aria-label="Определить моё местоположение"
            title="Определить моё местоположение"
          >
            <Navigation 
              size={18} 
              className={`text-blue-600 ${isLocating ? "animate-spin" : ""}`}
            />
          </button>
        )}
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
