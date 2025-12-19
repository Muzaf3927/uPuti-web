import React, { useState } from "react";
import { safeLocalStorage } from "@/lib/localStorage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimePicker from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  ChevronDown,
  CircleCheck,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoveRight,
  Pencil,
  Phone,
  Route,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { useGetData } from "@/api/api";
import { usePostData, useDeleteData, postData } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";

function MyTripsCard({ trip, hideActions = false }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { keyboardInset, viewportHeight } = useKeyboardInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Временно закомментирована функциональность оценки пассажиров
  // const [ratePassengersOpen, setRatePassengersOpen] = useState(false);
  // const [ratingValue, setRatingValue] = useState(5);
  // const [ratingComment, setRatingComment] = useState("");
  // const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState(trip.time || "12:00");
  const [costInput, setCostInput] = useState(trip.price ? Number(trip.price).toLocaleString() : "");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    from_city: trip.from_city || "",
    to_city: trip.to_city || "",
    date: trip.date || "",
    time: trip.time || "",
    seats: trip.seats_total ? String(trip.seats_total) : "",
    price: trip.price ? Number(trip.price).toLocaleString() : "",
    note: trip.note || "",
    carModel: trip.carModel || "",
    carColor: trip.carColor || "",
    numberCar: trip.numberCar || "",
  });

  const queryClient = useQueryClient();
  const updateMutation = usePostData(`/trips/${trip.id}`);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Функция валидации формы (как в Trips.jsx)
  const validateForm = (formData) => {
    const errors = {};
    
    if (!form.from_city?.trim()) {
      errors.from = t("trips.form.validation.fromRequired");
    }
    if (!form.to_city?.trim()) {
      errors.to = t("trips.form.validation.toRequired");
    }
    if (!form.date?.trim()) {
      errors.date = t("trips.form.validation.dateRequired");
    }
    if (!selectedTime?.trim()) {
      errors.time = t("trips.form.validation.timeRequired");
    }
    if (!costInput?.trim()) {
      errors.cost = t("trips.form.validation.costRequired");
    }
    if (!form.seats?.trim()) {
      errors.carSeats = t("trips.form.validation.carSeatsRequired");
    }
    if (!form.carModel?.trim()) {
      errors.carModel = t("trips.form.validation.carModelRequired");
    }
    if (!form.carColor?.trim()) {
      errors.carColor = t("trips.form.validation.carColorRequired");
    }
    if (!form.numberCar?.trim()) {
      errors.carNumber = t("trips.form.validation.carNumberRequired");
    }
    
    // Проверка даты и времени
    const selectedDate = form.date;
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Защита от множественных нажатий
    if (isSubmitting) return;
    
    // Валидация формы
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("trips.form.validationError"));
      return;
    }

    // Очищаем ошибки если валидация прошла
    setFormErrors({});
    setIsSubmitting(true);

    try {
      // Очищаем цену от пробелов перед отправкой
      const cleanPrice = costInput ? String(costInput).replace(/\s/g, "") : "";
      
      await updateMutation.mutateAsync({
        from_city: form.from_city,
        to_city: form.to_city,
        date: form.date,
        time: selectedTime,
        seats: Number(form.seats),
        price: cleanPrice ? Number(cleanPrice) : null,
        note: form.note || null,
        carModel: form.carModel,
        carColor: form.carColor,
        numberCar: (form.numberCar || "").toUpperCase(),
      });
      toast.success("Safar yangilandi.");
      setEditOpen(false);
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
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
        toast.error("Yangilashda xatolik.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обновляем selectedTime и costInput при открытии диалога редактирования
  React.useEffect(() => {
    if (editOpen) {
      setSelectedTime(trip.time || "12:00");
      setCostInput(trip.price ? Number(trip.price).toLocaleString() : "");
      setForm({
        from_city: trip.from_city || "",
        to_city: trip.to_city || "",
        date: trip.date || "",
        time: trip.time || "",
        seats: trip.seats_total ? String(trip.seats_total) : "",
        price: trip.price ? Number(trip.price).toLocaleString() : "",
        note: trip.note || "",
        carModel: trip.carModel || "",
        carColor: trip.carColor || "",
        numberCar: trip.numberCar || "",
      });
      setFormErrors({});
    }
  }, [editOpen, trip]);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // Основной DELETE
      // Принудительно используем локальный API для разработки
      const API_BASE = "http://localhost:8000/api";
      // const API_BASE = import.meta.env.VITE_API_BASE || "https://api.uputi.net/api"; // Основной API (закомментирован)
      
      const res = await fetch(API_BASE + `/trips/${trip.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${safeLocalStorage.getItem("token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Safar o'chirildi.");
      setDeleteDialogOpen(false);
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
    } catch (err) {
      toast.error("O'chirishda xatolik.");
    }
  };

  const handleComplete = async () => {
    try {
      await postData(`/trips/${trip.id}/complete`, {});
      toast.success(t("myTripsCard.completeToast"));
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
      
      // Временно закомментирована функциональность оценки пассажиров
      // if (confirmedBookings.length > 0) {
      //   setRatePassengersOpen(true);
      // }
    } catch (err) {
      console.error("Ошибка при завершении поездки:", err);
      toast.error(t("myTripsCard.completeError"));
    }
  };

  // Временно закомментированы функции для оценки пассажиров
  // const handleRatePassenger = async () => {
  //   const currentPassenger = confirmedBookings[currentPassengerIndex];
  //   if (!currentPassenger) return;

  //   try {
  //     await postData(`/ratings/${trip.id}/to/${currentPassenger.user?.id}`, {
  //       rating: ratingValue,
  //       comment: ratingComment || null,
  //     });

  //     // Переходим к следующему пассажиру или закрываем диалог
  //     if (currentPassengerIndex < confirmedBookings.length - 1) {
  //       setCurrentPassengerIndex(currentPassengerIndex + 1);
  //       setRatingValue(5);
  //       setRatingComment("");
  //     } else {
  //       setRatePassengersOpen(false);
  //       setCurrentPassengerIndex(0);
  //       setRatingValue(5);
  //       setRatingComment("");
  //       toast.success(t("history.ratingSubmitted"));
  //     }
  //   } catch (err) {
  //     toast.error("Ошибка при отправке оценки");
  //   }
  // };

  // const handleSkipRating = () => {
  //   // Переходим к следующему пассажиру или закрываем диалог
  //   if (currentPassengerIndex < confirmedBookings.length - 1) {
  //     setCurrentPassengerIndex(currentPassengerIndex + 1);
  //     setRatingValue(5);
  //     setRatingComment("");
  //   } else {
  //     setRatePassengersOpen(false);
  //     setCurrentPassengerIndex(0);
  //     setRatingValue(5);
  //     setRatingComment("");
  //   }
  // };

  // Используем данные пассажиров из trip.bookings (приходят с /trips/my API)
  // Формат: trip.bookings - массив бронирований с полями id, user_id, seats, offered_price, status, user
  const allBookings = React.useMemo(() => {
    // Проверяем разные возможные форматы данных
    if (Array.isArray(trip.bookings)) {
      return trip.bookings;
    }
    
    // Если bookings не массив, проверяем другие возможные поля
    if (trip.pending_passengers || trip.confirmed_passengers) {
      return [...(trip.pending_passengers || []), ...(trip.confirmed_passengers || [])];
    }
    
    return [];
  }, [trip.bookings, trip.pending_passengers, trip.confirmed_passengers]);
  
  // pendingRequests - запросы со статусом requested/pending
  // Показываем все запросы, которые еще не приняты
  const pendingRequests = allBookings.filter(
    (booking) => {
      const status = booking.status || booking.booking_status || "";
      return status === "requested" || status === "pending";
    }
  );
  
  // confirmedBookings - только брони со статусом in_progress/confirmed
  // Показываем принятые бронирования
  const confirmedBookings = allBookings.filter(
    (booking) => {
      const status = booking.status || booking.booking_status || "";
      return status === "in_progress" || status === "confirmed";
    }
  );
  
  const tripBookingsLoading = false; // Данные уже загружены с trip
  const tripBookingsError = null;

  const handleConfirm = async (bookingId) => {
    try {
      await postData(`/bookings/${bookingId}/accept`, {});
      toast.success(t("myTripsCard.acceptedToast"));
      // Инвалидируем и сразу обновляем все запросы связанные с поездками
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const url = query.queryKey[1];
          return typeof url === "string" && url.includes("/trips/my");
        }
      });
      // Принудительно обновляем данные
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const url = query.queryKey[1];
          return typeof url === "string" && url.includes("/trips/my");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
    } catch (e) {
      toast.error(t("requests.acceptError"));
    }
  };
  const handleDecline = async (bookingId) => {
    try {
      await postData(`/bookings/${bookingId}/delete`, {});
      toast.success(t("myTripsCard.declinedToast"));
      // Инвалидируем и сразу обновляем все запросы связанные с поездками
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const url = query.queryKey[1];
          return typeof url === "string" && url.includes("/trips/my");
        }
      });
      // Принудительно обновляем данные
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const url = query.queryKey[1];
          return typeof url === "string" && url.includes("/trips/my");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
    } catch (e) {
      toast.error(t("requests.declineError"));
    }
  };

  // Функции для звонков и чата
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast.error("Telefon raqami mavjud emas");
    }
  };

  const handleChat = (passengerId, passengerName) => {
    // Закрываем диалог бронирований
    setBookingsOpen(false);
    // Переходим на страницу чатов с конкретным пассажиром
    // Используем receiverId вместо user, так как Chats.jsx ожидает receiverId
    navigate(`/chats?receiverId=${passengerId}&tripId=${trip.id}`);
  };

  // По умолчанию карточки закрыты на всех устройствах
  React.useEffect(() => {
    setIsExpanded(false);
  }, []);

  return (
    <Card
      onClick={() => setIsExpanded((v) => !v)}
      className="shadow-lg rounded-3xl bg-card/90 backdrop-blur-sm border w-full cursor-pointer py-0 ring-1 ring-blue-200/60 shadow-[0_10px_30px_rgba(59,130,246,0.15)] dark:bg-card/90"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(79,70,229,0.12))",
      }}
    >
      <CardContent className={`flex flex-col ${isExpanded ? 'p-4 sm:p-5 gap-3 pb-0' : 'px-2 py-1 gap-1'}`}>
        <div className="flex items-center justify-between gap-2 text-primary font-bold text-sm sm:text-lg">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="text-primary" />
            <span className="truncate max-w-[70vw] sm:max-w-none">{trip.from_city}</span>
            <Route className="text-primary" />
            <span className="truncate max-w-[70vw] sm:max-w-none">{trip.to_city}</span>
          </div>
          {/* Expand indicator */}
          <ChevronDown 
            className={`text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            size={20}
          />
        </div>
        <div className={`grid grid-cols-2 ${isExpanded ? 'sm:grid-cols-4 gap-3' : 'gap-1'} text-sm text-gray-700`}>
          <span className="flex items-center gap-1"><Calendar size={16} className="text-primary" /> {trip.date}</span>
          <span className="flex items-center gap-1"><Clock size={16} className="text-primary" /> {trip.time}</span>
          {isExpanded && (
            <>
              <span className="flex items-center gap-1"><Users size={16} /> {trip.seats_total} {t("tripsCard.seats")}</span>
              <span className="flex items-center gap-1"><Car size={16} className="text-primary" /> {trip.carModel}</span>
            </>
          )}
        </div>
        {/* В компактном виде показываем модель авто справа от даты/времени на мобильном */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-gray-700">
            <span className="inline-flex items-center gap-1 text-gray-700"><Car size={16} className="text-primary" /> {trip.carModel || ""}</span>
            <span className="font-extrabold text-gray-900 whitespace-nowrap text-sm">{Number(trip.price).toLocaleString()} сум</span>
          </div>
        )}
        
        {/* Отображение комментария при раскрытии */}
        {isExpanded && trip.note && (
          <div className="text-xs sm:text-sm text-gray-700 bg-white rounded-2xl p-3 border">
            {trip.note}
          </div>
        )}
        
        {/* Раздел "Пассажиры" - показываем всех пассажиров из bookings */}
        {isExpanded && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-primary" />
              <span className="font-semibold text-sm text-gray-900">
                {t("myTripsCard.passengers")} 
                {allBookings.length > 0 && ` (${allBookings.length})`}
              </span>
            </div>
            {allBookings.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-2">
                {t("myTripsCard.noBookings")}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {allBookings.map((booking, index) => {
                  // Используем index как key, если id отсутствует
                  const bookingKey = booking?.id || `booking-${index}`;
                  const passenger = booking?.user || {};
                  const bookingStatus = String(booking?.status || booking?.booking_status || "").toLowerCase();
                  const isRequested = bookingStatus === "requested" || bookingStatus === "pending";
                  const isInProgress = bookingStatus === "in_progress" || bookingStatus === "confirmed";
                  
                  // Если booking отсутствует, все равно отображаем пустой блок для отладки
                  if (!booking) {
                    return (
                      <div key={bookingKey} className="p-2 bg-red-100 rounded-lg border border-red-300">
                        <span className="text-xs text-red-700">Ошибка: booking отсутствует (index {index})</span>
                      </div>
                    );
                  }
                
                  return (
                  <div
                    key={bookingKey}
                    className="flex flex-col gap-2 p-2 bg-white/70 rounded-lg border border-gray-200"
                  >
                    {/* Первый ряд: имя, рейтинг, статус */}
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 ring-1 ring-white shadow-sm">
                        <AvatarFallback className="font-semibold text-[10px]">
                          {getInitials(passenger?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="font-medium text-xs text-gray-900 truncate">
                          {passenger?.name || "Foydalanuvchi"}
                        </span>
                        {passenger?.rating && (
                          <div className="flex items-center gap-0.5 bg-yellow-100 px-1 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-[9px] font-medium text-yellow-700">{passenger.rating}</span>
                          </div>
                        )}
                        {isRequested && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                            {t("booking.status.requested")}
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                            {t("booking.status.accepted")}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Второй ряд: количество мест и предложенная сумма */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      <span>{booking.seats} {t("tripsCard.seats")}</span>
                      {booking.offered_price && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                          {Number(booking.offered_price).toLocaleString()} сум
                        </span>
                      )}
                    </div>
                    
                    {/* Кнопки снизу (только для requested) */}
                    {isRequested && (
                      <div className="flex gap-1.5 pt-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (booking.id) handleConfirm(booking.id);
                          }}
                          className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-lg flex items-center gap-1 flex-1"
                        >
                          <CircleCheck className="h-3 w-3" />
                          <span>{t("myTripsCard.accept")}</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (booking.id) handleDecline(booking.id);
                          }}
                          variant="outline"
                          className="h-7 px-2 text-[10px] border-2 border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100 font-medium rounded-lg flex items-center gap-1 flex-1"
                        >
                          <X className="h-3 w-3" />
                          <span>{t("myTripsCard.decline")}</span>
                        </Button>
                      </div>
                    )}
                    
                    {/* Кнопка "Позвонить" для in_progress */}
                    {isInProgress && (
                      <div className="pt-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(passenger?.phone);
                          }}
                          className="h-7 px-2 text-[10px] bg-primary text-primary-foreground hover:brightness-110 flex items-center gap-1 w-full"
                        >
                          <Phone size={10} />
                          <span>{t("myTripsCard.callPassenger")}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {isExpanded && !hideActions && (
      <CardFooter className="w-full pt-0" onClick={(e) => e.stopPropagation()}>
        {/* В развернутом виде добавим строку с номером авто */}
        <div className="w-full hidden sm:block">
          <span className="inline-flex items-center gap-1 border rounded-md px-2 py-0.5">{trip.numberCar || "Bo'sh"}</span>
        </div>
        {/* Mobile layout ≤ 640px: grid 3 text buttons above, 2 icon buttons on right below */}
        <div className="w-full sm:hidden">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 border rounded-md px-2 py-0.5">{trip.numberCar || "Bo'sh"}</span>
            <span className="font-extrabold text-gray-900 whitespace-nowrap text-sm">{Number(trip.price).toLocaleString()} сум</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Button onClick={() => setRequestsOpen(true)} className="min-h-9 px-2 py-2 rounded-full bg-primary text-primary-foreground text-[10px] leading-tight flex items-center gap-1 justify-center whitespace-normal text-center">
              <Mail className="size-4" />
              <span>{t("myTripsCard.requests")}</span>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
            <Button onClick={() => setBookingsOpen(true)} className="min-h-9 px-2 py-2 rounded-full bg-secondary text-secondary-foreground text-[10px] leading-tight flex items-center gap-1 justify-center whitespace-normal text-center">
              <CircleCheck className="size-4" />
              <span>{t("myTripsCard.bookings")}</span>
              {confirmedBookings.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {confirmedBookings.length}
                </span>
              )}
            </Button>
            <Button onClick={handleComplete} className="min-h-9 px-2 py-2 rounded-full bg-destructive hover:brightness-110 text-white text-[10px] leading-tight flex items-center gap-1 justify-center whitespace-normal text-center col-span-2">
              <CircleCheck className="size-4" />
              <span>{t("myTripsCard.complete")}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={() => setEditOpen(true)} className="h-9 w-9 rounded-full bg-white border hover:bg-accent/40 flex items-center justify-center" aria-label={t("myTripsCard.edit")} title={t("myTripsCard.edit")}>
              <Pencil className="size-5 text-gray-700" />
            </Button>
            <Button onClick={handleDelete} className="h-9 w-9 rounded-full bg-white border border-destructive/40 text-destructive hover:bg-red-50 flex items-center justify-center" aria-label={t("myTripsCard.delete")} title={t("myTripsCard.delete")}>
              <Trash2 className="size-5" />
            </Button>
          </div>
        </div>
        {/* Desktop ≥ 640px: previous inline layout */}
        <div className="w-full hidden sm:flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Цена для больших экранов */}
            <span className="font-extrabold text-gray-900 whitespace-nowrap text-sm mr-4">
              {Number(trip.price).toLocaleString()} сум
            </span>
            <Button onClick={() => setRequestsOpen(true)} className="h-10 px-3 rounded-full bg-primary text-primary-foreground hover:brightness-110 flex items-center gap-2 text-sm sm:text-base relative">
              <Mail className="size-4" />
              <span className="text-sm">{t("myTripsCard.requests")}</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
            <Button onClick={() => setBookingsOpen(true)} className="h-10 px-3 rounded-full bg-secondary text-secondary-foreground hover:brightness-110 flex items-center gap-2 text-sm sm:text-base relative">
              <CircleCheck className="size-4" />
              <span className="text-sm">{t("myTripsCard.bookings")}</span>
              {confirmedBookings.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {confirmedBookings.length}
                </span>
              )}
            </Button>
            <Button onClick={handleComplete} className="h-10 px-3 rounded-full bg-destructive text-white hover:brightness-110 flex items-center gap-2 text-sm sm:text-base">
              <CircleCheck className="size-4" />
              <span className="text-sm">{t("myTripsCard.complete")}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={() => setEditOpen(true)} className="h-10 w-10 rounded-full bg-white border hover:bg-gray-50 flex items-center justify-center" aria-label={t("myTripsCard.edit")} title={t("myTripsCard.edit")}>
              <Pencil className="size-5 text-gray-700" />
            </Button>
            <Button onClick={handleDelete} className="h-10 w-10 rounded-full bg-white border border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center" aria-label={t("myTripsCard.delete")} title={t("myTripsCard.delete")}>
              <Trash2 className="size-5" />
            </Button>
          </div>
        </div>
      </CardFooter>
      )}

      {/* Edit Dialog */}
      {!hideActions && (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-[760px] p-4 sm:p-6 overflow-hidden overscroll-contain touch-pan-y rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-[calc(100svh-2rem)]"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
          preventOutsideClose
          showCloseButton={false}
          autoFocusScroll
        >
          <DialogHeader className="relative">
            <DialogTitle className="text-center text-primary font-bold pr-8">{t("myTripsCard.edit")}</DialogTitle>
            <DialogDescription className="sr-only">Edit trip dialog</DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-6 w-6 p-0 hover:bg-accent/50 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 overflow-y-auto overflow-x-hidden pr-1 touch-pan-y overscroll-contain max-h-[60svh]"
                 onTouchMove={(e) => e.stopPropagation()}
            >
            <div className="col-span-1 sm:col-span-1 grid items-center gap-1.5">
              <Label htmlFor="from">{t("trips.form.from")} *</Label>
              <Input 
                type="text" 
                id="from" 
                name="from_city" 
                placeholder={t("trips.form.fromPlaceholder")} 
                required
                value={form.from_city}
                onChange={handleChange}
                className={`${formErrors.from ? "border-red-500" : ""} bg-white`}
              />
              {formErrors.from && <span className="text-red-500 text-xs">{formErrors.from}</span>}
            </div>
            <div className="col-span-1 sm:col-span-1 grid items-center gap-1.5">
              <Label htmlFor="to">{t("trips.form.to")} *</Label>
              <Input 
                type="text" 
                id="to" 
                name="to_city" 
                placeholder={t("trips.form.toPlaceholder")} 
                required
                value={form.to_city}
                onChange={handleChange}
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
                  value={form.date}
                  onChange={handleChange}
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
                  name="seats" 
                  placeholder={t("trips.form.carSeatsPlaceholder")} 
                  required
                  value={form.seats}
                  onChange={handleChange}
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
                value={form.carModel}
                onChange={handleChange}
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
                  value={form.carColor}
                  onChange={handleChange}
                  className={`${formErrors.carColor ? "border-red-500" : ""} bg-white`}
                />
                {formErrors.carColor && <span className="text-red-500 text-xs">{formErrors.carColor}</span>}
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="carNumber">{t("trips.form.carNumber")} *</Label>
                <Input
                  type="text" 
                  id="carNumber" 
                  name="numberCar" 
                  placeholder={t("trips.form.carNumberPlaceholder")} 
                  className={`uppercase ${formErrors.carNumber ? "border-red-500" : ""} bg-white`}
                  required
                  value={form.numberCar}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                />
                {formErrors.carNumber && <span className="text-red-500 text-xs">{formErrors.carNumber}</span>}
              </div>
            </div>
            <div className="col-span-1 grid items-center gap-1.5">
              <Label htmlFor="note">{t("trips.form.note")}</Label>
              <Input type="text" id="note" name="note" placeholder={t("trips.commentPlaceholder")} value={form.note} onChange={handleChange} className="bg-white" />
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
                  t("profilePage.save")
                )}
              </Button>
            </div>
            
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* Requests Dialog */}
      {!hideActions && (
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden rounded-2xl">
          <DialogHeader className="pb-2 relative">
            <DialogTitle className="text-base sm:text-lg">
              {t("myTripsCard.requests")} ({pendingRequests.length})
            </DialogTitle>
            <DialogDescription className="sr-only">Requests list dialog</DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-accent/50 rounded-full"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {tripBookingsLoading ? (
              <div className="text-center py-3 text-sm">{t("myTripsCard.loading")}</div>
            ) : tripBookingsError ? (
              <div className="text-red-600 text-center py-3 text-sm">Xatolik: {tripBookingsError.message}</div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm">{t("myTripsCard.noRequests")}</p>
              </div>
            ) : (
              pendingRequests.map((booking) => {
                const passenger = booking.user || {};
                
                return (
                <div
                  key={booking.id}
                  className="border border-blue-200 rounded-xl p-2.5 sm:p-3 shadow-[0_6px_18px_rgba(59,130,246,0.12)] ring-1 ring-blue-200/60 hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                  style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8 sm:size-10 ring-1 ring-white shadow-sm">
                      <AvatarFallback className="font-semibold text-xs">
                        {getInitials(passenger?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Имя и статус */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {passenger?.name || "Foydalanuvchi"}
                        </h3>
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          {t("booking.status.requested")}
                        </span>
                      </div>
                      
                      {/* Детали запроса - места и предложенная цена */}
                      <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-2.5 h-2.5 text-blue-600" />
                          <span className="font-medium text-gray-700">{booking.seats} {t("tripsCard.seats")}</span>
                        </div>
                        {booking.offered_price && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            {t("booking.offeredPrice")}: {Number(booking.offered_price).toLocaleString()} сум
                          </span>
                        )}
                      </div>
                      
                      {/* Комментарий */}
                      {booking.comment && (
                        <div className="text-xs text-gray-500 mb-2 italic">
                          "{booking.comment}"
                        </div>
                      )}
                      
                      {/* Кнопки действий - Принять и Отказать */}
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleConfirm(booking.id)}
                          className="flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:brightness-110 text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex-1"
                        >
                          <CircleCheck className="w-3.5 h-3.5" />
                          <span>{t("myTripsCard.accept")}</span>
                        </Button>
                        <Button
                          onClick={() => handleDecline(booking.id)}
                          variant="outline"
                          className="flex items-center justify-center gap-1 border-red-600 text-red-600 hover:bg-red-50 text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t("myTripsCard.decline")}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Bookings Dialog */}
      {!hideActions && (
      <Dialog open={bookingsOpen} onOpenChange={setBookingsOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden rounded-2xl">
          <DialogHeader className="pb-2 relative">
            <DialogTitle className="text-base sm:text-lg">
              {t("myTripsCard.bookings")} ({confirmedBookings.length})
            </DialogTitle>
            <DialogDescription className="sr-only">Bookings list dialog</DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-accent/50 rounded-full"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {tripBookingsLoading ? (
              <div className="text-center py-3 text-sm">{t("myTripsCard.loading")}</div>
            ) : tripBookingsError ? (
              <div className="text-red-600 text-center py-3 text-sm">Xatolik: {tripBookingsError.message}</div>
            ) : confirmedBookings.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm">{t("myTripsCard.noBookings")}</p>
              </div>
            ) : (
              confirmedBookings.map((booking) => {
                const passenger = booking.user || {};
                
                return (
                <div
                  key={booking.id}
                  className="border border-blue-200 rounded-xl p-2.5 sm:p-3 shadow-[0_6px_18px_rgba(59,130,246,0.12)] ring-1 ring-blue-200/60 hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                  style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar className="size-8 sm:size-10 ring-1 ring-white shadow-sm mt-0.5">
                      <AvatarFallback className="font-semibold text-xs">
                        {getInitials(passenger?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Имя и рейтинг */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {passenger?.name || "Foydalanuvchi"}
                        </h3>
                        {passenger?.rating && (
                          <div className="flex items-center gap-0.5 bg-yellow-100 px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-700">{passenger.rating}</span>
                          </div>
                        )}
                        {/* Статус - принято */}
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                          {t("booking.status.accepted")}
                        </span>
                      </div>
                      
                      {/* Номер телефона */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Phone className="w-2.5 h-2.5 text-primary" />
                        <span className="text-xs font-medium text-gray-700">{passenger?.phone}</span>
                      </div>
                      
                      {/* Места и предложенная цена */}
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-2.5 h-2.5 text-blue-600" />
                          <span className="font-medium text-gray-700">{booking.seats} {t("tripsCard.seats")}</span>
                        </div>
                        {booking.offered_price && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            {t("booking.offeredPrice")}: {Number(booking.offered_price).toLocaleString()} сум
                          </span>
                        )}
                      </div>
                      
                      {/* Кнопки действий - только "Позвонить" для in_progress */}
                      <div className="flex gap-2 -ml-8">
                        <Button
                          onClick={() => handleCall(passenger?.phone)}
                          className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:brightness-110 text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all w-full"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t("myTripsCard.callPassenger")}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {!hideActions && (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t("myTripsCard.confirmDelete")}
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              {t("myTripsCard.confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 rounded-2xl"
            >
              {t("trips.form.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="flex-1 rounded-2xl"
            >
              {t("myTripsCard.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Временно закомментирован диалог для оценки пассажиров */}
      {/* <Dialog open={ratePassengersOpen} onOpenChange={setRatePassengersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("history.ratingTitle")} ({currentPassengerIndex + 1}/{confirmedBookings.length})
            </DialogTitle>
          </DialogHeader>
          
          {confirmedBookings[currentPassengerIndex] && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="size-10">
                  <AvatarFallback>
                    {getInitials(confirmedBookings[currentPassengerIndex].user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {confirmedBookings[currentPassengerIndex].user?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {confirmedBookings[currentPassengerIndex].user?.phone}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingValue
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratingComment">
                  {t("history.ratingComment")}
                </Label>
                <Textarea
                  id="ratingComment"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder={t("history.ratingComment")}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSkipRating}
                  variant="outline"
                  className="flex-1"
                >
                  {currentPassengerIndex < confirmedBookings.length - 1 ? t("history.skip") : t("history.finish")}
                </Button>
                <Button
                  onClick={handleRatePassenger}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {currentPassengerIndex < confirmedBookings.length - 1 ? t("history.next") : t("history.finish")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog> */}
    </Card>
  );
}

export default MyTripsCard;
