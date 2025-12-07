import React, { useEffect, useState, useMemo } from "react";

// components
import OrdersMap from "@/components/OrdersMap";
import RouteSelectorMap from "@/components/RouteSelectorMap";
import CompletedOrderBottomSheet from "@/components/CompletedOrderBottomSheet";
import DriverOfferBottomSheet from "@/components/DriverOfferBottomSheet";

// icons
import { Search, Loader2, X, Phone, AlertTriangle } from "lucide-react";

// router
import { useLocation } from "react-router-dom";

// shad cn
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TimePicker from "@/components/ui/time-picker";

import { useGetData, usePostData, postData, deleteData } from "@/api/api";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useI18n } from "@/app/i18n.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSmartRefresh } from "@/hooks/useSmartRefresh.jsx";
import EmptyState from "@/components/EmptyState.jsx";
import { useActiveTab } from "@/layout/MainLayout";
import { Plus } from "lucide-react";

// Компонент для элемента истории оффера водителя
function HistoryOfferItem({ offer, onSelect, t }) {
  const request = offer.passengerRequest || offer.passenger_request || {};
  const passengerUserId = request.user_id;
  
  // Получаем данные пассажира по user_id
  const { data: passengerData } = useGetData(
    passengerUserId ? `/users/${passengerUserId}` : null
  );
  
  // Используем данные из API или из offer (если они там есть)
  const passenger = passengerData || offer.passenger || {};
  
  const fromAddress = request.from_address || request.from || "";
  const toAddress = request.to_address || request.to || "";
  const time = request.time ? (request.time.includes(":") ? request.time.substring(0, 5) : request.time) : "";
  const orderStatus = request.status || "";
  const offerStatus = offer.status || "";
  
  // Форматируем телефон пассажира
  const passengerPhone = passenger.phone 
    ? (String(passenger.phone).startsWith("+") 
        ? String(passenger.phone) 
        : String(passenger.phone).startsWith("998") 
          ? `+${String(passenger.phone)}` 
          : `+998${String(passenger.phone)}`)
    : null;
  
  // Определяем статус для отображения
  let statusText = "";
  let statusClass = "";
  
  // Сначала проверяем статус заказа
  if (orderStatus === "completed") {
    statusText = t("orders.history.completed");
    statusClass = "bg-red-100 text-red-800 border-red-200";
  } else if (orderStatus === "in_progress") {
    statusText = "В процессе";
    statusClass = "bg-green-100 text-green-800 border-green-200";
  } else if (offerStatus === "declined") {
    statusText = t("orders.history.cancelled");
    statusClass = "bg-red-100 text-red-800 border-red-200";
  } else if (offerStatus === "accepted") {
    statusText = "Принят";
    statusClass = "bg-blue-100 text-blue-800 border-blue-200";
  }
  
  const handleCall = (e) => {
    e.stopPropagation(); // Предотвращаем открытие bottom sheet при клике на кнопку
    if (passengerPhone) {
      window.open(`tel:${passengerPhone}`, '_self');
    }
  };
  
  return (
    <div
      onClick={() => onSelect(offer)}
      className="border rounded-xl p-2.5 sm:p-3 bg-card/90 backdrop-blur-sm shadow-sm ring-1 ring-blue-200/60 cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(79,70,229,0.06))" }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-primary font-medium text-xs sm:text-sm min-w-0 flex-1">
          <span className="truncate">{fromAddress}</span>
          <span className="text-primary">→</span>
          <span className="truncate">{toAddress}</span>
        </div>
        {statusText && (
          <span className={`text-[10px] sm:text-xs py-0.5 px-2 rounded-full whitespace-nowrap border ${statusClass}`}>
            {statusText}
          </span>
        )}
      </div>
      
      {/* Информация о пассажире */}
      {passenger.name && (
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs text-gray-700">
              <span className="font-medium">{t("orders.popup.passenger")}:</span>{" "}
              <span className="text-gray-900">{passenger.name}</span>
            </div>
          </div>
          {passengerPhone && (
            <Button
              type="button"
              onClick={handleCall}
              className="h-7 px-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-1 text-xs flex-shrink-0"
            >
              <Phone size={12} />
              {t("orders.history.callPassenger")}
            </Button>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
        <span>{request.date}</span>
        {time && (
          <>
            <span>•</span>
            <span>{time}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Orders() {
  const { t } = useI18n();
  const { keyboardInset } = useKeyboardInsets();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeTab: activeRoleTab } = useActiveTab();
  const [dialog, setDialog] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 - карта, 2 - форма
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [selectedHistoryOffer, setSelectedHistoryOffer] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null); // Заказ для редактирования
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  // Используем один объект состояния для всех значений маршрута
  const [routeData, setRouteData] = useState({
    from: "",
    to: "",
    fromCoords: null, // { lat, lng }
    toCoords: null, // { lat, lng }
  });
  
  // Для обратной совместимости
  const selectedFrom = routeData.from;
  const selectedTo = routeData.to;
  const fromCoords = routeData.fromCoords;
  const toCoords = routeData.toCoords;
  const [searchFilters, setSearchFilters] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    from_lat: null,
    from_lng: null,
    to_lat: null,
    to_lng: null,
  });

  const [activeFilters, setActiveFilters] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    from_lat: null,
    from_lng: null,
    to_lat: null,
    to_lng: null,
  });

  // Формируем URL для поиска заказов
  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    
    if (activeFilters.from_lat && activeFilters.from_lng) {
      params.append('from_lat', activeFilters.from_lat);
      params.append('from_lng', activeFilters.from_lng);
    } else if (activeFilters.from) {
      params.append('from_address', activeFilters.from);
    }
    
    if (activeFilters.to_lat && activeFilters.to_lng) {
      params.append('to_lat', activeFilters.to_lat);
      params.append('to_lng', activeFilters.to_lng);
    } else if (activeFilters.to) {
      params.append('to_address', activeFilters.to);
    }
    
    if (activeFilters.date) {
      params.append('date', activeFilters.date);
    }
    
    if (activeFilters.time) {
      params.append('time', activeFilters.time);
    }
    
    const queryString = params.toString();
    return queryString ? `/passenger-requests/search?${queryString}` : `/passenger-requests`;
  };

  const allOrdersUrl = buildSearchUrl();
  const { data, isLoading, error, refetch } = useGetData(allOrdersUrl);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveFilters({ ...searchFilters });
    setSearchDialog(false);
  };

  const handleClearSearch = () => {
    setActiveFilters({ from: "", to: "", date: "", time: "", from_lat: null, from_lng: null, to_lat: null, to_lng: null });
    setSearchFilters({ from: "", to: "", date: "", time: "", from_lat: null, from_lng: null, to_lat: null, to_lng: null });
  };

  const {
    data: myOrders,
    isLoading: myOrdersLoading,
    error: myOrdersError,
    refetch: myOrdersRefetch,
  } = useGetData(`/passenger-requests/my`);

  // Получаем офферы водителя для истории в разделе "Все заказы"
  const {
    data: driverOffersData,
    isLoading: driverOffersLoading,
    error: driverOffersError,
    refetch: driverOffersRefetch,
  } = useGetData(`/driver-offers/my`);

  // Умное автоматическое обновление
  const { forceRefresh, resetActivityFlags } = useSmartRefresh(
    () => {
      Promise.allSettled([refetch(), myOrdersRefetch()]);
    },
    5000,
    [refetch, myOrdersRefetch]
  );

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    if (location.pathname === "/orders") {
      refetch();
      myOrdersRefetch();
    }
  }, [location.pathname, refetch, myOrdersRefetch]);

  const myOrdersList = (myOrders && myOrders.data) || [];

  const orderPostMutation = usePostData("/passenger-requests");

  // Получаем все заказы (Laravel пагинация возвращает data.data)
  // Бэкенд уже возвращает только активные заказы для /passenger-requests
  const allOrdersFromBackend = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.passenger_requests)
    ? data.passenger_requests
    : [];

  // Бэкенд уже фильтрует по статусу active, но на всякий случай фильтруем еще раз
  const filteredOrders = allOrdersFromBackend.filter((order) => order.status === "active" || !order.status);

  const hasActiveSearch = Boolean(activeFilters.from || activeFilters.to || activeFilters.date || activeFilters.time || activeFilters.from_lat || activeFilters.to_lat);
  const showSearchEmptyState = hasActiveSearch && !isLoading && filteredOrders.length === 0;

  // Определяем, какие заказы показывать в зависимости от роли
  // На карте для пассажиров показываем активные (active) и в процессе (in_progress) заказы
  const activeMyOrders = myOrdersList.filter((item) => item.status === "active" || item.status === "in_progress");
  const showPassengerContent = activeRoleTab === "passenger";
  const showDriverContent = activeRoleTab === "driver";
  
  // Для пассажира показываем только мои заказы (active и in_progress), для водителя - все заказы
  const ordersToDisplay = showPassengerContent ? activeMyOrders : filteredOrders;
  const isLoadingOrders = showPassengerContent ? myOrdersLoading : isLoading;

  // Логирование для отладки
  useEffect(() => {
    if (data) {
      console.log("=== ALL ORDERS DEBUG ===");
      console.log("Raw data from backend:", data);
      console.log("All orders array:", allOrdersFromBackend);
      console.log("Filtered active orders:", filteredOrders);
    }
  }, [data]);

  // Логирование для отладки моих заказов
  useEffect(() => {
    if (myOrders) {
      console.log("=== MY ORDERS DEBUG ===");
      console.log("Raw myOrders data:", myOrders);
      console.log("My orders list:", myOrdersList);
      console.log("Active my orders (active + in_progress):", activeMyOrders);
      console.log("Orders with in_progress status:", myOrdersList.filter((item) => item.status === "in_progress"));
    }
  }, [myOrders, myOrdersList, activeMyOrders]);
  
  useEffect(() => {
    console.log("=== ORDERS TO DISPLAY ===");
    console.log("Orders to display on map:", ordersToDisplay);
    console.log("Count:", ordersToDisplay?.length || 0);
  }, [ordersToDisplay]);

  // История - заказы со статусом completed (только для пассажира)
  const historyOrders = showPassengerContent
    ? myOrdersList.filter((item) => item.status === "completed")
    : [];

  // Получаем офферы водителя для истории
  const driverOffersList = Array.isArray(driverOffersData?.data)
    ? driverOffersData.data
    : Array.isArray(driverOffersData)
    ? driverOffersData
    : [];

  // Фильтруем офферы: показываем только accepted и declined (не pending) - только для водителя
  const historyDriverOffers = showDriverContent
    ? driverOffersList.filter((offer) => offer.status === "accepted" || offer.status === "declined")
    : [];
  
  // Логирование для отладки истории
  useEffect(() => {
    if (showPassengerContent) {
      console.log("=== MY ORDERS DEBUG ===");
      console.log("Raw myOrders data:", myOrders);
      console.log("My orders list:", myOrdersList);
      console.log("Active my orders (for map):", activeMyOrders);
      console.log("History orders (completed/cancelled):", historyOrders);
    }
  }, [showPassengerContent]);

  // Функция валидации формы
  const validateForm = (formData) => {
    const errors = {};
    
    if (!selectedFrom?.trim()) {
      errors.from = t("orders.form.validation.fromRequired");
    }
    if (!selectedTo?.trim()) {
      errors.to = t("orders.form.validation.toRequired");
    }
    if (!formData.get("date")?.trim()) {
      errors.date = t("orders.form.validation.dateRequired");
    }
    if (!selectedTime?.trim()) {
      errors.time = t("orders.form.validation.timeRequired");
    }
    if (!formData.get("seats")?.trim()) {
      errors.seats = t("orders.form.validation.seatsRequired");
    }
    
    // Проверка даты и времени
    const selectedDate = formData.get("date");
    const selectedTimeValue = selectedTime;
    
    if (selectedDate && selectedTimeValue) {
      const now = new Date();
      const selectedDateTime = new Date(`${selectedDate}T${selectedTimeValue}:00`);
      
      if (selectedDateTime <= now) {
        errors.dateTime = t("orders.form.validation.futureDateTime");
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const formData = new FormData(e.target);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("orders.form.validationError"));
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const date = formData.get("date");
    const time = selectedTime;
    const seats = formData.get("seats");
    const comment = formData.get("note") || "";
    const amount = formData.get("amount") || null;

    // Проверяем, что выбраны координаты
    if (!fromCoords || !toCoords) {
      toast.error(t("orders.form.validation.selectRouteOnMap"));
      setIsSubmitting(false);
      return;
    }

    // Нормализуем координаты (могут быть массивом [lat, lng] или объектом {lat, lng})
    const fromLat = Array.isArray(fromCoords) ? fromCoords[0] : fromCoords?.lat;
    const fromLng = Array.isArray(fromCoords) ? fromCoords[1] : fromCoords?.lng;
    const toLat = Array.isArray(toCoords) ? toCoords[0] : toCoords?.lat;
    const toLng = Array.isArray(toCoords) ? toCoords[1] : toCoords?.lng;

    // Обязательно получаем адреса по координатам через геокодирование перед отправкой
    let fromAddressFinal = "";
    let toAddressFinal = "";

    // Проверяем, что selectedFrom и selectedTo не являются координатами
    const isCoordinatesString = (str) => {
      if (!str || typeof str !== 'string') return false;
      const trimmed = str.trim();
      // Проверяем формат координат: две числа через запятую (с пробелом или без)
      const coordsRegex = /^\s*\d+\.\d+\s*,\s*\d+\.\d+\s*$/;
      return coordsRegex.test(trimmed);
    };
    const fromIsCoordinates = selectedFrom && isCoordinatesString(selectedFrom);
    const toIsCoordinates = selectedTo && isCoordinatesString(selectedTo);

    // Функция обратного геокодирования через Nominatim (OpenStreetMap)
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

    try {
      if (fromLat && fromLng) {
        console.log("Geocoding FROM coordinates:", [fromLat, fromLng]);
        const address = await reverseGeocode(fromLat, fromLng);
        if (address && !isCoordinatesString(address)) {
          fromAddressFinal = address;
          console.log("Geocoded FROM address:", fromAddressFinal);
        }
      }

      if (toLat && toLng) {
        console.log("Geocoding TO coordinates:", [toLat, toLng]);
        const address = await reverseGeocode(toLat, toLng);
        if (address && !isCoordinatesString(address)) {
          toAddressFinal = address;
          console.log("Geocoded TO address:", toAddressFinal);
        }
      }
    } catch (geocodeError) {
      console.error("Geocoding error before submit:", geocodeError);
      toast.error("Ошибка при определении адреса. Попробуйте еще раз.");
      setIsSubmitting(false);
      return;
    }

    // Проверяем, что полученные адреса не являются координатами (используем ту же функцию)
    if (fromAddressFinal && isCoordinatesString(fromAddressFinal)) {
      console.warn("FROM address is coordinates, clearing it:", fromAddressFinal);
      fromAddressFinal = "";
    }
    if (toAddressFinal && isCoordinatesString(toAddressFinal)) {
      console.warn("TO address is coordinates, clearing it:", toAddressFinal);
      toAddressFinal = "";
    }

    // Если геокодирование не дало результатов, используем сохраненные адреса (если они не координаты)
    if (!fromAddressFinal && selectedFrom && !fromIsCoordinates && !isCoordinatesString(selectedFrom)) {
      fromAddressFinal = selectedFrom;
      console.log("Using saved FROM address:", fromAddressFinal);
    }
    if (!toAddressFinal && selectedTo && !toIsCoordinates && !isCoordinatesString(selectedTo)) {
      toAddressFinal = selectedTo;
      console.log("Using saved TO address:", toAddressFinal);
    }

    // Если адреса все еще пустые или являются координатами, показываем ошибку
    if (!fromAddressFinal || !toAddressFinal || isCoordinatesString(fromAddressFinal) || isCoordinatesString(toAddressFinal)) {
      toast.error("Не удалось определить адреса. Попробуйте выбрать точки на карте еще раз.");
      setIsSubmitting(false);
      return;
    }

    // Преобразуем координаты в числа и формируем данные для отправки
    const resultData = {
      from_lat: Number(fromLat),
      from_lng: Number(fromLng),
      from_address: fromAddressFinal,
      to_lat: Number(toLat),
      to_lng: Number(toLng),
      to_address: toAddressFinal,
      date,
      time,
      seats: parseInt(seats, 10),
      comment,
      ...(amount && { amount: parseInt(amount, 10) }),
    };

    console.log("Sending order data to backend:", resultData);

    try {
      const res = await orderPostMutation.mutateAsync(resultData);
      if (res.message === "Passenger request created!" || res.passenger_request) {
        toast.success(t("orders.form.successMessage"));
        setDialog(false);
        setCurrentStep(1);
        setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
        setFormErrors({});
        setSelectedTime("12:00");
        resetActivityFlags();
        forceRefresh();
      }
    } catch (err) {
      console.error(err);
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error(t("orders.form.errorMessage"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик редактирования заказа
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    // Предзаполняем форму данными заказа
    setRouteData({
      from: order.from_address || order.from || "",
      to: order.to_address || order.to || "",
      fromCoords: order.from_lat && order.from_lng ? { lat: order.from_lat, lng: order.from_lng } : null,
      toCoords: order.to_lat && order.to_lng ? { lat: order.to_lat, lng: order.to_lng } : null,
    });
    setSelectedTime(order.time ? (order.time.includes(":") ? order.time.substring(0, 5) : order.time) : "12:00");
    setAmountInput(order.amount ? String(order.amount) : "");
    setCurrentStep(1); // Открываем карту сначала (шаг 1)
    setDialog(true);
  };

  // Обработчик удаления заказа
  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  // Подтверждение удаления
  const confirmDeleteOrder = async () => {
    if (!orderToDelete?.id) return;

    try {
      const res = await deleteData(`/passenger-requests/${orderToDelete.id}`);
      if (res.message === "Passenger request deleted!" || res) {
        toast.success(t("orders.myOrderActions.deleteSuccess") || "Заказ удален");
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
        queryClient.invalidateQueries({ queryKey: ["data"] });
        refetch();
        myOrdersRefetch();
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      let errorMessage = t("orders.myOrderActions.deleteError") || "Ошибка при удалении заказа";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = "Нет доступа для удаления этого заказа";
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  // Обработчик завершения заказа
  const handleCompleteOrder = async (order) => {
    if (!order?.id) return;

    try {
      const res = await postData(`/passenger-requests/${order.id}`, { status: "completed" });
      if (res.message === "Passenger request updated!" || res) {
        toast.success(t("orders.myOrderActions.completeSuccess"));
        queryClient.invalidateQueries({ queryKey: ["data"] });
        refetch();
        myOrdersRefetch();
      }
    } catch (err) {
      console.error("Error completing order:", err);
      let errorMessage = t("orders.myOrderActions.completeError");
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = "Нет доступа для завершения этого заказа";
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  // Обработчик обновления заказа (при отправке формы редактирования)
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !editingOrder?.id) return;
    
    const formData = new FormData(e.target);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("orders.form.validationError"));
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const date = formData.get("date");
    const time = selectedTime;
    const seats = formData.get("seats");
    const comment = formData.get("note") || "";
    const amount = formData.get("amount") || null;

    // Используем существующие координаты или новые, если были выбраны
    const fromLat = routeData.fromCoords?.lat || editingOrder.from_lat;
    const fromLng = routeData.fromCoords?.lng || editingOrder.from_lng;
    const toLat = routeData.toCoords?.lat || editingOrder.to_lat;
    const toLng = routeData.toCoords?.lng || editingOrder.to_lng;

    // Получаем адреса
    let fromAddressFinal = routeData.from || editingOrder.from_address || "";
    let toAddressFinal = routeData.to || editingOrder.to_address || "";

    // Если координаты были изменены, делаем геокодирование
    if (routeData.fromCoords || routeData.toCoords) {
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

      if (fromLat && fromLng) {
        const address = await reverseGeocode(fromLat, fromLng);
        if (address) fromAddressFinal = address;
      }

      if (toLat && toLng) {
        const address = await reverseGeocode(toLat, toLng);
        if (address) toAddressFinal = address;
      }
    }

    // Формируем данные для отправки - все поля nullable на бэкенде
    const resultData = {
      // Координаты и адреса (fromLat, fromLng и т.д. уже содержат либо новые, либо существующие значения)
      ...(fromLat && { from_lat: Number(fromLat) }),
      ...(fromLng && { from_lng: Number(fromLng) }),
      ...(fromAddressFinal && { from_address: fromAddressFinal }),
      ...(toLat && { to_lat: Number(toLat) }),
      ...(toLng && { to_lng: Number(toLng) }),
      ...(toAddressFinal && { to_address: toAddressFinal }),
      // Остальные поля из формы
      ...(date && { date }),
      ...(time && { time }),
      ...(seats && { seats: parseInt(seats, 10) }),
      ...(comment !== undefined && comment !== "" && { comment }),
      ...(amount && { amount: parseInt(amount, 10) }),
    };

    try {
      const res = await postData(`/passenger-requests/${editingOrder.id}`, resultData);
      if (res.message === "Passenger request updated!" || res.passenger_request) {
        toast.success(t("orders.myOrderActions.updateSuccess") || "Заказ обновлен");
        setDialog(false);
        setEditingOrder(null);
        setCurrentStep(1);
        setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
        setFormErrors({});
        setSelectedTime("12:00");
        queryClient.invalidateQueries({ queryKey: ["data"] });
        refetch();
        myOrdersRefetch();
      }
    } catch (err) {
      console.error(err);
      
      if (err.response?.status === 403) {
        toast.error("Нет доступа для обновления этого заказа");
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error(t("orders.myOrderActions.updateError") || "Ошибка при обновлении заказа");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Кнопка создания заказа для пассажира */}
      {showPassengerContent && (
        <div className="px-4 mb-3">
          <Dialog 
            className="w-full" 
            open={dialog} 
            onOpenChange={(open) => {
              setDialog(open);
              if (!open) {
                // Сброс при закрытии
                setCurrentStep(1);
                setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
                setFormErrors({});
                setSelectedTime("12:00");
                setEditingOrder(null);
                setAmountInput("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-9 text-sm font-medium hover:brightness-110 transition-all"
              >
                <Plus size={18} />
                {t("orders.create")}
              </Button>
            </DialogTrigger>
              <DialogContent
                className="w-full h-[calc(100svh-2rem)] max-h-[calc(100svh-2rem)] sm:w-[95vw] sm:max-w-[760px] sm:max-h-[calc(100svh-2rem)] p-0 sm:p-3 sm:rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm overflow-hidden flex flex-col"
                style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
                preventOutsideClose
                showCloseButton={false}
                autoFocusScroll
              >
            <DialogHeader className="relative flex-shrink-0 px-3 sm:px-4 pt-2 sm:pt-3 pb-1">
              <DialogTitle className="text-center text-primary font-bold pr-8 text-xs sm:text-base">
                {editingOrder 
                  ? (currentStep === 1 ? t("orders.form.step1Title") : t("orders.myOrderActions.edit"))
                  : (currentStep === 1 ? t("orders.form.step1Title") : t("orders.form.step2Title"))
                }
              </DialogTitle>
              <DialogDescription className="sr-only">{editingOrder ? "Edit order dialog" : "Create order dialog"}</DialogDescription>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 sm:top-3 sm:right-4 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-accent/50 rounded-full"
                  onClick={() => {
                    setCurrentStep(1);
                    setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
                    setFormErrors({});
                  }}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>
            
            {currentStep === 1 ? (
              // Шаг 1: Выбор маршрута на карте
              <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0 overflow-hidden px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <RouteSelectorMap
                    isOpen={dialog && currentStep === 1}
                    onRouteSelect={(route) => {
                      console.log("onRouteSelect received:", route);
                      console.log("Current routeData BEFORE:", routeData);
                      
                      // Атомарно обновляем все состояние - сохраняем существующие значения
                      setRouteData(prev => {
                        const updated = { ...prev };
                        
                        if (route.from !== undefined) {
                          updated.from = route.from;
                          console.log("Updating from:", route.from);
                        }
                        
                        if (route.to !== undefined) {
                          updated.to = route.to;
                          console.log("Updating to:", route.to);
                        }
                        
                        if (route.fromCoords !== undefined) {
                          updated.fromCoords = route.fromCoords 
                            ? { lat: route.fromCoords[0], lng: route.fromCoords[1] }
                            : null;
                          console.log("Updating fromCoords:", updated.fromCoords);
                        }
                        
                        if (route.toCoords !== undefined) {
                          updated.toCoords = route.toCoords 
                            ? { lat: route.toCoords[0], lng: route.toCoords[1] }
                            : null;
                          console.log("Updating toCoords:", updated.toCoords);
                        }
                        
                        console.log("Updated routeData:", updated);
                        return updated;
                      });
                    }}
                    fromCity={selectedFrom}
                    toCity={selectedTo}
                    setFromCity={(value) => setRouteData(prev => ({ ...prev, from: value }))}
                    setToCity={(value) => setRouteData(prev => ({ ...prev, to: value }))}
                    initialFromCoords={editingOrder && routeData.fromCoords ? routeData.fromCoords : null}
                    initialToCoords={editingOrder && routeData.toCoords ? routeData.toCoords : null}
                  />
                </div>
                <div className="flex gap-2 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-1 flex-shrink-0">
                  <DialogClose asChild>
                    <Button type="button" className="rounded-2xl w-1/2 h-9 text-xs sm:text-sm">{t("orders.form.cancel")}</Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedFrom && selectedTo && fromCoords && toCoords) {
                        setCurrentStep(2);
                      } else {
                        toast.error(t("orders.form.validation.selectRouteOnMap"));
                      }
                    }}
                    disabled={!selectedFrom || !selectedTo || !fromCoords || !toCoords}
                    className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {t("orders.form.next")}
                  </Button>
                </div>
              </div>
            ) : (
              // Шаг 2: Форма с данными
              <form onSubmit={editingOrder ? handleUpdateOrder : handleSubmit} className="flex flex-col gap-2 sm:gap-3 px-3 sm:px-4 pb-2 sm:pb-3">
                <input type="hidden" name="from" value={selectedFrom} />
                <input type="hidden" name="to" value={selectedTo} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                     onTouchMove={(e) => e.stopPropagation()}
                >
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date" className="text-xs sm:text-sm">{t("orders.form.date")} *</Label>
                      <Input 
                        type="date" 
                        id="date" 
                        name="date" 
                        defaultValue={editingOrder?.date || ""}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className={`${formErrors.date || formErrors.dateTime ? "border-red-500" : ""} bg-white h-8 sm:h-9 text-sm w-full min-w-0`}
                      />
                      {formErrors.date && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.date}</span>}
                      {formErrors.dateTime && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.dateTime}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="time" className="text-xs sm:text-sm">{t("orders.form.time")} *</Label>
                      <TimePicker
                        id="time"
                        value={selectedTime}
                        onChange={setSelectedTime}
                        size="sm"
                        dropdownMaxHeight={112}
                        className={`w-full h-8 sm:h-9 ${formErrors.time || formErrors.dateTime ? "border-red-500" : ""} bg-white`}
                      />
                      {formErrors.time && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.time}</span>}
                      {formErrors.dateTime && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.dateTime}</span>}
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="amount" className="text-xs sm:text-sm">{t("orders.form.amount")}</Label>
                    <Input 
                      type="number" 
                      id="amount" 
                      name="amount" 
                      defaultValue={editingOrder?.amount || ""}
                      min="0"
                      placeholder={t("orders.form.amountPlaceholder")} 
                      className="bg-white h-8 sm:h-9"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="seats" className="text-xs sm:text-sm">{t("orders.form.seats")} *</Label>
                    <Input 
                      type="number" 
                      id="seats" 
                      name="seats" 
                      defaultValue={editingOrder?.seats || "1"}
                      min="1"
                      placeholder={t("orders.form.seatsPlaceholder")} 
                      required
                      className={`${formErrors.seats ? "border-red-500" : ""} bg-white h-8 sm:h-9`}
                    />
                    {formErrors.seats && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.seats}</span>}
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="note" className="text-xs sm:text-sm">{t("orders.form.note")}</Label>
                    <Input type="text" id="note" name="note" defaultValue={editingOrder?.comment || ""} placeholder={t("orders.commentPlaceholder")} className="bg-white h-8 sm:h-9" />
                  </div>
                </div>
                <div className="flex gap-2 mt-1 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-1 flex-shrink-0" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                  <Button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-2xl w-1/2 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {t("orders.form.back")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={14} />
                        {t("orders.form.submitting")}
                      </span>
                    ) : (
                      t("orders.form.submit")
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      )}
      
      {/* Кнопка поиска заказа для водителя */}
      {showDriverContent && (
        <div className="px-4 mb-3">
          <Dialog
            className="w-full"
            open={searchDialog}
            onOpenChange={setSearchDialog}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-9 text-sm font-medium hover:brightness-110 transition-all"
              >
                <Search size={18} />
                {t("orders.search")}
              </Button>
            </DialogTrigger>
          <DialogContent 
            className="overflow-hidden rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-none"
            style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
            autoFocusScroll
            showCloseButton={false}
          >
            <DialogHeader className="relative">
              <DialogTitle className="text-center text-primary font-bold pr-8">
                {t("orders.search")}
              </DialogTitle>
              <DialogDescription className="sr-only">Search order dialog</DialogDescription>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="grid w-full items-center gap-3 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain pr-1 max-h-[45svh]">
                <Label htmlFor="from">{t("orders.searchForm.from")}</Label>
                <Input
                  type="text"
                  id="from"
                  name="from"
                  value={searchFilters.from}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, from: e.target.value }))}
                  placeholder={t("orders.searchForm.fromPlaceholder")}
                  className="bg-white"
                />
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="to">{t("orders.searchForm.to")}</Label>
                  <Input
                    type="text"
                    id="to"
                    name="to"
                    value={searchFilters.to}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, to: e.target.value }))}
                    placeholder={t("orders.searchForm.toPlaceholder")}
                    className="bg-white"
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="search-date">{t("orders.searchForm.date")}</Label>
                  <Input
                    type="date"
                    id="search-date"
                    name="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder={t("orders.searchForm.datePlaceholder")}
                    className="bg-white h-9 w-full min-w-0"
                  />
                </div>
              </div>
              <div className="w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 flex gap-2 mt-2 py-1" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                <DialogClose className="w-1/2" asChild>
                  <Button className="rounded-2xl h-9 text-xs sm:text-sm">
                    {t("orders.searchForm.cancel")}
                  </Button>
                </DialogClose>
                <Button className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm" type="submit">
                  {t("orders.searchForm.search")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      )}
      
      <Card className="px-0 rounded-3xl shadow-lg border">
        <CardContent className="px-0 rounded-3xl bg-card/90 backdrop-blur-sm">
          {activeFilters.from && (
            <div className="px-4 mb-2">
              <div className="flex items-center justify-between bg-accent rounded-lg p-2">
                <div className="text-sm text-accent-foreground">
                  <span className="font-medium">Поиск:</span> {activeFilters.from} → {activeFilters.to}
                  {activeFilters.date && ` • ${activeFilters.date}`}
                </div>
                <Button
                  onClick={handleClearSearch}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                >
                  {t("orders.searchForm.clear")}
                </Button>
              </div>
            </div>
          )}
          
          {/* Карта - для пассажира показываем мои заказы, для водителя - все заказы */}
          <div className="px-4 mb-4">
            <OrdersMap 
              orders={ordersToDisplay} 
              isLoading={isLoadingOrders} 
              mapHeight="h-[50vh]"
              showRoute={showPassengerContent}
              onRefresh={() => {
                refetch();
                if (showPassengerContent) {
                  myOrdersRefetch();
                }
                if (showDriverContent) {
                  driverOffersRefetch();
                }
              }}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onCompleteOrder={handleCompleteOrder}
            />
          </div>
          
          {/* История заказов - только для пассажира */}
          {showPassengerContent && (
            <div className="px-4 pb-4">
              <h3 className="text-sm sm:text-base font-bold text-primary mb-3">{t("orders.history.title")}</h3>
              {historyOrders.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">{t("orders.history.empty")}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {historyOrders.map((order) => {
                    const time = order.time ? (order.time.includes(":") ? order.time.substring(0, 5) : order.time) : "";
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedHistoryOrder(order)}
                        className="border rounded-xl p-2.5 sm:p-3 bg-card/90 backdrop-blur-sm shadow-sm ring-1 ring-blue-200/60 cursor-pointer hover:shadow-md transition-shadow"
                        style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(79,70,229,0.06))" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-primary font-medium text-xs sm:text-sm min-w-0 flex-1">
                            <span className="truncate">{order.from_address || order.from}</span>
                            <span className="text-primary">→</span>
                            <span className="truncate">{order.to_address || order.to}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600 mt-1">
                          <span>{order.date}</span>
                          {time && (
                            <>
                              <span>•</span>
                              <span>{time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* История офферов водителя - только для водителя */}
          {showDriverContent && (
            <div className="px-4 pb-4">
              <h3 className="text-sm sm:text-base font-bold text-primary mb-3">{t("orders.history.title")}</h3>
              {driverOffersLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">{t("orders.loading")}</div>
              ) : historyDriverOffers.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">{t("orders.history.empty")}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {historyDriverOffers.map((offer) => (
                    <HistoryOfferItem
                      key={offer.id}
                      offer={offer}
                      onSelect={setSelectedHistoryOffer}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Sheet для завершенных заказов из истории */}
      {selectedHistoryOrder && (
        <CompletedOrderBottomSheet
          order={selectedHistoryOrder}
          onClose={() => setSelectedHistoryOrder(null)}
        />
      )}

      {/* Bottom Sheet для офферов водителя из истории */}
      {selectedHistoryOffer && (
        <DriverOfferBottomSheet
          offer={selectedHistoryOffer}
          onClose={() => setSelectedHistoryOffer(null)}
        />
      )}

      {/* Диалог подтверждения удаления заказа */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t("orders.myOrderActions.confirmDelete")}
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              {t("orders.myOrderActions.confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 rounded-2xl"
            >
              {t("orders.form.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteOrder}
              className="flex-1 rounded-2xl"
            >
              {t("orders.myOrderActions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Orders;
