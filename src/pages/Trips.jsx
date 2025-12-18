import React, { useEffect, useState } from "react";

// components
import TripsCard from "@/components/TripsCard";

// icons
import { Car, MapPin, Search, ChevronLeft, ChevronRight, Loader2, X, ArrowLeft } from "lucide-react";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TimePicker from "@/components/ui/time-picker";

import { Textarea } from "@/components/ui/textarea";

import { useGetData, usePostData } from "@/api/api";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useI18n } from "@/app/i18n.jsx";
import { useQueryClient } from "@tanstack/react-query";
import TripsCardSkeleton from "@/components/TripsCardSkeleton";
import { toast } from "sonner";
import MyTripsCard from "@/components/MyTripsCard";
import EmptyState from "@/components/EmptyState.jsx";
// import TelegramConnectModal from "@/components/TelegramConnectModal.jsx";
import { sessionManager } from "@/lib/sessionManager.js";
import { useActiveTab } from "@/layout/MainLayout";
import { Plus } from "lucide-react";
import { useTripsWebSocket, useUserTripsWebSocket, useDriversTripsWebSocket } from "@/hooks/useWebSocket";
 

function Trips() {
  const { t } = useI18n();
  const { keyboardInset, viewportHeight } = useKeyboardInsets();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeTab } = useActiveTab();
  const [dialog, setDialog] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  // Закомментировано: проверка telegram_chat_id после логина
  // Будет использовано позже
  // const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  
  // Получаем данные пользователя для проверки роли
  const { data: userData, refetch: refetchUser } = useGetData("/user");
  
  // Определяем роль пользователя из API
  const userRole = userData?.role || "passenger";
  
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [formErrors, setFormErrors] = useState({});
  const [dialogBron, setDialogBron] = useState(false);
  const [dialogPrice, setDialogPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costInput, setCostInput] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
  });

  const [activeFilters, setActiveFilters] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
  });

  const [filteredUrl, setFilteredUrl] = useState("");
  const [allPage, setAllPage] = useState(1);
  const [myPage, setMyPage] = useState(1);
  const ALL_PER_PAGE = 10;
  const MY_PER_PAGE = 5;

  const baseQuery = activeFilters.from
    ? `?from_city=${activeFilters.from}&to_city=${activeFilters.to}${activeFilters.date ? `&date=${activeFilters.date}` : ""}`
    : "?";
  const allTripsUrl = `/trips${baseQuery}${baseQuery.includes("?") && baseQuery !== "?" ? "&" : ""}page=${allPage}&per_page=${ALL_PER_PAGE}`;
  const { data, isLoading, error, refetch } = useGetData(allTripsUrl);

  const handleSearch = (e) => {
    e.preventDefault();
    // Устанавливаем активные фильтры только при нажатии кнопки поиска
    setActiveFilters({ ...searchFilters });
    setSearchDialog(false);
    
    // Отслеживание события поиска в Яндекс.Метрике
    if (typeof window !== "undefined" && window.ym) {
      window.ym(105604771, "reachGoal", "search_trip", {
        from: searchFilters.from || "",
        to: searchFilters.to || "",
        date: searchFilters.date || "",
      });
    }
  };

  const handleClearSearch = () => {
    setActiveFilters({ from: "", to: "", date: "", time: "" });
    setSearchFilters({ from: "", to: "", date: "", time: "" });
  };

  const {
    data: myTrips,
    isLoading: myTripsLoading,
    error: myTripsError,
    refetch: myTripsRefetch,
  } = useGetData(`/trips/my?page=${myPage}&per_page=${MY_PER_PAGE}`);

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    if (location.pathname === "/") {
      refetch();
      myTripsRefetch();
    }
  }, [location.pathname, refetch, myTripsRefetch]);

  // WebSocket подписка на канал drivers.trips (ОСНОВНОЙ канал для новых поездок)
  // Бэкенд отправляет TripCreated в канал drivers.trips
  // Это работает для ВСЕХ пользователей (и пассажиров, и водителей)
  useDriversTripsWebSocket(
    (trip) => {
      console.log('🎉 [Trips] drivers.trips: Новый трип создан!', trip);
      // Обновляем для ВСЕХ пользователей
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
      // Показываем уведомление для пассажиров
      if (userRole === "passenger") {
        toast.success("Новая поездка доступна!");
      }
    },
    (trip) => {
      console.log('[Trips] drivers.trips: Трип обновлен', trip);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
    },
    (trip) => {
      console.log('[Trips] drivers.trips: Трип отменен', trip);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
    }
  );

  // WebSocket подписка на канал user.{id} для получения персональных уведомлений
  // Бэкенд отправляет TripUpdated и TripBooked в этот канал
  const userId = userData?.id;
  useUserTripsWebSocket(
    userId,
    // Новый трип создан водителем - обновляем список для пассажиров
    (trip) => {
      console.log('🎉 [Trips] user channel: Новый трип создан', trip);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
    },
    // Трип обновлен - обновляем список (TripUpdated)
    (trip) => {
      console.log('🔄 [Trips] user channel: Трип обновлен', trip);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
    },
    // Новое бронирование создано - обновляем список (TripBooked)
    (booking) => {
      console.log('🎫 [Trips] user channel: Новое бронирование (trip.booked)', booking);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
      toast.success("Новое бронирование!");
    },
    // Бронирование обновлено - обновляем список
    (booking) => {
      console.log('🔄 [Trips] user channel: Бронирование обновлено', booking);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
    },
    // Бронирование отменено - обновляем список
    (booking) => {
      console.log('❌ [Trips] user channel: Бронирование отменено', booking);
      queryClient.invalidateQueries({ queryKey: ['data'] });
      refetch();
      myTripsRefetch();
    }
  );


  // Закомментировано: проверка telegram_chat_id после логина
  // Показываем модальное окно Telegram при открытии диалога создания поездки
  // Только если у пользователя нет telegram_chat_id
  // useEffect(() => {
  //   if (dialog) {
  //     // Отслеживание открытия диалога создания поездки в Яндекс.Метрике
  //     if (typeof window !== "undefined" && window.ym) {
  //       window.ym(105604771, "reachGoal", "open_create_trip_dialog");
  //     }
  //     
  //     // Отправляем один запрос на бэкенд для проверки telegram_chat_id
  //     refetchUser().then((result) => {
  //       // Проверяем после обновления данных - используем данные из результата или из кэша
  //       const updatedUser = result?.data || queryClient.getQueryData(["data", "/user"]) || sessionManager.getUserData();
  //       // Показываем модальное окно только если telegram_chat_id отсутствует или пустая строка
  //       const hasTelegram = updatedUser?.telegram_chat_id && updatedUser.telegram_chat_id.trim() !== "";
  //       if (updatedUser && !hasTelegram) {
  //         setTelegramModalOpen(true);
  //       }
  //     }).catch(() => {
  //       // В случае ошибки проверяем из кэша
  //       const user = userData || sessionManager.getUserData();
  //       const hasTelegram = user?.telegram_chat_id && user.telegram_chat_id.trim() !== "";
  //       if (user && !hasTelegram) {
  //         setTelegramModalOpen(true);
  //       }
  //     });
  //   }
  // }, [dialog, refetchUser, queryClient]);

  // Отслеживание открытия диалога поиска в Яндекс.Метрике
  useEffect(() => {
    if (searchDialog && typeof window !== "undefined" && window.ym) {
      window.ym(105604771, "reachGoal", "open_search_dialog");
    }
  }, [searchDialog]);

  //

  // useEffect(() => {
  //   refetch();
  // }, [filteredUrl]);

  const myTripsList = (myTrips && myTrips.data) || [];

  const tripPostMutation = usePostData("/trip");

  const filteredTrips = Array.isArray(data?.data)
    ? data.data
        .filter((trip) => trip.status !== "completed")
        .filter((trip) => Boolean(trip?.driver))
    : [];

  const hasActiveSearch = Boolean(activeFilters.from || activeFilters.to || activeFilters.date || activeFilters.time);
  const showSearchEmptyState = hasActiveSearch && !isLoading && filteredTrips.length === 0;


  // Функция валидации формы
  const validateForm = (formData) => {
    const errors = {};
    
    if (!formData.get("from")?.trim()) {
      errors.from = t("trips.form.validation.fromRequired");
    }
    if (!formData.get("to")?.trim()) {
      errors.to = t("trips.form.validation.toRequired");
    }
    if (!formData.get("date")?.trim()) {
      errors.date = t("trips.form.validation.dateRequired");
    }
    if (!selectedTime?.trim()) {
      errors.time = t("trips.form.validation.timeRequired");
    }
    if (!formData.get("cost")?.trim()) {
      errors.cost = t("trips.form.validation.costRequired");
    }
    if (!formData.get("carSeats")?.trim()) {
      errors.carSeats = t("trips.form.validation.carSeatsRequired");
    }
    if (!formData.get("carModel")?.trim()) {
      errors.carModel = t("trips.form.validation.carModelRequired");
    }
    if (!formData.get("carColor")?.trim()) {
      errors.carColor = t("trips.form.validation.carColorRequired");
    }
    if (!formData.get("carNumber")?.trim()) {
      errors.carNumber = t("trips.form.validation.carNumberRequired");
    }
    
    // Проверка даты и времени
    const selectedDate = formData.get("date");
    const selectedTimeValue = selectedTime;
    
    if (selectedDate && selectedTimeValue) {
      const now = new Date();
      const selectedDateTime = new Date(`${selectedDate}T${selectedTimeValue}:00`);
      
      if (selectedDateTime <= now) {
        errors.dateTime = t("trips.form.validation.futureDateTime");
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Защита от множественных нажатий
    if (isSubmitting) return;
    
    const formData = new FormData(e.target);

    // Валидация формы
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("trips.form.validationError"));
      return;
    }

    // Очищаем ошибки если валидация прошла
    setFormErrors({});
    setIsSubmitting(true);

    const from_city = formData.get("from");
    const to_city = formData.get("to");
    const date = formData.get("date");
    const time = selectedTime; // Используем выбранное время из TimePicker
    const price = (costInput || "").replace(/\s/g, "");
    const note = formData.get("note");
    const carModel = formData.get("carModel");
    const carColor = formData.get("carColor");
    const numberCar = formData.get("carNumber")?.toString().toUpperCase(); // Автоматически делаем заглавными
    const seats = formData.get("carSeats");

    const resultData = {
      from_city,
      to_city,
      date,
      time,
      seats,
      price,
      note,
      carModel,
      carColor,
      numberCar,
    };

    try {
      console.log('🚀 [Trips] Отправка запроса на создание поездки:', resultData);
      const res = await tripPostMutation.mutateAsync(resultData);
      console.log('✅ [Trips] Поездка успешно создана, ответ от сервера:', res);
      
      if (res.message === "Trip created!") {
        console.log('📢 [Trips] Поездка создана! Ожидаем WebSocket событие для обновления списка...');
        toast.success(t("trips.form.successMessage"));
        setDialog(false);
        
        // Сбрасываем форму
        setCostInput("");
        setSelectedTime("12:00");
        setFormErrors({});
        e.target.reset();
        
        // Обновляем списки поездок
        if (userRole === "driver") {
          myTripsRefetch();
        }
        refetch();
        
        // Отслеживание события создания поездки в Яндекс.Метрике
        if (typeof window !== "undefined" && window.ym) {
          window.ym(105604771, "reachGoal", "create_trip", {
            from: from_city || "",
            to: to_city || "",
            date: date || "",
            price: price || "",
          });
        }
      }
    } catch (err) {
      console.error(err);
      
      // Отображаем ошибку от backend
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Если есть валидационные ошибки
        const errorMessages = Object.values(err.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error(t("trips.form.errorMessage"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (isLoading) {
  //   return;
  // }

  // Показываем только нужный контент в зависимости от реальной роли пользователя из API
  const showPassengerContent = userRole === "passenger";
  const showDriverContent = userRole === "driver";

  return (
    <div>
      {/* Кнопка поиска для пассажира */}
      {showPassengerContent && (
        <div className="px-4 mb-3">
          <Button
            onClick={() => {
              if (hasActiveSearch) {
                handleClearSearch();
              } else {
                setSearchDialog(true);
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-9 text-sm font-medium hover:brightness-110 transition-all"
          >
            {hasActiveSearch ? (
              <>
                <X size={18} />
                {t("trips.searchForm.clear")}
              </>
            ) : (
              <>
                <Search size={18} />
                {t("trips.searchForm.search")}
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Диалог поиска для пассажира */}
      {showPassengerContent && (
        <Dialog
          className="w-full"
          open={searchDialog}
          onOpenChange={setSearchDialog}
        >
          <DialogContent 
              className="overflow-hidden rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-none"
              style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
              autoFocusScroll
              showCloseButton={false}
            >
              <DialogHeader className="relative">
                <DialogTitle className="text-center text-primary font-bold pr-8">
                  {t("trips.searchForm.search")}
                </DialogTitle>
            <DialogDescription className="sr-only">Search trip dialog</DialogDescription>
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
                  <Label htmlFor="from">{t("trips.searchForm.from")}</Label>
                  <Input
                    type="text"
                    id="from"
                    name="from"
                    value={searchFilters.from}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, from: e.target.value }))}
                    placeholder={t("trips.searchForm.fromPlaceholder")}
                    className="bg-white"
                  />
                  <div className="grid w-full items-center gap-3">
                  <Label htmlFor="to">{t("trips.searchForm.to")}</Label>
                  <Input
                    type="text"
                    id="to"
                    name="to"
                    value={searchFilters.to}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, to: e.target.value }))}
                    placeholder={t("trips.searchForm.toPlaceholder")}
                    className="bg-white"
                  />
                  </div>
                  <div className="grid w-full items-center gap-3">
                  <Label htmlFor="search-date">{t("trips.searchForm.date")}</Label>
                  <Input
                    type="date"
                    id="search-date"
                    name="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder={t("trips.searchForm.datePlaceholder")}
                    className="bg-white h-9 w-full min-w-0"
                  />
                  </div>
                </div>
                {/* Footer outside of scroll area to avoid iOS sticky issues */}
                <div className="w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 flex gap-2 mt-2 py-1" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                  <DialogClose className="w-1/2" asChild>
                    <Button className="rounded-2xl h-9 text-xs sm:text-sm">
                      {t("trips.searchForm.cancel")}
                    </Button>
                  </DialogClose>
                  <Button className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm" type="submit">
                    {t("trips.searchForm.search")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      )}
      
      {/* Кнопка создания поездки для водителя */}
      {showDriverContent && (
        <div className="px-4 mb-3">
          <Dialog className="w-full" open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-9 text-sm font-medium hover:brightness-110 transition-all"
              >
                <Plus size={18} />
                {t("trips.create")}
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
      
      {/* Диалог создания поездки (используется только для водителя через кнопку +) */}
      {showDriverContent && (
      <Dialog className="w-full" open={dialog} onOpenChange={setDialog}>
          <DialogContent
            className="w-[95vw] sm:max-w-[760px] p-4 sm:p-6 overflow-hidden overscroll-contain touch-pan-y rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-[calc(100svh-2rem)]"
            style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
            preventOutsideClose
            showCloseButton={false}
            autoFocusScroll
          >
            <DialogHeader>
              <DialogDescription className="sr-only">Create trip dialog</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 overflow-y-auto overflow-x-hidden pr-1 touch-pan-y overscroll-contain max-h-[60svh]"
                   onTouchMove={(e) => e.stopPropagation()}
              >
              <div className="col-span-1 sm:col-span-1 grid items-center gap-1.5">
                <Label htmlFor="from">{t("trips.form.from")} *</Label>
                <Input 
                  type="text" 
                  id="from" 
                  name="from" 
                  placeholder={t("trips.form.fromPlaceholder")} 
                  required
                  className={`${formErrors.from ? "border-red-500" : ""} bg-white`}
                />
                {formErrors.from && <span className="text-red-500 text-xs">{formErrors.from}</span>}
              </div>
              <div className="col-span-1 sm:col-span-1 grid items-center gap-1.5">
                <Label htmlFor="to">{t("trips.form.to")} *</Label>
                <Input 
                  type="text" 
                  id="to" 
                  name="to" 
                  placeholder={t("trips.form.toPlaceholder")} 
                  required
                  className={`${formErrors.to ? "border-red-500" : ""} bg-white`}
                />
                {formErrors.to && <span className="text-red-500 text-xs">{formErrors.to}</span>}
              </div>
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date" className="text-sm">{t("trips.form.date")} *</Label>
                  <Input 
                    type="date" 
                    id="date" 
                    name="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={`${formErrors.date || formErrors.dateTime ? "border-red-500" : ""} bg-white h-8 sm:h-9 text-sm w-full min-w-0`}
                  />
                  {formErrors.date && <span className="text-red-500 text-xs">{formErrors.date}</span>}
                  {formErrors.dateTime && <span className="text-red-500 text-xs">{formErrors.dateTime}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="time" className="text-sm">{t("trips.form.time")} *</Label>
                  <TimePicker
                    id="time"
                    value={selectedTime}
                    onChange={setSelectedTime}
                    size="sm"
                    dropdownMaxHeight={112}
                    className={`w-full h-8 sm:h-9 ${formErrors.time || formErrors.dateTime ? "border-red-500" : ""} bg-white`}
                  />
                  {formErrors.time && <span className="text-red-500 text-xs">{formErrors.time}</span>}
                  {formErrors.dateTime && <span className="text-red-500 text-xs">{formErrors.dateTime}</span>}
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="cost">{t("trips.form.cost")} *</Label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      id="cost" 
                      name="cost" 
                      inputMode="numeric"
                      placeholder={t("trips.form.costPlaceholder")} 
                      required
                      value={costInput}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                        setCostInput(formatted);
                      }}
                      className={`${formErrors.cost ? "border-red-500" : ""} pr-16 bg-white`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">сум</span>
                  </div>
                  {formErrors.cost && <span className="text-red-500 text-xs">{formErrors.cost}</span>}
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="carSeats">{t("trips.form.carSeats")} *</Label>
                  <Input 
                    type="number" 
                    id="carSeats" 
                    name="carSeats" 
                    defaultValue="3"
                    placeholder={t("trips.form.carSeatsPlaceholder")} 
                    required
                    className={`${formErrors.carSeats ? "border-red-500" : ""} bg-white`}
                  />
                  {formErrors.carSeats && <span className="text-red-500 text-xs">{formErrors.carSeats}</span>}
                </div>
              </div>
              <div className="col-span-1 grid items-center gap-1.5">
                <Label htmlFor="car">{t("trips.form.carModel")} *</Label>
                <Input 
                  type="text" 
                  id="car" 
                  name="carModel" 
                  placeholder={t("trips.form.carModelPlaceholder")} 
                  required
                  className={`${formErrors.carModel ? "border-red-500" : ""} bg-white`}
                />
                {formErrors.carModel && <span className="text-red-500 text-xs">{formErrors.carModel}</span>}
              </div>
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="carColor">{t("trips.form.carColor")} *</Label>
                  <Input 
                    type="text" 
                    id="carColor" 
                    name="carColor" 
                    placeholder={t("trips.form.carColorPlaceholder")} 
                    required
                    className={`${formErrors.carColor ? "border-red-500" : ""} bg-white`}
                  />
                  {formErrors.carColor && <span className="text-red-500 text-xs">{formErrors.carColor}</span>}
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="carNumber">{t("trips.form.carNumber")} *</Label>
                  <Input
                    type="text" 
                    id="carNumber" 
                    name="carNumber" 
                    placeholder={t("trips.form.carNumberPlaceholder")} 
                    className={`uppercase ${formErrors.carNumber ? "border-red-500" : ""} bg-white`}
                    required
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {formErrors.carNumber && <span className="text-red-500 text-xs">{formErrors.carNumber}</span>}
                </div>
              </div>
              <div className="col-span-1 grid items-center gap-1.5">
                <Label htmlFor="note">{t("trips.form.note")}</Label>
                <Input type="text" id="note" name="note" placeholder={t("trips.commentPlaceholder")} className="bg-white" />
              </div>
              </div>
              {/* Footer outside of scroll area to avoid iOS sticky-bottom issues */}
              <div className="flex gap-2 mt-2 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-1" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                <DialogClose asChild>
                  <Button type="button" className="rounded-2xl w-1/2 h-9 text-xs sm:text-sm">{t("trips.form.cancel")}</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      {t("trips.form.submitting")}
                    </span>
                  ) : (
                    t("trips.form.submit")
                  )}
                </Button>
              </div>
              
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      <Card className="px-0 rounded-3xl shadow-lg border">
        <CardContent className="px-0 rounded-3xl bg-card/90 backdrop-blur-sm">
          {showPassengerContent && (
            <>
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-primary">{t("trips.all")}</h3>
              </div>
              <div className="p-3 space-y-3">
                {isLoading ? (
                  Array(4)
                    .fill(1)
                    .map((_, index) => <TripsCardSkeleton key={index} />)
                ) : showSearchEmptyState ? (
                  <div className="text-center text-sm sm:text-base text-gray-600 bg-white/70 border border-dashed border-primary/30 rounded-2xl px-4 py-6">
                    {t("trips.searchEmpty")}
                  </div>
                ) : (
                  filteredTrips.map((trip) => <TripsCard trip={trip} key={trip.id} />)
                )}
              </div>
              <div className="flex items-center justify-center gap-3 px-4 py-2">
                <Button variant="outline" disabled={allPage === 1} onClick={() => setAllPage((p) => Math.max(1, p - 1))} aria-label="Prev page">
                  <ChevronLeft />
                </Button>
                <span className="text-sm">{allPage}</span>
                <Button
                  variant="outline"
                  disabled={!Array.isArray(data?.data) || data.data.length < ALL_PER_PAGE}
                  onClick={() => setAllPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </>
          )}
          
          {showDriverContent && (
            <>
              {myTripsLoading ? (
                <div className="p-3">
                  {Array(2)
                    .fill(1)
                    .map((_, index) => <TripsCardSkeleton key={index} />)}
                </div>
              ) : (
                <>
                  {myTrips && myTripsList.length === 0 ? (
                    <div className="p-3">
                      <EmptyState
                        title={t("trips.empty")}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="px-4 pt-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-primary">{t("trips.mine")}</h3>
                      </div>
                      <div className="p-3 space-y-3">
                        {myTrips &&
                          myTripsList
                            .filter((item) => item.status !== "completed")
                            .map((item) => (
                              <MyTripsCard trip={item} key={item.id} />
                            ))}
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-center gap-3 px-4 py-2">
                    <Button variant="outline" disabled={myPage === 1} onClick={() => setMyPage((p) => Math.max(1, p - 1))} aria-label="Prev page">
                      <ChevronLeft />
                    </Button>
                    <span className="text-sm">{myPage}</span>
                    <Button
                      variant="outline"
                      disabled={Array.isArray(myTripsList) && myTripsList.length < MY_PER_PAGE}
                      onClick={() => setMyPage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Floating refresh button */}
      {/* RefreshFab рендерится глобально из MainLayout через портал */}
      {/* Закомментировано: проверка telegram_chat_id после логина */}
      {/* <TelegramConnectModal 
        open={telegramModalOpen} 
        onOpenChange={setTelegramModalOpen}
        onCloseParent={setDialog}
      /> */}
    </div>
  );
}

export default Trips;

// /trips/filter?from_city=Toshkent&to_city=Buxoro
// /trips/filter?from_city=Toshkent&to_city=Buxoro
