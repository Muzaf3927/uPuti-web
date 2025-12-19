import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  Route,
  ChevronDown,
  Phone,
  Users,
  Star,
} from "lucide-react";
import { useI18n } from "@/app/i18n.jsx";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { putData, postData } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, X } from "lucide-react";

function MyTripsCardIntercity({ trip }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Функция для обрезки текста до 20 символов
  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Функция для звонка
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast.error("Номер телефона недоступен");
    }
  };

  // Получаем все bookings (и requested, и in_progress)
  const allBookings = Array.isArray(trip.bookings) ? trip.bookings : [];
  
  // Функции для принятия и отклонения запросов
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
    } catch (err) {
      toast.error("Не удалось принять запрос");
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
    } catch (err) {
      toast.error("Не удалось отклонить запрос");
    }
  };

  // Функция завершения поездки
  const handleComplete = async (e) => {
    e.stopPropagation();
    
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      const response = await putData(`/trips/${trip.id}/completedIntercity`, {});
      // Используем сообщение из ответа API, если есть, иначе стандартное
      const successMessage = response?.message || "Поездка завершена";
      toast.success(successMessage);
      // Обновляем список поездок
      queryClient.invalidateQueries({ queryKey: ["data", "/trips/my"] });
      queryClient.invalidateQueries({ queryKey: ["data"] });
    } catch (err) {
      console.error("Ошибка при завершении поездки:", err);
      const errorMessage = err?.response?.data?.message || "Не удалось завершить поездку";
      toast.error(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card
      onClick={() => setIsExpanded(!isExpanded)}
      className="shadow-lg rounded-3xl bg-card/90 backdrop-blur-sm border w-full cursor-pointer py-0 ring-1 ring-blue-200/60 shadow-[0_10px_30px_rgba(59,130,246,0.15)] dark:bg-card/90"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(79,70,229,0.12))",
      }}
    >
      <CardContent className={`flex flex-col relative ${isExpanded ? 'px-0 py-4 sm:py-5 gap-3' : 'px-2 py-1 gap-1'}`}>
        {/* Expand indicator - всегда справа вверху */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex-shrink-0"
        >
          <ChevronDown 
            className={`text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            size={20}
          />
        </button>
        <div className={`flex items-center gap-2 ${isExpanded ? 'px-4 sm:px-5 flex-col sm:flex-row items-start sm:items-center pr-8 sm:pr-10' : 'flex-row pr-8'}`}>
          <div className={`flex items-center gap-2 min-w-0 flex-1 ${isExpanded ? 'flex-col sm:flex-row w-full sm:w-auto' : 'flex-row'}`}>
            <div className={`flex items-center gap-2 min-w-0 flex-1 ${isExpanded ? 'w-full' : ''}`}>
              <MapPin className="text-primary flex-shrink-0" size={isExpanded ? 14 : 16} />
              <span className={`truncate ${isExpanded ? 'text-xs' : 'text-sm sm:text-lg'} font-bold text-primary`} title={trip.from_city || trip.from_address || ""}>
                {truncateText(trip.from_city || trip.from_address || "", 20)}
              </span>
            </div>
            {!isExpanded && (
              <Route className="text-primary flex-shrink-0" size={16} />
            )}
            <div className={`flex items-center gap-2 min-w-0 flex-1 ${isExpanded ? 'w-full' : ''}`}>
              {isExpanded && (
                <Route className="text-primary flex-shrink-0" size={14} />
              )}
              <span className={`truncate ${isExpanded ? 'text-xs' : 'text-sm sm:text-lg'} font-bold text-primary`} title={trip.to_city || trip.to_address || ""}>
                {truncateText(trip.to_city || trip.to_address || "", 20)}
              </span>
            </div>
          </div>
        </div>
        <div className={`grid grid-cols-2 ${isExpanded ? 'sm:grid-cols-4 gap-2 px-4 sm:px-5' : 'gap-1'} ${isExpanded ? 'text-xs' : 'text-sm'} text-gray-700`}>
          <span className="flex items-center gap-1"><Calendar size={isExpanded ? 14 : 16} className="text-primary" /> {trip.date}</span>
          <span className="flex items-center gap-1"><Clock size={isExpanded ? 14 : 16} className="text-primary" /> {trip.time}</span>
          {isExpanded && (
            <>
              <span className="flex items-center gap-1"><Car size={14} className="text-primary" /> {trip.seats_total || trip.seats || 1} {t("tripsCard.seats")}</span>
              <span className="flex items-center gap-1 font-extrabold text-gray-900 text-xs">{Number(trip.price || trip.amount || 0).toLocaleString()} сум</span>
            </>
          )}
        </div>
        {/* В компактном виде показываем цену справа от даты/времени на мобильном */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-gray-700">
            <span className="inline-flex items-center gap-1 text-gray-700"><Car size={16} className="text-primary" /> {trip.seats_total || trip.seats || 1} {t("tripsCard.seats")}</span>
            <span className="font-extrabold text-gray-900 whitespace-nowrap text-sm">{Number(trip.price || trip.amount || 0).toLocaleString()} сум</span>
          </div>
        )}
        
        {/* Отображение комментария при раскрытии */}
        {isExpanded && (trip.note || trip.comment) && (
          <div className="text-xs sm:text-sm text-gray-700 bg-white rounded-2xl p-3 border mx-4 sm:mx-5">
            {trip.note || trip.comment}
          </div>
        )}

        {/* Раздел со списком пассажиров при раскрытии */}
        {isExpanded && (
          <div className="mt-2 px-4 sm:px-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-xs font-semibold text-gray-900">{t("myTripsCard.passengers")} {allBookings.length > 0 && `(${allBookings.length})`}</h4>
            </div>
            {allBookings.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-3 bg-white/50 rounded-xl border border-dashed">
                {t("myTripsCard.noBookings")}
              </div>
            ) : (
              <div className="space-y-2">
                {allBookings.map((booking) => {
                  const passenger = booking.user || {};
                  const bookingStatus = String(booking.status || "").toLowerCase();
                  const isRequested = bookingStatus === "requested" || bookingStatus === "pending";
                  const isInProgress = bookingStatus === "in_progress" || bookingStatus === "confirmed";
                  
                  return (
                    <div
                      key={booking.id || `booking-${booking.user_id}`}
                      className="flex flex-col gap-2 bg-white rounded-xl p-2 border border-gray-200"
                    >
                      {/* Первый ряд: имя, рейтинг, статус */}
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7 flex-shrink-0">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(passenger.name || "П")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {passenger.name || "Пассажир"}
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
                              handleConfirm(booking.id);
                            }}
                            className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-lg flex items-center gap-1 flex-1"
                          >
                            <CircleCheck className="h-3 w-3" />
                            <span>{t("myTripsCard.accept")}</span>
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecline(booking.id);
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
                              handleCall(passenger.phone);
                            }}
                            className="h-7 px-2 text-[10px] bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 w-full"
                          >
                            <Phone className="h-3 w-3" />
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

        {/* Кнопка "Завершить" при раскрытии */}
        {isExpanded && (
          <div className="px-4 sm:px-5">
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <CircleCheck className="h-3.5 w-3.5" />
              {isCompleting ? "Завершение..." : "Завершить"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MyTripsCardIntercity;

