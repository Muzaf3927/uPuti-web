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
import { usePostData, useGetData, deleteData, postData, putData } from "@/api/api";

function Orders({ showCreateOrder = true, showAllOrders = false, onOrderCreated, onBookingSuccess }) {
  const { t } = useI18n();
  const { keyboardInset } = useKeyboardInsets();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeTab: activeRoleTab } = useActiveTab();
  
  // Получаем данные пользователя для определения роли
  const { data: userData, refetch: refetchUser } = useGetData("/user");
  const userRole = userData?.role || "passenger";
  const isDriver = userRole === "driver";
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
  
  // Состояния для автодополнения адресов
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // Ref больше не нужен, так как убрали автоматический фокус
  
  // Для обратной совместимости
  const selectedFrom = routeData.from;
  const selectedTo = routeData.to;
  const fromCoords = routeData.fromCoords;
  const toCoords = routeData.toCoords;

  // Хук для создания поездки
  const createTripMutation = usePostData("/trips");
  
  // Убрали автоматический переход фокуса, чтобы не открывалась клавиатура
  // Пользователь сам нажмет на поле "куда", когда будет готов

  // Функция сброса поля "откуда"
  const handleResetFrom = () => {
    setRouteData(prev => ({
      ...prev,
    from: "",
      fromCoords: null,
    }));
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };

  // Функция сброса поля "куда"
  const handleResetTo = () => {
    setRouteData(prev => ({
      ...prev,
    to: "",
      toCoords: null,
    }));
    setToSuggestions([]);
    setShowToSuggestions(false);
  };

  // Функция сброса обоих полей
  const handleResetRoute = () => {
    setRouteData({
    from: "",
    to: "",
      fromCoords: null,
      toCoords: null,
    });
    setFromSuggestions([]);
    setToSuggestions([]);
    setShowFromSuggestions(false);
    setShowToSuggestions(false);
  };

  // Функция поиска адресов для автодополнения
  const searchAddresses = async (query, countrycodes = "uz") => {
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru&countrycodes=${countrycodes}&addressdetails=1`
      );
      const data = await response.json();
      return data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    } catch (error) {
      console.error("Address search error:", error);
      return [];
    }
  };

  // Обработчик изменения поля "Откуда"
  const handleFromInputChange = async (e) => {
    const value = e.target.value;
    setRouteData(prev => ({ ...prev, from: value }));
    
    if (value.length >= 2) {
      const suggestions = await searchAddresses(value);
      setFromSuggestions(suggestions);
      setShowFromSuggestions(true);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  };

  // Обработчик выбора адреса "Откуда"
  const handleFromSelect = (suggestion) => {
    setRouteData(prev => ({
      ...prev,
      from: suggestion.display_name,
      fromCoords: { lat: suggestion.lat, lng: suggestion.lng }
    }));
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };

  // Обработчик изменения поля "Куда"
  const handleToInputChange = async (e) => {
    const value = e.target.value;
    setRouteData(prev => ({ ...prev, to: value }));
    
    if (value.length >= 2) {
      const suggestions = await searchAddresses(value);
      setToSuggestions(suggestions);
      setShowToSuggestions(true);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  };

  // Обработчик выбора адреса "Куда"
  const handleToSelect = (suggestion) => {
    setRouteData(prev => ({
      ...prev,
      to: suggestion.display_name,
      toCoords: { lat: suggestion.lat, lng: suggestion.lng }
    }));
    setToSuggestions([]);
    setShowToSuggestions(false);
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

    // Валидация цены (обязательное поле)
    if (!amountInput || amountInput.trim() === "") {
      toast.error("Пожалуйста, укажите сумму заказа");
      return;
    }

    const amountValue = parseInt(amountInput.replace(/\s/g, ""), 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Пожалуйста, укажите корректную сумму заказа");
      return;
    }

    try {
      // Подготовка данных для отправки
      const amount = parseInt(amountInput.replace(/\s/g, ""), 10);
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
        amount: amount,
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
      setAmountInput("");
      
      // Обновляем список заказов
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Переключаем на таб "Мои заказы" для пассажиров
      if (onOrderCreated && !isDriver) {
        onOrderCreated();
      }
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

  // Для водителей в табе "Все заказы" используем API /trips/active
  const {
    data: allActiveTripsData,
    isLoading: allActiveTripsLoading,
    error: allActiveTripsError,
    refetch: allActiveTripsRefetch
  } = useGetData(isDriver && showAllOrders ? "/trips/active" : null);

  // Получаем активные заказы пользователя для таба "Мои брони" (для водителей) или "Мои заказы" (для пассажиров)
  // Для водителей используем /bookings/my/in-progress, для пассажиров - /trips/for/passenger/my
  const myOrdersApiUrl = showCreateOrder 
    ? null 
    : (isDriver ? "/bookings/my/in-progress" : "/trips/for/passenger/my");
  
  const {
    data: myTripsData, 
    isLoading: myTripsLoading, 
    error: myTripsError, 
    refetch: myTripsRefetch 
  } = useGetData(myOrdersApiUrl);

  // Обрабатываем данные из API /trips/active (для водителей - все заказы)
  const allActiveOrdersRaw = (isDriver && showAllOrders) ? (allActiveTripsData?.data || allActiveTripsData || []) : [];
  const allActiveOrders = Array.isArray(allActiveOrdersRaw) ? allActiveOrdersRaw : [];

  // Обрабатываем данные из API (мои заказы)
  // Для водителей: /bookings/my/in-progress возвращает массив бронирований с вложенным trip
  // Для пассажиров: /trips/for/passenger/my возвращает массив поездок
  const myOrdersRaw = showCreateOrder ? null : (myTripsData?.data || myTripsData || []);
  const myOrders = Array.isArray(myOrdersRaw) ? myOrdersRaw : [];
  
  // Для водителей: преобразуем бронирования в формат, понятный для OrdersMap
  // Извлекаем trip из каждого booking и добавляем информацию о booking
  const processedMyOrders = isDriver && !showCreateOrder
    ? myOrders.map((booking) => {
        // Если booking содержит trip, используем данные trip и добавляем информацию о booking
        if (booking.trip) {
          return {
            ...booking.trip, // Основная информация о поездке (from_lat, from_lng, from_address, to_lat, to_lng, to_address, date, time, status и т.д.)
            id: booking.trip.id, // ID поездки (для совместимости с OrdersMap)
            booking_id: booking.id, // ID бронирования
            booking_seats: booking.seats, // Количество мест в бронировании
            booking_offered_price: booking.offered_price, // Предложенная цена
            booking_comment: booking.comment, // Комментарий к бронированию
            booking_status: booking.status, // Статус бронирования (in_progress)
            // Информация о пассажире уже есть в booking.trip.user
            // driver_offers может отсутствовать, так как это уже принятое бронирование
            driver_offers: booking.trip.driver_offers || [], // Офферы водителей (если есть)
          };
        }
        return booking;
      })
    : myOrders;
  
  // Для таба "Мои брони" (для водителей) или "Мои заказы" (для пассажиров) используем обработанные данные
  const myOrdersList = showCreateOrder ? [] : (Array.isArray(processedMyOrders) ? processedMyOrders : []);

  // Определяем, какие заказы показывать
  // Для водителей из /bookings/my/in-progress не нужно фильтровать по статусу, так как API уже возвращает in-progress
  // Для пассажиров фильтруем по статусу active или in_progress
  const activeMyOrders = isDriver 
    ? myOrdersList // Для водителей берем все данные из /bookings/my/in-progress (уже обработанные)
    : myOrdersList.filter((item) => item.status === "active" || item.status === "in_progress");
  const showPassengerContent = userRole === "passenger";
  const showDriverContent = userRole === "driver";
  
  // Для водителей:
  // - Таб "Все заказы" (showAllOrders === true): показываем все активные заказы из /trips/active
  // - Таб "Мои брони" (showAllOrders === false): показываем мои заказы в процессе из /bookings/my/in-progress
  // Для пассажиров:
  // - Таб "Создать заказ" (showCreateOrder === true): показываем мои активные заказы
  // - Таб "Мои заказы" (showCreateOrder === false): показываем мои активные заказы из /trips/for/passenger/my
  const ordersToDisplay = isDriver 
    ? (showAllOrders ? allActiveOrders : activeMyOrders)
    : (showCreateOrder ? activeMyOrders : activeMyOrders);
    
  const isLoadingOrders = isDriver
    ? (showAllOrders ? (allActiveTripsLoading || false) : (myTripsLoading || false))
    : (showCreateOrder ? (myTripsLoading || false) : (myTripsLoading || false));
    
  const ordersRefetch = isDriver
    ? (showAllOrders ? (allActiveTripsRefetch || (() => {})) : (myTripsRefetch || (() => {})))
    : (showCreateOrder ? (() => {}) : (myTripsRefetch || (() => {})));

  // Логирование для отладки (опционально, можно закомментировать в продакшене)
  useEffect(() => {
    console.log("=== ORDERS DEBUG ===");
    console.log("isDriver:", isDriver);
    console.log("showCreateOrder:", showCreateOrder);
    console.log("showAllOrders:", showAllOrders);
    console.log("allActiveTripsData:", allActiveTripsData);
    console.log("myTripsData:", myTripsData);
    console.log("allActiveOrders:", allActiveOrders);
    console.log("activeMyOrders:", activeMyOrders);
    console.log("ordersToDisplay:", ordersToDisplay);
    console.log("isLoadingOrders:", isLoadingOrders);
  }, [isDriver, showCreateOrder, showAllOrders, allActiveTripsData, myTripsData, allActiveOrders, activeMyOrders, ordersToDisplay, isLoadingOrders]);

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
  const handleDeleteOrder = async (order) => {
    if (!order?.id) return;
    
    try {
      const response = await deleteData(`/trips/${order.id}`);
      // API возвращает { message: "Trip deleted" } при успехе (200)
      let successMessage = response?.message || response?.data?.message;
      // Переводим английское сообщение на русский
      if (successMessage === "Trip deleted") {
        successMessage = "Заказ отменен";
      }
      successMessage = successMessage || t("orders.myOrderActions.deleteSuccess") || "Заказ отменен";
      toast.success(successMessage);
      
      // Обновляем данные
      queryClient.invalidateQueries({ queryKey: ["data", "/trips/for/passenger/my"] });
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Обновляем список заказов
      if (myTripsRefetch) {
        myTripsRefetch();
      }
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
      // Если это не ошибка сети, а успешный ответ с сообщением об ошибке
      if (error?.response?.status === 200 && error?.response?.data?.message) {
        let successMessage = error.response.data.message;
        if (successMessage === "Trip deleted") {
          successMessage = "Заказ отменен";
        }
        toast.success(successMessage);
        // Обновляем данные даже если была "ошибка"
        queryClient.invalidateQueries({ queryKey: ["data", "/trips/for/passenger/my"] });
        queryClient.invalidateQueries({ queryKey: ["data"] });
        if (myTripsRefetch) {
          myTripsRefetch();
        }
        return;
      }
      const errorMessage = error?.response?.data?.message || t("orders.myOrderActions.deleteError") || "Ошибка при отмене заказа";
      toast.error(errorMessage);
    }
  };

  // Подтверждение удаления
  const confirmDeleteOrder = async () => {
    if (!orderToDelete?.id) return;
    
    try {
      const response = await deleteData(`/trips/${orderToDelete.id}`);
      // API возвращает { message: "Trip deleted" } при успехе (200)
      let successMessage = response?.message || response?.data?.message;
      // Переводим английское сообщение на русский
      if (successMessage === "Trip deleted") {
        successMessage = "Заказ отменен";
      }
      successMessage = successMessage || t("orders.myOrderActions.deleteSuccess") || "Заказ отменен";
      toast.success(successMessage);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      
      // Обновляем данные
      queryClient.invalidateQueries({ queryKey: ["data", "/trips/for/passenger/my"] });
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Обновляем список заказов
      if (myTripsRefetch) {
        myTripsRefetch();
      }
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
      // Если это не ошибка сети, а успешный ответ с сообщением об ошибке
      if (error?.response?.status === 200 && error?.response?.data?.message) {
        let successMessage = error.response.data.message;
        if (successMessage === "Trip deleted") {
          successMessage = "Заказ отменен";
        }
        toast.success(successMessage);
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
        // Обновляем данные даже если была "ошибка"
        queryClient.invalidateQueries({ queryKey: ["data", "/trips/for/passenger/my"] });
        queryClient.invalidateQueries({ queryKey: ["data"] });
        if (myTripsRefetch) {
          myTripsRefetch();
        }
        return;
      }
      const errorMessage = error?.response?.data?.message || t("orders.myOrderActions.deleteError") || "Ошибка при отмене заказа";
      toast.error(errorMessage);
    }
  };

  // Обработчик завершения заказа
  const handleCompleteOrder = async (order) => {
    if (!order?.id) return;
    
    try {
      const response = await putData(`/trips/${order.id}/completed`, {});
      // Используем сообщение из ответа API, если есть, иначе стандартное из локализации
      let successMessage = response?.message;
      // Если API вернул сообщение, используем его, иначе используем локализацию
      if (!successMessage) {
        successMessage = t("orders.myOrderActions.completeSuccess") || "Заказ завершен";
      }
      toast.success(successMessage);
      
      // Обновляем данные
      queryClient.invalidateQueries({ queryKey: ["data", "/bookings/my/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Обновляем список заказов
      if (myTripsRefetch) {
        myTripsRefetch();
      }
    } catch (error) {
      console.error("Ошибка при завершении заказа:", error);
      const errorMessage = error?.response?.data?.message || t("orders.myOrderActions.completeError") || "Ошибка при завершении заказа";
      toast.error(errorMessage);
    }
  };

  // Обработчик отмены бронирования водителем
  const handleCancelBooking = async (order) => {
    if (!order?.booking_id) {
      toast.error("ID бронирования не найден");
      return;
    }
    
    try {
      const response = await postData(`/bookings/${order.booking_id}/cancel`, {});
      toast.success(response?.message || "Бронь отменена");
      
      // Обновляем данные
      queryClient.invalidateQueries({ queryKey: ["data", "/bookings/my/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Обновляем список заказов
      if (myTripsRefetch) {
        myTripsRefetch();
      }
    } catch (error) {
      console.error("Ошибка при отмене бронирования:", error);
      const errorMessage = error?.response?.data?.message || "Не удалось отменить бронирование. Попробуйте еще раз.";
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

    // API /passenger-requests удален
    toast.error("API удален");
      setIsSubmitting(false);
  };

  return (
    <div className="w-full">
          {/* Поля "Откуда" и "Куда" над картой - только для таба "Создать заказ" (пассажиры) */}
          {showCreateOrder && !isDriver && (
          <div className="px-2 pt-0 pb-2 flex flex-col gap-1.5">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary z-10" />
              <Input
                type="text"
                placeholder={t("orders.form.fromPlaceholder") || "Откуда"}
                value={selectedFrom}
                onChange={handleFromInputChange}
                onFocus={() => {
                  if (fromSuggestions.length > 0) {
                    setShowFromSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Задержка для обработки клика по варианту
                  setTimeout(() => setShowFromSuggestions(false), 200);
                }}
                className={`pl-9 ${selectedFrom ? 'pr-9' : ''} bg-white/90 backdrop-blur-sm border-border rounded-lg h-8 text-xs`}
              />
              {selectedFrom && (
                <button
                    type="button"
                  onClick={handleResetFrom}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-20"
                  aria-label="Сбросить поле откуда"
                >
                  <X className="h-3.5 w-3.5 text-gray-600" />
                </button>
              )}
              {/* Выпадающий список вариантов для "Откуда" */}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[5000] max-h-48 overflow-y-auto">
                  {fromSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleFromSelect(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm text-gray-900 truncate">{suggestion.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
                </div>
            <div className="relative">
              <Route className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary z-10" />
                      <Input 
                type="text"
                placeholder={t("orders.form.toPlaceholder") || "Куда"}
                value={selectedTo}
                onChange={handleToInputChange}
                onFocus={() => {
                  if (toSuggestions.length > 0) {
                    setShowToSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Задержка для обработки клика по варианту
                  setTimeout(() => setShowToSuggestions(false), 200);
                }}
                className={`pl-9 ${selectedTo ? 'pr-9' : ''} bg-white/90 backdrop-blur-sm border-border rounded-lg h-8 text-xs`}
              />
              {selectedTo && (
                <button
                    type="button"
                  onClick={handleResetTo}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-20"
                  aria-label="Сбросить поле куда"
                >
                  <X className="h-3.5 w-3.5 text-gray-600" />
                </button>
              )}
              {/* Выпадающий список вариантов для "Куда" */}
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[5000] max-h-48 overflow-y-auto">
                  {toSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToSelect(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm text-gray-900 truncate">{suggestion.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
                </div>
      </div>
      )}
            
          {/* Карта - для пассажира показываем мои заказы, для водителя - все заказы или мои заказы в зависимости от таба */}
                <div className="px-2 mb-4 w-full relative">
                  <OrdersMap 
                    orders={ordersToDisplay} 
                    isLoading={isLoadingOrders} 
                    mapHeight={showCreateOrder && !isDriver ? "h-[calc(100vh-264px)] sm:h-[70vh]" : "h-[calc(100vh-230px)] sm:h-[38vh]"}
              showRoute={showPassengerContent && showCreateOrder}
                    useClassicMarkers={isDriver && showAllOrders}
                    fromCoords={showCreateOrder && !isDriver ? fromCoords : null}
                    onFromLocationChange={showCreateOrder && !isDriver ? ((coords, address) => {
                      setRouteData(prev => ({
                        ...prev,
                        fromCoords: coords,
                        from: address || prev.from
                      }));
                    }) : null}
                    toCoords={showCreateOrder && !isDriver ? toCoords : null}
                    onToLocationChange={showCreateOrder && !isDriver ? ((coords, address) => {
                      setRouteData(prev => ({
                        ...prev,
                        toCoords: coords,
                        to: address || prev.to
                      }));
                    }) : null}
                    onRefresh={() => {
                      if (showCreateOrder) {
                        if (showPassengerContent) {
                          myTripsRefetch();
                        }
                      } else {
                        // Обновляем заказы в зависимости от таба
                        ordersRefetch();
                      }
                    }}
                    onEditOrder={handleEditOrder}
                    onDeleteOrder={handleDeleteOrder}
              onCompleteOrder={handleCompleteOrder}
                    onCancelBooking={handleCancelBooking}
                    onBookingSuccess={onBookingSuccess}
                  />
                  {/* Кнопка "Дальше" - только для таба "Создать заказ" (пассажиры) */}
                  {showCreateOrder && !isDriver && (
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
            {/* Дата, время, количество пассажиров и сумма */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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

              {/* Сумма заказа */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="order-amount" className="text-xs font-medium">Сумма (сум) *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    id="order-amount"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                      setAmountInput(formatted);
                    }}
                    placeholder="Введите сумму"
                    required
                    className="w-full h-8 text-sm bg-white pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">сум</span>
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
