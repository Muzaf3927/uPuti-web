import React, { useEffect, useState, useMemo } from "react";

// components
import OrdersMap from "@/components/OrdersMap";
import RouteSelectorMap from "@/components/RouteSelectorMap";

// icons
import { Loader2, X, Phone, AlertTriangle } from "lucide-react";

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

// API /passenger-requests удален - импорты больше не нужны
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useI18n } from "@/app/i18n.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState.jsx";
import { useActiveTab } from "@/layout/MainLayout";

function Orders() {
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

  const myOrders = null;
  const myOrdersLoading = false;
  const myOrdersError = null;
  const myOrdersRefetch = () => {};

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    // API удален, обновление не требуется
  }, [location.pathname]);

  const myOrdersList = [];

  // Мутация создания заказа удалена
  const orderPostMutation = { mutateAsync: async () => ({}) };

  // Все заказы - пустой массив
  const allOrdersFromBackend = [];

  // Фильтрованные заказы - пустой массив
  const filteredOrders = [];

  const showSearchEmptyState = false;

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
    <div>
      <Card className="px-0 rounded-3xl shadow-lg border">
        <CardContent className="px-0 rounded-3xl bg-card/90 backdrop-blur-sm">
            
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
                    }}
                    onEditOrder={handleEditOrder}
                    onDeleteOrder={handleDeleteOrder}
              onCompleteOrder={handleCompleteOrder}
                  />
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
    </div>
  );
}

export default Orders;
