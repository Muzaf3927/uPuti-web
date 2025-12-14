import React, { useEffect, useState, useMemo, useRef } from "react";

// components
import OrdersMap from "@/components/OrdersMap";
import RouteSelectorMap from "@/components/RouteSelectorMap";

// icons
import { Loader2, X, Phone, AlertTriangle, MapPin, Route, Plus, Minus } from "lucide-react";

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
import DatePicker from "@/components/ui/date-picker";

// API /passenger-requests удален - импорты больше не нужны
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useI18n } from "@/app/i18n.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState.jsx";
import { useActiveTab } from "@/layout/MainLayout";
import { usePostData, useGetData } from "@/api/api";

function Orders({ showCreateOrder = true }) {
  const { t } = useI18n();
  const { keyboardInset } = useKeyboardInsets();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeTab: activeRoleTab } = useActiveTab();
  const [dialog, setDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 - карта, 2 - форма
  const [editingOrder, setEditingOrder] = useState(null); // Заказ для редактирования
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false); // Модальное окно для деталей заказа
  
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedDate, setSelectedDate] = useState(() => {
    // По умолчанию сегодняшняя дата
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [passengerCount, setPassengerCount] = useState(1); // По умолчанию 1 пассажир
  const [comment, setComment] = useState(""); // Комментарий до 30 символов
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
  
  // Ref для поля "куда" для автоматического перехода фокуса
  const toInputRef = useRef(null);
  
  // Для обратной совместимости
  const selectedFrom = routeData.from;
  const selectedTo = routeData.to;
  const fromCoords = routeData.fromCoords;
  const toCoords = routeData.toCoords;

  // Хук для создания поездки
  const createTripMutation = usePostData("/trips");
  
  // Автоматический переход фокуса на поле "куда" после заполнения "откуда"
  useEffect(() => {
    if (fromCoords && fromCoords.lat && fromCoords.lng && selectedFrom && !selectedTo && toInputRef.current) {
      // Небольшая задержка для плавности
      setTimeout(() => {
        toInputRef.current?.focus();
      }, 100);
    }
  }, [fromCoords, selectedFrom, selectedTo]);

  // Функция сброса поля "откуда"
  const handleResetFrom = () => {
    setRouteData(prev => ({
      ...prev,
    from: "",
      fromCoords: null,
    }));
  };

  // Функция сброса поля "куда"
  const handleResetTo = () => {
    setRouteData(prev => ({
      ...prev,
    to: "",
      toCoords: null,
    }));
  };

  // Функция сброса обоих полей
  const handleResetRoute = () => {
    setRouteData({
    from: "",
    to: "",
      fromCoords: null,
      toCoords: null,
    });
  };

  // Функция для обрезки текста до 4 слов
  const truncateAddress = (text) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(" ") + "...";
  };

  // Функции для управления количеством пассажиров
  const handleDecreasePassengers = () => {
    setPassengerCount((prev) => Math.max(1, prev - 1));
  };

  const handleIncreasePassengers = () => {
    setPassengerCount((prev) => Math.min(4, prev + 1));
  };

  // Функция обработки создания заказа
  const handleCreateOrder = async () => {
    // Валидация данных
    if (!selectedFrom || !selectedTo) {
      toast.error("Пожалуйста, выберите адреса отправления и назначения");
      return;
    }

    if (!fromCoords || !toCoords) {
      toast.error("Пожалуйста, выберите точки на карте");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Пожалуйста, выберите дату и время");
      return;
    }

    try {
      // Подготовка данных для отправки
      const orderData = {
        from_lat: fromCoords.lat,
        from_lng: fromCoords.lng,
        from_address: selectedFrom,
        to_lat: toCoords.lat,
        to_lng: toCoords.lng,
        to_address: selectedTo,
        date: selectedDate,
        time: selectedTime,
        seats: passengerCount,
        comment: comment || null,
        role: "passenger",
      };

      // Отправка запроса
      await createTripMutation.mutateAsync(orderData);
      
      // Успешное создание заказа
      toast.success("Заказ успешно создан!");
      
      // Закрываем модальное окно
      setOrderDetailsDialogOpen(false);
      
      // Очищаем форму
      handleResetRoute();
      setSelectedDate(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      });
      setSelectedTime("12:00");
      setPassengerCount(1);
      setComment("");
      
      // Обновляем список заказов
      queryClient.invalidateQueries({ queryKey: ["data"] });
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      const errorMessage = error?.response?.data?.message || "Не удалось создать заказ. Попробуйте еще раз.";
      toast.error(errorMessage);
    }
  };

  // Обработчик открытия модального окна заказа
  const handleNextClick = () => {
    if (selectedFrom && selectedTo && fromCoords && toCoords) {
      setOrderDetailsDialogOpen(true);
    }
  };

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

  // Данные заказов удалены - API /passenger-requests больше не используется
  const data = null;
  const isLoading = false;
  const error = null;
  const refetch = () => {};

  // Получаем активные заказы пользователя для таба "Мои активные заказы"
  const {
    data: myTripsData, 
    isLoading: myTripsLoading, 
    error: myTripsError, 
    refetch: myTripsRefetch 
  } = useGetData("/trips/my");

  // Обрабатываем данные из API /trips/my
  // Структура может быть: { data: [...] } или просто [...]
  const myOrdersRaw = showCreateOrder ? null : (myTripsData?.data || myTripsData || []);
  const myOrders = Array.isArray(myOrdersRaw) ? myOrdersRaw : [];
  const myOrdersLoading = showCreateOrder ? false : myTripsLoading;
  const myOrdersError = showCreateOrder ? null : myTripsError;
  const myOrdersRefetch = showCreateOrder ? () => {} : myTripsRefetch;

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    // API удален, обновление не требуется
  }, [location.pathname]);

  // Для таба "Мои активные заказы" используем данные из API
  // Убеждаемся, что myOrders - это массив
  const myOrdersList = showCreateOrder ? [] : (Array.isArray(myOrders) ? myOrders : []);

  // Мутация создания заказа удалена
  const orderPostMutation = { mutateAsync: async () => ({}) };

  // Все заказы - пустой массив
  const allOrdersFromBackend = [];

  // Фильтрованные заказы - пустой массив
  const filteredOrders = [];

  const showSearchEmptyState = false;

  // Определяем, какие заказы показывать
  // Если showCreateOrder === false, показываем только мои активные заказы
  // Иначе показываем все заказы (для создания нового заказа)
  const activeMyOrders = myOrdersList.filter((item) => item.status === "active" || item.status === "in_progress");
  const showPassengerContent = activeRoleTab === "passenger";
  const showDriverContent = activeRoleTab === "driver";
  
  // Для таба "Мои активные заказы" показываем только мои активные заказы
  // Для таба "Создать заказ" показываем все заказы (для пассажира - мои, для водителя - все)
  const ordersToDisplay = showCreateOrder 
    ? (showPassengerContent ? activeMyOrders : filteredOrders)
    : activeMyOrders;
  const isLoadingOrders = showCreateOrder 
    ? (showPassengerContent ? myOrdersLoading : isLoading)
    : myOrdersLoading;

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
      console.log("=== MY ORDERS DEBUG ===");
    console.log("showCreateOrder:", showCreateOrder);
    console.log("myTripsData:", myTripsData);
    console.log("myOrders:", myOrders);
    console.log("myOrdersList:", myOrdersList);
    console.log("activeMyOrders:", activeMyOrders);
    console.log("ordersToDisplay:", ordersToDisplay);
    console.log("isLoadingOrders:", isLoadingOrders);
  }, [showCreateOrder, myTripsData, myOrders, myOrdersList, activeMyOrders, ordersToDisplay, isLoadingOrders]);
  
  useEffect(() => {
    console.log("=== ORDERS TO DISPLAY ===");
    console.log("Orders to display on map:", ordersToDisplay);
    console.log("Count:", ordersToDisplay?.length || 0);
  }, [ordersToDisplay]);

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

    // API /passenger-requests удален
    toast.error("API удален");
      setIsSubmitting(false);
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
    // API /passenger-requests удален
    toast.error("API удален");
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
  };

  // Обработчик завершения заказа
  const handleCompleteOrder = async (order) => {
    // API /passenger-requests удален
    toast.error("API удален");
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

    // API /passenger-requests удален
    toast.error("API удален");
      setIsSubmitting(false);
  };

  return (
    <div className="w-full">
      <Card className="px-0 pt-0 rounded-3xl shadow-lg border w-full">
        <CardContent className="px-0 pt-0 rounded-3xl bg-card/90 backdrop-blur-sm w-full">
          {/* Поля "Откуда" и "Куда" над картой - только для таба "Создать заказ" */}
          {showCreateOrder && (
          <div className="px-4 pt-2 pb-3 flex flex-col gap-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
              <Input
                type="text"
                placeholder={t("orders.form.fromPlaceholder") || "Откуда"}
                value={selectedFrom}
                onChange={(e) => setRouteData(prev => ({ ...prev, from: e.target.value }))}
                className={`pl-10 ${selectedFrom ? 'pr-10' : ''} bg-white/90 backdrop-blur-sm border-border rounded-xl h-10 text-sm`}
              />
              {selectedFrom && (
                <button
                    type="button"
                  onClick={handleResetFrom}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-20"
                  aria-label="Сбросить поле откуда"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              )}
                </div>
            <div className="relative">
              <Route className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
                      <Input 
                ref={toInputRef}
                type="text"
                placeholder={t("orders.form.toPlaceholder") || "Куда"}
                value={selectedTo}
                onChange={(e) => setRouteData(prev => ({ ...prev, to: e.target.value }))}
                className={`pl-10 ${selectedTo ? 'pr-10' : ''} bg-white/90 backdrop-blur-sm border-border rounded-xl h-10 text-sm`}
              />
              {selectedTo && (
                <button
                    type="button"
                  onClick={handleResetTo}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-20"
                  aria-label="Сбросить поле куда"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              )}
                </div>
      </div>
      )}
            
          {/* Карта - для пассажира показываем мои заказы, для водителя - все заказы */}
                <div className="px-4 mb-4 w-full relative">
                  <OrdersMap 
                    orders={ordersToDisplay} 
                    isLoading={isLoadingOrders} 
                    mapHeight={showCreateOrder ? "h-[calc(100vh-264px)] sm:h-[70vh]" : "h-[calc(100vh-200px)] sm:h-[60vh]"}
              showRoute={showPassengerContent}
                    fromCoords={showCreateOrder ? fromCoords : null}
                    onFromLocationChange={showCreateOrder ? ((coords, address) => {
                      setRouteData(prev => ({
                        ...prev,
                        fromCoords: coords,
                        from: address || prev.from
                      }));
                    }) : null}
                    toCoords={showCreateOrder ? toCoords : null}
                    onToLocationChange={showCreateOrder ? ((coords, address) => {
                      setRouteData(prev => ({
                        ...prev,
                        toCoords: coords,
                        to: address || prev.to
                      }));
                    }) : null}
                    onRefresh={() => {
                      if (showCreateOrder) {
                        refetch();
                        if (showPassengerContent) {
                          myOrdersRefetch();
                        }
                      } else {
                        // Для таба "Мои заказы" обновляем только мои заказы
                        myOrdersRefetch();
                      }
                    }}
                    onEditOrder={handleEditOrder}
                    onDeleteOrder={handleDeleteOrder}
              onCompleteOrder={handleCompleteOrder}
                  />
                  {/* Кнопка "Дальше" - только для таба "Создать заказ" */}
                  {showCreateOrder && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
                    <Button
                      onClick={handleNextClick}
                      disabled={!selectedFrom || !selectedTo || !fromCoords || !toCoords}
                      className={`rounded-xl h-9 px-4 text-sm font-medium shadow-lg transition-all ${
                        !selectedFrom || !selectedTo || !fromCoords || !toCoords
                          ? "bg-white/90 backdrop-blur-md border-2 border-green-400 text-black opacity-60 cursor-not-allowed"
                          : "bg-gradient-to-tr from-blue-500 to-cyan-400 text-white border-2 border-green-500 hover:brightness-105"
                      }`}
                    >
                      Дальше
                    </Button>
                            </div>
                            )}
                          </div>
        </CardContent>
      </Card>

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

      {/* Модальное окно для деталей заказа */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали заказа</DialogTitle>
            <DialogDescription className="text-left pt-2 space-y-1">
              <div>
                <span className="font-bold text-green-600">Откуда:</span> <span className="font-semibold">{truncateAddress(selectedFrom)}</span>
              </div>
              <div>
                <span className="font-bold text-red-600">Куда:</span> <span className="font-semibold">{truncateAddress(selectedTo)}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Дата, время и количество пассажиров */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Выбор даты */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="order-date" className="text-xs font-medium">Дата *</Label>
                <DatePicker
                  id="order-date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  size="sm"
                  dropdownMaxHeight={192}
                  minDate={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              {/* Выбор времени */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="order-time" className="text-xs font-medium">Время *</Label>
                <TimePicker
                  id="order-time"
                  value={selectedTime}
                  onChange={setSelectedTime}
                  size="sm"
                  dropdownMaxHeight={96}
                  className="w-full"
                />
              </div>

              {/* Количество пассажиров */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Пассажиры *</Label>
                <div className="flex items-center gap-1.5 bg-white border rounded-lg h-8 px-2">
                  <button
                    type="button"
                    onClick={handleDecreasePassengers}
                    disabled={passengerCount <= 1}
                    className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Уменьшить количество"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-xs font-medium">{passengerCount}</span>
                  <button
                    type="button"
                    onClick={handleIncreasePassengers}
                    disabled={passengerCount >= 4}
                    className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Увеличить количество"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-comment" className="text-sm font-medium">
                Комментарий {comment.length > 0 && <span className="text-muted-foreground">({comment.length}/30)</span>}
              </Label>
              <Input
                type="text"
                id="order-comment"
                value={comment}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 30) {
                    setComment(value);
                  }
                }}
                placeholder="Дополнительная информация (необязательно)"
                maxLength={30}
                className="w-full h-9 text-sm bg-white"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOrderDetailsDialogOpen(false);
              }}
              className="flex-1 rounded-xl"
            >
              Отменить
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={createTripMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {createTripMutation.isPending ? "Создание..." : "Заказать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default Orders;
