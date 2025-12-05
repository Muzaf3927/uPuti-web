import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

function OrdersMap({ orders = [], isLoading, onRefresh, mapHeight, onEditOrder, onDeleteOrder }) {
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
    
    // Очищаем существующие маркеры
    markerClusterGroupRef.current.clearLayers();
    markersRef.current = [];

    if (!orders || orders.length === 0) {
      console.log("OrdersMap: No orders to display");
      return;
    }

    console.log("OrdersMap: Updating markers for", orders.length, "orders:", orders);

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

          // Создаем стандартную иконку маркера (синяя) - используем divIcon для лучшего контроля
          const defaultIcon = L.divIcon({
            className: "custom-order-marker",
            html: `
              <div style="
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                background-color: #3b82f6;
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

          // Создаем зеленую иконку для выбранного маркера
          const selectedIcon = L.divIcon({
            className: "custom-order-marker selected",
            html: `
              <div style="
                width: 36px;
                height: 36px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                background-color: #22c55e;
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
              setSelectedOrder((prev) => (prev ? null : order));
              return;
            }

            // Возвращаем предыдущий маркер в исходное состояние (синий)
            if (selectedMarkerRef.current && selectedMarkerRef.current !== marker) {
              selectedMarkerRef.current.setIcon(selectedMarkerRef.current._defaultIcon);
              selectedMarkerRef.current.update(); // Принудительно обновляем маркер
            }

            // Устанавливаем новый выбранный маркер (зеленый)
            marker.setIcon(selectedIcon);
            marker.update(); // Принудительно обновляем маркер
            selectedMarkerRef.current = marker;
            selectedOrderRef.current = order;
            lastSelectedOrderIdRef.current = order.id; // Сохраняем ID последнего выбранного заказа
            setSelectedOrder(order);
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
            // Закрываем bottom sheet, но маркер остается зеленым
            // Маркер будет сброшен только при выборе другого маркера
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
