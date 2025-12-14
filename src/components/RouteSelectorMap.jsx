import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/app/i18n.jsx";
import { Navigation, Search, MapPin, X } from "lucide-react";
import { toast } from "sonner";

// Исправляем иконки маркеров для Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Создаем кастомную иконку с поднятой рукой для точки отправления (Point A)
// Используем готовую иконку из public/passenger.png в желтой оболочке со стрелкой вниз
const createPassengerIcon = () => {
  const iconHtml = `
    <div style="position: relative; display: inline-block; width: 50px; height: 70px;">
      <!-- Желтая оболочка (круг) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 44px;
        background-color: #FFD700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <!-- Иконка пассажира внутри круга -->
        <img src="/passenger.png" alt="Passenger" style="width: 36px; height: 36px; display: block;" />
      </div>
      <!-- Вертикальная линия вниз -->
      <div style="
        position: absolute;
        left: 50%;
        top: 44px;
        transform: translateX(-50%);
        width: 2px;
        height: 20px;
        background-color: #000000;
      "></div>
      <!-- Острие стрелки внизу -->
      <div style="
        position: absolute;
        left: 50%;
        top: 64px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #000000;
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-passenger-marker',
    iconSize: [50, 70], // Размер иконки (ширина, высота с учетом стрелки)
    iconAnchor: [25, 70], // Точка привязки (центр по X, низ по Y - конец стрелки)
    popupAnchor: [0, -70], // Смещение для попапа
  });
};

const fromIcon = createPassengerIcon();

// Создаем кастомную иконку для конечной точки (куда)
// Используем готовую иконку из public/toAddress.png в желтой оболочке со стрелкой вниз
const createToAddressIcon = () => {
  const iconHtml = `
    <div style="position: relative; display: inline-block; width: 50px; height: 70px;">
      <!-- Желтая оболочка (круг) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 44px;
        background-color: #FFD700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <!-- Иконка конечной точки внутри круга -->
        <img src="/toAddress.png" alt="To Address" style="width: 36px; height: 36px; display: block;" />
      </div>
      <!-- Вертикальная линия вниз -->
      <div style="
        position: absolute;
        left: 50%;
        top: 44px;
        transform: translateX(-50%);
        width: 2px;
        height: 20px;
        background-color: #000000;
      "></div>
      <!-- Острие стрелки внизу -->
      <div style="
        position: absolute;
        left: 50%;
        top: 64px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #000000;
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-to-address-marker',
    iconSize: [50, 70], // Размер иконки (ширина, высота с учетом стрелки)
    iconAnchor: [25, 70], // Точка привязки (центр по X, низ по Y - конец стрелки)
    popupAnchor: [0, -70], // Смещение для попапа
  });
};

const toIcon = createToAddressIcon();

// Создаем зеленую иконку для активных заказов с пульсирующей анимацией
const createActiveOrderIcon = () => {
  const iconHtml = `
    <div style="position: relative; display: inline-block; width: 50px; height: 70px;">
      <!-- Пульсирующий круг (анимация) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 44px;
        height: 44px;
        border: 3px solid #22c55e;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
        opacity: 0.8;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      "></div>
      <!-- Второй пульсирующий круг (задержка) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 44px;
        height: 44px;
        border: 3px solid #22c55e;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite 0.5s;
        opacity: 0.8;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      "></div>
      <!-- Зеленая оболочка (круг) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 44px;
        background-color: #22c55e;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1;
      ">
        <!-- Иконка пассажира внутри круга -->
        <img src="/passenger.png" alt="Passenger" style="width: 36px; height: 36px; display: block;" />
      </div>
      <!-- Вертикальная линия вниз -->
      <div style="
        position: absolute;
        left: 50%;
        top: 44px;
        transform: translateX(-50%);
        width: 2px;
        height: 20px;
        background-color: #000000;
        z-index: 1;
      "></div>
      <!-- Острие стрелки внизу -->
      <div style="
        position: absolute;
        left: 50%;
        top: 64px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #000000;
        z-index: 1;
      "></div>
      <style>
        @keyframes pulse {
          0% {
            transform: translateX(-50%) translateY(-50%) scale(1);
            opacity: 0.8;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            transform: translateX(-50%) translateY(-50%) scale(1.8);
            opacity: 0.5;
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
          100% {
            transform: translateX(-50%) translateY(-50%) scale(2.5);
            opacity: 0;
            box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
          }
        }
      </style>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-active-order-marker',
    iconSize: [50, 70],
    iconAnchor: [25, 70],
    popupAnchor: [0, -70],
  });
};

const activeOrderIcon = createActiveOrderIcon();

// Создаем синюю иконку для заказов в процессе (водитель уже нашелся и едет)
const createInProgressOrderIcon = () => {
  const iconHtml = `
    <div style="position: relative; display: inline-block; width: 50px; height: 70px;">
      <!-- Вращающийся круг (анимация движения) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 60px;
        height: 60px;
        border: 3px solid #3b82f6;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1.5s linear infinite;
        opacity: 0.8;
      "></div>
      <!-- Пульсирующий круг (анимация) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 44px;
        height: 44px;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        animation: pulseBlue 2s ease-in-out infinite;
        opacity: 0.8;
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      "></div>
      <!-- Синяя оболочка (круг) -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 44px;
        background-color: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1;
      ">
        <!-- Иконка машины внутри круга -->
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
          <path d="M5 11L6.5 6.5H17.5L19 11M5 11H3M5 11V18M19 11H21M19 11V18M7 18H5M19 18H17M7 18V16H17V18M7 18H17M9 6.5V4H15V6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <!-- Вертикальная линия вниз -->
      <div style="
        position: absolute;
        left: 50%;
        top: 44px;
        transform: translateX(-50%);
        width: 2px;
        height: 20px;
        background-color: #000000;
        z-index: 1;
      "></div>
      <!-- Острие стрелки внизу -->
      <div style="
        position: absolute;
        left: 50%;
        top: 64px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #000000;
        z-index: 1;
      "></div>
      <style>
        @keyframes spin {
          0% {
            transform: translateX(-50%) translateY(-50%) rotate(0deg);
          }
          100% {
            transform: translateX(-50%) translateY(-50%) rotate(360deg);
          }
        }
        @keyframes pulseBlue {
          0% {
            transform: translateX(-50%) translateY(-50%) scale(1);
            opacity: 0.8;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            transform: translateX(-50%) translateY(-50%) scale(1.8);
            opacity: 0.5;
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            transform: translateX(-50%) translateY(-50%) scale(2.5);
            opacity: 0;
            box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
          }
        }
      </style>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-in-progress-order-marker',
    iconSize: [50, 70],
    iconAnchor: [25, 70],
    popupAnchor: [0, -70],
  });
};

const inProgressOrderIcon = createInProgressOrderIcon();

function RouteSelectorMap({ onRouteSelect, fromCity, toCity, isOpen = true, initialFromCoords = null, initialToCoords = null, activeOrders = [], inProgressOrders = [], onActiveOrderClick = null, onInProgressOrderClick = null }) {
  const { t } = useI18n();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fromMarkerRef = useRef(null);
  const toMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const activeOrdersMarkersRef = useRef([]);
  const inProgressOrdersMarkersRef = useRef([]);
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const selectingFromRef = useRef(true);
  const [fromSearchQuery, setFromSearchQuery] = useState("");
  const [toSearchQuery, setToSearchQuery] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

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

  // Синхронизируем поля поиска с начальными значениями
  useEffect(() => {
    if (fromCity && !fromSearchQuery) {
      setFromSearchQuery(fromCity);
    } else if (!fromCity) {
      // Если fromCity стал пустым, очищаем маркеры и поле поиска
      if (fromMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(fromMarkerRef.current);
        fromMarkerRef.current = null;
      }
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      setFromSearchQuery("");
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }, [fromCity]);

  useEffect(() => {
    if (toCity && !toSearchQuery) {
      setToSearchQuery(toCity);
    } else if (!toCity) {
      // Если toCity стал пустым, очищаем маркеры и поле поиска
      if (toMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(toMarkerRef.current);
        toMarkerRef.current = null;
      }
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      setToSearchQuery("");
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }, [toCity]);

  // Сбрасываем выбор на первое поле, когда оба адреса пустые
  useEffect(() => {
    if (!fromCity && !toCity) {
      setSelectingFrom(true);
      selectingFromRef.current = true;
    }
  }, [fromCity, toCity]);

  // Отображаем активные заказы на карте
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !activeOrders || activeOrders.length === 0) {
      // Удаляем все маркеры активных заказов, если их нет
      if (activeOrdersMarkersRef.current.length > 0) {
        activeOrdersMarkersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        activeOrdersMarkersRef.current = [];
      }
      return;
    }

    // Удаляем старые маркеры
    activeOrdersMarkersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    activeOrdersMarkersRef.current = [];

    // Создаем маркеры только для начального адреса каждого активного заказа
    activeOrders.forEach((order) => {
      if (order.from_lat && order.from_lng) {
        const fromMarker = L.marker([order.from_lat, order.from_lng], {
          icon: activeOrderIcon
        })
          .bindPopup(`<div><strong>${order.from_address || 'Не указано'}</strong></div>`)
          .addTo(mapInstanceRef.current);
        
        // Добавляем обработчик клика для открытия bottom sheet
        if (onActiveOrderClick) {
          fromMarker.on('click', () => {
            onActiveOrderClick(order);
          });
        }
        
        activeOrdersMarkersRef.current.push(fromMarker);
      }
    });
  }, [mapReady, activeOrders, onActiveOrderClick]);

  // Отображаем заказы в процессе (in_progress) на карте
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !inProgressOrders || inProgressOrders.length === 0) {
      // Удаляем все маркеры заказов в процессе, если их нет
      if (inProgressOrdersMarkersRef.current.length > 0) {
        inProgressOrdersMarkersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        inProgressOrdersMarkersRef.current = [];
      }
      return;
    }

    // Удаляем старые маркеры
    inProgressOrdersMarkersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    inProgressOrdersMarkersRef.current = [];

    // Создаем маркеры только для начального адреса каждого заказа в процессе
    inProgressOrders.forEach((order) => {
      if (order.from_lat && order.from_lng) {
        const fromMarker = L.marker([order.from_lat, order.from_lng], {
          icon: inProgressOrderIcon
        })
          .bindPopup(`<div><strong>${order.from_address || 'Не указано'}</strong><br/>Водитель уже нашелся и едет</div>`)
          .addTo(mapInstanceRef.current);
        
        // Добавляем обработчик клика для открытия bottom sheet
        if (onInProgressOrderClick) {
          fromMarker.on('click', () => {
            onInProgressOrderClick(order);
          });
        }
        
        inProgressOrdersMarkersRef.current.push(fromMarker);
      }
    });
  }, [mapReady, inProgressOrders, onInProgressOrderClick]);

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

      // Создаем маркер с адресом и возможностью перетаскивания
      const address = fromCity || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      fromMarkerRef.current = L.marker(coords, { 
        icon: fromIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.from")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Откуда"
      fromMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.from")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setFromSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть конечная точка
        // Линия маршрута отключена
        // if (toMarkerRef.current) {
        //   const toPosition = toMarkerRef.current.getLatLng();
        //   const toCoords = [toPosition.lat, toPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([newCoords, toCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            from: newAddress,
            fromCoords: newCoords,
          });
        }
      });

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

      // Создаем маркер с адресом и возможностью перетаскивания
      const address = toCity || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      toMarkerRef.current = L.marker(coords, { 
        icon: toIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.to")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Куда"
      toMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.to")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setToSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть начальная точка
        // Линия маршрута отключена
        // if (fromMarkerRef.current) {
        //   const fromPosition = fromMarkerRef.current.getLatLng();
        //   const fromCoords = [fromPosition.lat, fromPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([fromCoords, newCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            to: newAddress,
            toCoords: newCoords,
          });
        }
      });
    }

    // Линия маршрута отключена
    // Рисуем линию маршрута, если обе точки заданы
    if (initialFromCoords && initialToCoords && mapInstanceRef.current) {
      const fromLat = initialFromCoords.lat || initialFromCoords[0];
      const fromLng = initialFromCoords.lng || initialFromCoords[1];
      const toLat = initialToCoords.lat || initialToCoords[0];
      const toLng = initialToCoords.lng || initialToCoords[1];

      // Удаляем старую линию, если есть
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      // Линия маршрута отключена
      // // Рисуем линию маршрута
      // const routeLine = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
      //   color: "#3b82f6",
      //   weight: 4,
      //   opacity: 0.7,
      // }).addTo(mapInstanceRef.current);
      // routeLineRef.current = routeLine;

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

      // Создаем новый маркер отправления с возможностью перетаскивания
      fromMarkerRef.current = L.marker(coords, { 
        icon: fromIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.from")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Откуда"
      fromMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.from")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setFromSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть конечная точка
        // Линия маршрута отключена
        // if (toMarkerRef.current) {
        //   const toPosition = toMarkerRef.current.getLatLng();
        //   const toCoords = [toPosition.lat, toPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([newCoords, toCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            from: newAddress,
            fromCoords: newCoords,
          });
        }
      });

      // Обновляем поле поиска
      setFromSearchQuery(address);

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

      // Создаем новый маркер назначения с возможностью перетаскивания
      toMarkerRef.current = L.marker(coords, { 
        icon: toIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.to")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Куда"
      toMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.to")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setToSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть начальная точка
        // Линия маршрута отключена
        // if (fromMarkerRef.current) {
        //   const fromPosition = fromMarkerRef.current.getLatLng();
        //   const fromCoords = [fromPosition.lat, fromPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([fromCoords, newCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            to: newAddress,
            toCoords: newCoords,
          });
        }
      });

      // Обновляем поле поиска
      setToSearchQuery(address);

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

  // Функция для поиска адресов с автодополнением
  const searchAddresses = async (query) => {
    if (!query || query.length < 3) {
      return [];
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Узбекистан")}&limit=5&accept-language=ru&addressdetails=1`
      );
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Address search error:", error);
      return [];
    }
  };

  // Обработка поиска адреса "Откуда"
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (fromSearchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchAddresses(fromSearchQuery);
        setFromSuggestions(results);
        setShowFromSuggestions(true);
      }, 300);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fromSearchQuery]);

  // Обработка поиска адреса "Куда"
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (toSearchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchAddresses(toSearchQuery);
        setToSuggestions(results);
        setShowToSuggestions(true);
      }, 300);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [toSearchQuery]);

  // Обработка выбора адреса "Откуда"
  const handleFromAddressSelect = async (suggestion) => {
    const address = suggestion.display_name;
    const coords = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    
    setFromSearchQuery(address);
    setShowFromSuggestions(false);
    setFromSuggestions([]);
    
    // Устанавливаем маркер на карте
    if (mapInstanceRef.current) {
      if (fromMarkerRef.current) {
        mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      }
      
      fromMarkerRef.current = L.marker(coords, { 
        icon: fromIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.from")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Откуда"
      fromMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.from")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setFromSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть конечная точка
        // Линия маршрута отключена
        // if (toMarkerRef.current) {
        //   const toPosition = toMarkerRef.current.getLatLng();
        //   const toCoords = [toPosition.lat, toPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([newCoords, toCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            from: newAddress,
            fromCoords: newCoords,
          });
        }
      });
      
      // Если есть точка назначения, обновляем маршрут
      if (toCity && toMarkerRef.current) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      } else {
        mapInstanceRef.current.setView(coords, 15, { animate: true });
      }
    }
    
    // Обновляем состояние
    if (onRouteSelect) {
      onRouteSelect({
        from: address,
        fromCoords: coords,
      });
    }
    
    // Переключаемся на выбор "Куда"
    setSelectingFrom(false);
    selectingFromRef.current = false;
  };

  // Обработка выбора адреса "Куда"
  const handleToAddressSelect = async (suggestion) => {
    const address = suggestion.display_name;
    const coords = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    
    setToSearchQuery(address);
    setShowToSuggestions(false);
    setToSuggestions([]);
    
    // Устанавливаем маркер на карте
    if (mapInstanceRef.current) {
      if (toMarkerRef.current) {
        mapInstanceRef.current.removeLayer(toMarkerRef.current);
      }
      
      toMarkerRef.current = L.marker(coords, { 
        icon: toIcon,
        draggable: true
      })
        .bindPopup(`${t("orders.map.to")}: ${address}`)
        .addTo(mapInstanceRef.current);
      
      // Обработчик перемещения маркера "Куда"
      toMarkerRef.current.on('dragend', async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newCoords = [position.lat, position.lng];
        
        // Получаем адрес для новых координат
        let newAddress = `${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`;
        try {
          const geocodedAddress = await reverseGeocode(newCoords[0], newCoords[1]);
          if (geocodedAddress && !geocodedAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
            newAddress = geocodedAddress;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        
        // Обновляем popup
        marker.setPopupContent(`${t("orders.map.to")}: ${newAddress}`).openPopup();
        
        // Обновляем поле поиска
        setToSearchQuery(newAddress);
        
        // Обновляем маршрут, если есть начальная точка
        // Линия маршрута отключена
        // if (fromMarkerRef.current) {
        //   const fromPosition = fromMarkerRef.current.getLatLng();
        //   const fromCoords = [fromPosition.lat, fromPosition.lng];
        //   
        //   // Обновляем линию маршрута
        //   if (routeLineRef.current) {
        //     mapInstanceRef.current.removeLayer(routeLineRef.current);
        //   }
        //   
        //   const routeLine = L.polyline([fromCoords, newCoords], {
        //     color: "#3b82f6",
        //     weight: 4,
        //     opacity: 0.7,
        //   }).addTo(mapInstanceRef.current);
        //   
        //   routeLineRef.current = routeLine;
        // }
        
        // Обновляем состояние через onRouteSelect
        if (onRouteSelect) {
          onRouteSelect({
            to: newAddress,
            toCoords: newCoords,
          });
        }
      });
      
      // Обновляем маршрут если обе точки выбраны
      if (fromCity) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      } else {
        mapInstanceRef.current.setView(coords, 15, { animate: true });
      }
    }
    
    // Обновляем состояние
    if (onRouteSelect) {
      onRouteSelect({
        to: address,
        toCoords: coords,
      });
    }
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
        // Линия маршрута отключена
        // // Рисуем прямую линию между точками
        // const routeLine = L.polyline([fromCoords, toCoords], {
        //   color: "#3b82f6",
        //   weight: 4,
        //   opacity: 0.7,
        // }).addTo(mapInstanceRef.current);
        // routeLineRef.current = routeLine;

        // Подстраиваем карту под маршрут
        const bounds = L.latLngBounds([fromCoords, toCoords]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } catch (error) {
      console.error("Route calculation error:", error);
    }
  };

  const clearFrom = () => {
    if (fromMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      fromMarkerRef.current = null;
    }
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    setFromSearchQuery("");
    setFromSuggestions([]);
    setShowFromSuggestions(false);
    if (onRouteSelect) {
      onRouteSelect({
        from: "",
        fromCoords: null,
      });
    }
  };

  const clearTo = () => {
    if (toMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(toMarkerRef.current);
      toMarkerRef.current = null;
    }
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    setToSearchQuery("");
    setToSuggestions([]);
    setShowToSuggestions(false);
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

  // Закрываем выпадающие списки при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.address-search-container')) {
        setShowFromSuggestions(false);
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-2 sm:gap-3">
      {/* Поля поиска адресов */}
      <div className="flex flex-col gap-2 flex-shrink-0 relative">
        {/* Поле "Откуда" */}
        <div className="relative address-search-container" style={{ zIndex: showFromSuggestions ? 10000 : 'auto' }}>
          <div className="flex items-center gap-2">
            <img src="/passenger.png" alt="From" className="flex-shrink-0" style={{ width: '18px', height: '18px' }} />
            <Input
              type="text"
              placeholder={t("orders.form.from")}
              value={fromSearchQuery || fromCity || ""}
              onChange={(e) => {
                setFromSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  setShowFromSuggestions(true);
                } else {
                  setShowFromSuggestions(false);
                }
                selectingFromRef.current = true;
                setSelectingFrom(true);
              }}
              onFocus={() => {
                if (fromSearchQuery.length >= 3) {
                  setShowFromSuggestions(true);
                }
                selectingFromRef.current = true;
                setSelectingFrom(true);
              }}
              className="flex-1"
            />
            {fromCity && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFrom();
                  setFromSearchQuery("");
                }}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Выпадающий список предложений для "Откуда" */}
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ position: 'absolute', zIndex: 10001, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}>
              {fromSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFromAddressSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 bg-white"
                >
                  <div className="flex items-start gap-2">
                    <img src="/passenger.png" alt="From" className="flex-shrink-0 mt-0.5" style={{ width: '14px', height: '14px' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.display_name}
                      </div>
                      {suggestion.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.address.city || suggestion.address.town || ""}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Поле "Куда" */}
        <div className="relative address-search-container" style={{ zIndex: showToSuggestions ? 10000 : 'auto' }}>
          <div className="flex items-center gap-2">
            <img src="/toAddress.png" alt="To" className="flex-shrink-0" style={{ width: '18px', height: '18px' }} />
            <Input
              type="text"
              placeholder={t("orders.form.to")}
              value={toSearchQuery || toCity || ""}
              onChange={(e) => {
                setToSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  setShowToSuggestions(true);
                } else {
                  setShowToSuggestions(false);
                }
                selectingFromRef.current = false;
                setSelectingFrom(false);
              }}
              onFocus={() => {
                if (toSearchQuery.length >= 3) {
                  setShowToSuggestions(true);
                }
                selectingFromRef.current = false;
                setSelectingFrom(false);
              }}
              className="flex-1"
            />
            {toCity && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearTo();
                  setToSearchQuery("");
                }}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Выпадающий список предложений для "Куда" */}
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ position: 'absolute', zIndex: 10001, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}>
              {toSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleToAddressSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 bg-white"
                >
                  <div className="flex items-start gap-2">
                    <img src="/toAddress.png" alt="To" className="flex-shrink-0 mt-0.5" style={{ width: '14px', height: '14px' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.display_name}
                      </div>
                      {suggestion.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.address.city || suggestion.address.town || ""}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex-1 min-h-[450px] max-h-[calc(100svh-180px)] sm:min-h-[550px] sm:max-h-[600px] rounded-2xl overflow-hidden border shadow-lg relative">
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
