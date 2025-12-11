import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet Routing Machine подключается через script тег в index.html
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import OrderBottomSheet from "./OrderBottomSheet";
import DriverOfferDialog from "./DriverOfferDialog";
import { sessionManager } from "@/lib/sessionManager";
import { postData } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/app/i18n.jsx";

// Исправляем иконки маркеров для Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function OrdersMap({ orders = [], isLoading, onRefresh, mapHeight, onEditOrder, onDeleteOrder, onCompleteOrder, showRoute = false }) {
  const { t } = useI18n();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterGroupRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const selectedMarkerRef = useRef(null);
  const selectedOrderRef = useRef(null);
  const lastSelectedOrderIdRef = useRef(null); // Сохраняем ID последнего выбранного заказа
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const queryClient = useQueryClient();
  const routePolylineRef = useRef(null);
  const fromMarkerRef = useRef(null);
  const toMarkerRef = useRef(null);
  const currentRouteOrderIdRef = useRef(null); // Отслеживаем ID заказа, для которого рисуется маршрут
  const routingControlRef = useRef(null); // Референс для Leaflet Routing Machine

  // Получаем текущего пользователя
  const currentUser = sessionManager.getUserData();
  const currentUserId = currentUser?.id;

  // Находим оффер текущего пользователя для выбранного заказа
  const userOffer = useMemo(() => {
    if (!currentUserId || !selectedOrder?.driver_offers || !Array.isArray(selectedOrder.driver_offers)) {
      return null;
    }
    return selectedOrder.driver_offers.find(
      (offer) => offer.user_id === currentUserId && (offer.status === "pending" || offer.status === "accepted")
    );
  }, [selectedOrder?.driver_offers, currentUserId]);

  // Функция отмены оффера
  const handleCancelOffer = async () => {
    if (!userOffer?.id || isCanceling) return;

    setIsCanceling(true);
    try {
      const res = await postData(`/driver-offers/${userOffer.id}/delete`, {});
      
      // Проверяем успешный ответ от бэкенда
      if (res.message === "Offer delete successfully") {
        toast.success(t("orders.bottomSheet.cancelSuccess"));
        // Обновляем данные заказов
        queryClient.invalidateQueries({ queryKey: ["data"] });
        if (onRefresh) {
          onRefresh();
        }
        // Обновляем выбранный заказ, убирая оффер из списка
        if (selectedOrder) {
          const updatedOrder = {
            ...selectedOrder,
            driver_offers: selectedOrder.driver_offers?.filter((offer) => offer.id !== userOffer.id) || [],
          };
          setSelectedOrder(updatedOrder);
          selectedOrderRef.current = updatedOrder;
        }
      }
    } catch (err) {
      console.error("Error canceling offer:", err);
      let errorMessage = t("orders.bottomSheet.cancelError");
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = "Нет доступа для отмены этого запроса";
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsCanceling(false);
    }
  };

  // Функция принятия оффера
  const handleAcceptOffer = async (offerId) => {
    if (!offerId) return;

    try {
      const res = await postData(`/driver-offers/${offerId}`, { status: "accepted" });
      
      // Проверяем успешный ответ от бэкенда
      if (res.message === "Offer accepted") {
        toast.success(t("orders.bottomSheet.acceptSuccess"));
        
        // Обновляем данные заказов
        queryClient.invalidateQueries({ queryKey: ["data"] });
        if (onRefresh) {
          onRefresh();
        }
        
        // Обновляем выбранный заказ:
        // 1. Меняем статус принятого оффера на "accepted"
        // 2. Удаляем все остальные pending офферы (они удаляются на бэкенде)
        // 3. Заказ переходит в статус "completed"
        if (selectedOrder) {
          const acceptedOffer = res.offer || selectedOrder.driver_offers?.find((o) => o.id === offerId);
          const updatedDriverOffers = [acceptedOffer].filter(Boolean);
          
          const updatedOrder = {
            ...selectedOrder,
            status: "completed", // Заказ завершен после принятия оффера
            driver_offers: updatedDriverOffers,
          };
          setSelectedOrder(updatedOrder);
          selectedOrderRef.current = updatedOrder;
        }
        
        // Закрываем bottom sheet после принятия
        setTimeout(() => {
          setSelectedOrder(null);
        }, 1500);
      }
    } catch (err) {
      console.error("Error accepting offer:", err);
      let errorMessage = t("orders.bottomSheet.acceptError");
      if (err.response?.status === 403) {
        errorMessage = "Нет доступа для принятия этого оффера";
      } else if (err.response?.status === 422) {
        errorMessage = "Оффер нельзя изменить (статус не pending)";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  // Функция отклонения оффера
  const handleRejectOffer = async (offerId) => {
    if (!offerId) return;

    try {
      const res = await postData(`/driver-offers/${offerId}`, { status: "declined" });
      
      // Проверяем успешный ответ от бэкенда
      if (res.message === "Offer declined") {
        toast.success(t("orders.bottomSheet.rejectSuccess"));
        
        // Обновляем данные заказов
        queryClient.invalidateQueries({ queryKey: ["data"] });
        if (onRefresh) {
          onRefresh();
        }
        
        // Обновляем выбранный заказ, убирая отклоненный оффер из списка
        if (selectedOrder) {
          const updatedOrder = {
            ...selectedOrder,
            driver_offers: selectedOrder.driver_offers?.filter((offer) => offer.id !== offerId) || [],
          };
          setSelectedOrder(updatedOrder);
          selectedOrderRef.current = updatedOrder;
        }
      }
    } catch (err) {
      console.error("Error rejecting offer:", err);
      let errorMessage = t("orders.bottomSheet.rejectError");
      if (err.response?.status === 403) {
        errorMessage = "Нет доступа для отклонения этого оффера";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
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

    // Создаем группу кластеров маркеров (используем простую группу для начала)
    markerClusterGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerClusterGroupRef.current) {
      updateMarkers();
    }
  }, [orders]);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  // Отрисовываем маршрут при открытии заказа
  // Отключено по запросу пользователя
  // useEffect(() => {
  //   if (selectedOrder && mapInstanceRef.current) {
  //     console.log("Drawing route for order:", selectedOrder.id);
  //     // Всегда удаляем предыдущий маршрут перед рисованием нового
  //     // Это гарантирует, что на карте всегда только один маршрут
  //     clearRoute();
  //     
  //     const orderId = selectedOrder.id;
  //     displayRoute(selectedOrder).then(() => {
  //       console.log("Route drawn successfully for order:", orderId);
  //       // Проверяем, что заказ все еще выбран после завершения отрисовки
  //       if (selectedOrderRef.current?.id !== orderId) {
  //         console.log("Order changed during route drawing, clearing route");
  //         // Если заказ изменился во время отрисовки, удаляем маршрут
  //         clearRoute();
  //       }
  //     }).catch((error) => {
  //       console.error("Error displaying route:", error);
  //       clearRoute();
  //     });
  //   } else {
  //     console.log("No selected order or map not ready");
  //   }
  //   // При закрытии bottom sheet (selectedOrder становится null) маршрут остается на карте
  //   // Не удаляем маршрут, чтобы он остался видимым
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedOrder?.id]); // Используем только id, чтобы избежать лишних перерисовок

  // Обновляем выбранный заказ при изменении orders, чтобы синхронизировать данные (например, driver_offers)
  useEffect(() => {
    if (selectedOrder && orders && orders.length > 0) {
      const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
        selectedOrderRef.current = updatedOrder;
      }
    }
  }, [orders]);

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

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
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

  // Функция для получения маршрута
  // Все публичные OSRM серверы блокируются CORS или требуют API ключ
  // Для маршрута по дорогам нужно использовать прокси на бэкенде или API с ключом
  // Пока используем прямую линию
  const getRoute = async (fromLat, fromLng, toLat, toLng) => {
    // Все публичные OSRM серверы недоступны из-за CORS
    // Для получения маршрута по дорогам нужно:
    // 1. Использовать прокси на бэкенде
    // 2. Или использовать API с ключом (Mapbox, Google Maps, Yandex)
    // Пока возвращаем null, чтобы использовать прямую линию
    return null;
  };

  // Функция для очистки маршрута
  const clearRoute = () => {
    if (!mapInstanceRef.current) return;

    // Удаляем Leaflet Routing Machine control
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Удаляем старые маркеры и полилинию (на случай если использовались)
    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (fromMarkerRef.current) {
      mapInstanceRef.current.removeLayer(fromMarkerRef.current);
      fromMarkerRef.current = null;
    }
    if (toMarkerRef.current) {
      mapInstanceRef.current.removeLayer(toMarkerRef.current);
      toMarkerRef.current = null;
    }
    // НЕ сбрасываем currentRouteOrderIdRef здесь, так как он используется для проверки актуальности заказа
    // Он будет обновлен при создании нового маршрута
  };

  // Функция для ожидания загрузки Leaflet Routing Machine
  const waitForRoutingMachine = () => {
    return new Promise((resolve, reject) => {
      console.log("Checking for L.Routing...", { 
        "L.Routing": typeof L.Routing, 
        "window.L": typeof window.L,
        "window.L.Routing": typeof (window.L && window.L.Routing)
      });
      
      if (L.Routing || (window.L && window.L.Routing)) {
        if (window.L && window.L.Routing && !L.Routing) {
          L.Routing = window.L.Routing;
        }
        console.log("L.Routing found immediately");
        resolve(L.Routing);
        return;
      }
      
      // Ждем до 3 секунд
      let attempts = 0;
      const maxAttempts = 30; // 30 попыток по 100ms = 3 секунды
      const checkInterval = setInterval(() => {
        attempts++;
        if (L.Routing || (window.L && window.L.Routing)) {
          if (window.L && window.L.Routing && !L.Routing) {
            L.Routing = window.L.Routing;
          }
          clearInterval(checkInterval);
          console.log("L.Routing found after", attempts, "attempts");
          resolve(L.Routing);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error("L.Routing not found after", maxAttempts, "attempts");
          reject(new Error("Leaflet Routing Machine not loaded after 3 seconds"));
        }
      }, 100);
    });
  };

  // Функция для отображения маршрута на карте
  const displayRoute = async (order) => {
    if (!mapInstanceRef.current) return;

    const orderId = order.id;
    // Сохраняем ID заказа, для которого рисуем маршрут (ДО clearRoute, чтобы не потерять)
    currentRouteOrderIdRef.current = orderId;

    // Удаляем предыдущий маршрут и маркеры
    clearRoute();

    console.log("Display route for order:", order);

    // Получаем координаты
    let fromCoords = null;
    let toCoords = null;

    // Используем координаты напрямую, если они есть
    if (order.from_lat && order.from_lng) {
      fromCoords = [Number(order.from_lat), Number(order.from_lng)];
      console.log("From coords from order:", fromCoords);
    } else if (order.from_address) {
      console.log("Geocoding from address:", order.from_address);
      fromCoords = await geocodeAddress(`${order.from_address}, Узбекистан`);
      console.log("Geocoded from coords:", fromCoords);
    }

    // Проверяем различные варианты названий полей для конечной точки
    const toLat = order.to_lat || order.toLat || order.toLatitude;
    const toLng = order.to_lng || order.toLng || order.toLongitude || order.to_longitude;
    const toAddress = order.to_address || order.toAddress || order.to_city || order.toCity || order.to || "";

    console.log("To point data:", { 
      toLat, 
      toLng, 
      toAddress, 
      orderKeys: Object.keys(order),
      fullOrder: order 
    });

    // Сначала пытаемся использовать координаты напрямую
    if (toLat !== undefined && toLat !== null && toLng !== undefined && toLng !== null) {
      const lat = Number(toLat);
      const lng = Number(toLng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        toCoords = [lat, lng];
        console.log("To coords from order:", toCoords);
      } else {
        console.warn("Invalid to coordinates:", { toLat, toLng, lat, lng });
      }
    }
    
    // Если координаты не получены, пытаемся геокодировать адрес
    if (!toCoords && toAddress) {
      console.log("Geocoding to address:", toAddress);
      toCoords = await geocodeAddress(`${toAddress}, Узбекистан`);
      console.log("Geocoded to coords:", toCoords);
    }
    
    if (!toCoords) {
      console.error("No to coordinates or address found in order:", {
        toLat,
        toLng,
        toAddress,
        order: {
          id: order.id,
          to_lat: order.to_lat,
          to_lng: order.to_lng,
          to_address: order.to_address,
          to_city: order.to_city,
          to: order.to,
        }
      });
      // Показываем предупреждение пользователю
      toast.warning("Не удалось определить конечную точку маршрута");
    }

    if (!fromCoords || !toCoords) {
      console.warn("Could not get coordinates for route", {
        fromCoords,
        toCoords,
        order: {
          from_lat: order.from_lat,
          from_lng: order.from_lng,
          from_address: order.from_address,
          to_lat: order.to_lat,
          to_lng: order.to_lng,
          to_address: order.to_address,
          to_city: order.to_city,
          to: order.to,
        }
      });
      return;
    }

    // Проверяем, что заказ все еще актуален перед созданием маршрута
    // Используем currentRouteOrderIdRef, который был установлен после clearRoute
    // Убираем эту проверку, так как она блокирует создание маршрута
    // if (currentRouteOrderIdRef.current !== orderId) {
    //   console.log("Order changed before creating route, aborting. Current:", currentRouteOrderIdRef.current, "Expected:", orderId);
    //   return;
    // }

    // Рисуем прямую линию между точками
    // Leaflet Routing Machine не загружается, поэтому используем простую полилинию
    console.log("Creating route (straight line):", { fromCoords, toCoords });
    
    // Проверяем, что координаты валидны
    if (!fromCoords || !toCoords || !Array.isArray(fromCoords) || !Array.isArray(toCoords)) {
      console.error("Invalid coordinates:", { fromCoords, toCoords });
      return;
    }
    
    // Проверяем, что координаты - это числа
    if (isNaN(fromCoords[0]) || isNaN(fromCoords[1]) || isNaN(toCoords[0]) || isNaN(toCoords[1])) {
      console.error("Coordinates contain NaN:", { fromCoords, toCoords });
      return;
    }
    
    // Создаем прямую линию между точками
    try {
      console.log("Creating polyline with coordinates:", fromCoords, "to", toCoords);
      
      const routePolyline = L.polyline([fromCoords, toCoords], {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.7,
        smoothFactor: 1,
      });
      
      console.log("Polyline created, adding to map...");
      console.log("Map instance:", mapInstanceRef.current);
      console.log("Polyline object:", routePolyline);
      
      routePolyline.addTo(mapInstanceRef.current);
      routePolylineRef.current = routePolyline;
      
      // Проверяем, что полилиния действительно добавлена
      const isOnMap = mapInstanceRef.current.hasLayer(routePolyline);
      console.log("Polyline added to map:", isOnMap);
      console.log("routePolylineRef.current:", routePolylineRef.current);
      
      // Подстраиваем карту под маршрут
      if (fromCoords && toCoords) {
        const bounds = L.latLngBounds([fromCoords, toCoords]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
        console.log("Map bounds adjusted to:", bounds.toBBoxString());
      }
      
      console.log("Route created successfully");
    } catch (error) {
      console.error("Error creating polyline:", error);
      console.error("Error stack:", error.stack);
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
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = [latitude, longitude];

        // Удаляем старый маркер местоположения
        if (userLocationMarkerRef.current) {
          mapInstanceRef.current.removeLayer(userLocationMarkerRef.current);
        }

        // Создаем иконку для маркера текущего местоположения
        const locationIcon = L.divIcon({
          className: "custom-location-icon",
          html: `
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: #3b82f6;
              border: 3px solid white;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        // Добавляем маркер текущего местоположения
        userLocationMarkerRef.current = L.marker(userLocation, { icon: locationIcon })
          .bindPopup("Ваше местоположение")
          .addTo(mapInstanceRef.current);

        // Перемещаем карту к местоположению пользователя
        mapInstanceRef.current.setView(userLocation, 15, {
          animate: true,
          duration: 0.5,
        });

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

  const updateMarkers = async () => {
    if (!mapInstanceRef.current || !markerClusterGroupRef.current) return;

    // Сохраняем ID последнего выбранного заказа перед обновлением
    const lastSelectedOrderId = selectedOrderRef.current?.id || lastSelectedOrderIdRef.current;
    
    // Сбрасываем выбранный маркер и заказ
    selectedMarkerRef.current = null;
    selectedOrderRef.current = null;
    
    // НЕ удаляем маршрут при обновлении маркеров, если заказ все еще выбран
    // Маршрут должен оставаться на карте
    // clearRoute();
    
    // Очищаем существующие маркеры
    markerClusterGroupRef.current.clearLayers();
    markersRef.current = [];

    if (!orders || orders.length === 0) {
      console.log("OrdersMap: No orders to display");
      return;
    }

    console.log("OrdersMap: Updating markers for", orders.length, "orders:", orders);
    console.log("OrdersMap: Orders by status:", {
      active: orders.filter(o => o.status === "active").length,
      in_progress: orders.filter(o => o.status === "in_progress").length,
      completed: orders.filter(o => o.status === "completed").length,
      other: orders.filter(o => o.status !== "active" && o.status !== "in_progress" && o.status !== "completed").length,
    });

    const bounds = L.latLngBounds([]);

    for (const order of orders) {
      try {
        const fromAddress = order.from_address || order.from_city || order.from || "";
        
        if (!fromAddress) continue;

        // Используем координаты напрямую, если они есть
        let fromCoords = null;
        if (order.from_lat && order.from_lng) {
          fromCoords = [Number(order.from_lat), Number(order.from_lng)];
        } else {
          // Геокодируем адрес
          fromCoords = await geocodeAddress(`${fromAddress}, Узбекистан`);
        }

        if (fromCoords && Array.isArray(fromCoords) && fromCoords.length === 2) {
          const toAddress = order.to_address || order.to_city || order.to || "";
          
          console.log(`OrdersMap: Adding marker for order ${order.id || "unknown"}:`, fromAddress, "→", toAddress, "at", fromCoords);

          // Определяем цвет маркера в зависимости от статуса заказа
          // Синий для active, красный для in_progress
          const markerColor = order.status === "in_progress" ? "#ef4444" : "#3b82f6";
          const selectedMarkerColor = order.status === "in_progress" ? "#dc2626" : "#22c55e";

          // Создаем стандартную иконку маркера - используем divIcon для лучшего контроля
          const defaultIcon = L.divIcon({
            className: "custom-order-marker",
            html: `
              <div style="
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                background-color: ${markerColor};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 100%;
                  height: 100%;
                  transform: rotate(45deg);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "></div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
          });

          // Создаем иконку для выбранного маркера (зеленая для active, темно-красная для in_progress)
          const selectedIcon = L.divIcon({
            className: "custom-order-marker selected",
            html: `
              <div style="
                width: 36px;
                height: 36px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                background-color: ${selectedMarkerColor};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 100%;
                  height: 100%;
                  transform: rotate(45deg);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
          });

          // Создаем маркер БЕЗ popup
          const marker = L.marker(fromCoords, { icon: defaultIcon })
            .addTo(markerClusterGroupRef.current);

          // Сохраняем ссылки на иконки в маркере
          marker._defaultIcon = defaultIcon;
          marker._selectedIcon = selectedIcon;
          marker._orderId = order.id;

          // Добавляем обработчик клика на маркер
          marker.on("click", () => {
            // Если кликнули на уже выбранный маркер - открываем/закрываем bottom sheet
            if (selectedOrderRef.current?.id === order.id) {
              // Переключаем состояние bottom sheet, но маркер остается зеленым
              setSelectedOrder((prev) => {
                if (prev) {
                  // Закрываем bottom sheet и удаляем маршрут
                  clearRoute();
                  return null;
                } else {
                  // Открываем bottom sheet (маршрут отключен)
                  return order;
                }
              });
              return;
            }

            // Возвращаем предыдущий маркер в исходное состояние (синий)
            if (selectedMarkerRef.current && selectedMarkerRef.current !== marker) {
              selectedMarkerRef.current.setIcon(selectedMarkerRef.current._defaultIcon);
              selectedMarkerRef.current.update(); // Принудительно обновляем маркер
            }

            // Удаляем предыдущий маршрут
            clearRoute();

            // Устанавливаем новый выбранный маркер (зеленый)
            marker.setIcon(selectedIcon);
            marker.update(); // Принудительно обновляем маркер
            selectedMarkerRef.current = marker;
            selectedOrderRef.current = order;
            lastSelectedOrderIdRef.current = order.id; // Сохраняем ID последнего выбранного заказа
            setSelectedOrder(order);

            // Маршрут отключен
          });

          markersRef.current.push(marker);
          bounds.extend(fromCoords);
        } else {
          console.warn(`OrdersMap: Could not get coordinates for order ${order.id || "unknown"}:`, fromAddress);
        }
      } catch (error) {
        console.error("Error processing order:", order, error);
      }
    }

    console.log(`OrdersMap: Total markers added: ${markersRef.current.length} out of ${orders.length} orders`);

    // Восстанавливаем зеленый цвет последнего выбранного маркера, если он есть
    if (lastSelectedOrderId && markersRef.current.length > 0) {
      const markerToRestore = markersRef.current.find((m) => m._orderId === lastSelectedOrderId);
      if (markerToRestore) {
        markerToRestore.setIcon(markerToRestore._selectedIcon);
        markerToRestore.update();
        selectedMarkerRef.current = markerToRestore;
        // Находим соответствующий заказ
        const orderToRestore = orders.find((o) => o.id === lastSelectedOrderId);
        if (orderToRestore) {
          selectedOrderRef.current = orderToRestore;
        }
      }
    }

    // Подстраиваем карту под маркеры
    if (markersRef.current.length > 0) {
      try {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
      } catch (error) {
        console.error("Error setting bounds:", error);
      }
    }
  };

  return (
    <div className={`w-full ${mapHeight || "h-[calc(100vh-300px)]"} ${mapHeight ? "" : "min-h-[400px]"} rounded-2xl overflow-hidden border shadow-lg relative`}>
      <div ref={mapRef} className="w-full h-full" />
      {/* Кнопка определения местоположения */}
      <button
        onClick={locateUser}
        disabled={isLocating}
        className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-3 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
        aria-label="Определить моё местоположение"
        title="Определить моё местоположение"
      >
        <Navigation 
          size={20} 
          className={`text-blue-600 ${isLocating ? "animate-spin" : ""}`}
        />
      </button>
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-2xl">
          <div className="text-sm">Загрузка карты...</div>
        </div>
      )}
      
      {/* Bottom Sheet с деталями заказа */}
      {selectedOrder && (
        <OrderBottomSheet
          order={selectedOrder}
          onClose={() => {
            // Закрываем bottom sheet, но маршрут остается на карте
            // Маршрут будет удален только при открытии другого заказа
            setSelectedOrder(null);
          }}
          onSubmit={() => {
            // Открываем диалог отправки оффера
            setOfferDialogOpen(true);
          }}
          onCancel={handleCancelOffer}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onRefresh={onRefresh}
          onEdit={onEditOrder}
          onDelete={onDeleteOrder}
          onComplete={onCompleteOrder}
        />
      )}

      {/* Диалог отправки оффера водителя */}
      {selectedOrder && (
        <DriverOfferDialog
          order={selectedOrder}
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          onSuccess={() => {
            // При успешной отправке оффера обновляем данные
            queryClient.invalidateQueries({ queryKey: ["data"] });
            if (onRefresh) {
              onRefresh();
            }
            setOfferDialogOpen(false);
            // Закрываем bottom sheet после отправки оффера
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

export default OrdersMap;
