import React, { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  Calendar,
  Car,
  ChevronDown,
  Clock,
  MapPin,
  MoveRight,
  Phone,
  Route,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDeleteData, usePostData, postData, useGetData } from "@/api/api";
import { useI18n } from "@/app/i18n.jsx";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import TelegramConnectModal from "@/components/TelegramConnectModal.jsx";
import { sessionManager } from "@/lib/sessionManager.js";

function TripsCard({ trip }) {
  const { t } = useI18n();
  const { keyboardInset, viewportHeight } = useKeyboardInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [seats, setSeats] = useState("1");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [comment, setComment] = useState("");
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  
  // Получаем данные пользователя для проверки telegram_chat_id
  const { data: userData, refetch: refetchUser } = useGetData("/user");
  const shouldStackCities = React.useMemo(() => {
    const fromLength = trip?.from_city?.length ?? 0;
    const toLength = trip?.to_city?.length ?? 0;
    return fromLength > 18 || toLength > 18 || fromLength + toLength > 30;
  }, [trip?.from_city, trip?.to_city]);
  const driverPhone = React.useMemo(() => {
    if (!trip?.driver?.phone) return null;
    const raw = String(trip.driver.phone);
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("998") ? `+${raw}` : `+998${raw}`;
  }, [trip?.driver?.phone]);

  const queryClient = useQueryClient();
  const tripPostMutation = usePostData(`/trips/${trip?.id}/booking`);

  // По умолчанию карточки закрыты на всех устройствах
  React.useEffect(() => {
    setIsExpanded(false);
  }, []);


  const openBookingDialog = async (e) => {
    e.stopPropagation();
    setSeats("1");
    setBookingDialogOpen(true);
    // Сразу отправляем запрос на бэкенд для проверки telegram_chat_id
    try {
      const result = await refetchUser();
      const updatedUser = result?.data || userData || sessionManager.getUserData();
      // Показываем модальное окно Telegram сразу, если telegram_chat_id отсутствует
      if (updatedUser && !updatedUser.telegram_chat_id) {
        setTelegramModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to refetch user data:", error);
      // В случае ошибки проверяем из кэша
      const user = userData || sessionManager.getUserData();
      if (user && !user.telegram_chat_id) {
        setTelegramModalOpen(true);
      }
    }
  };
  const openOfferDialog = async (e) => {
    e.stopPropagation();
    setSeats("1");
    setOfferedPrice("");
    setComment("");
    setOfferDialogOpen(true);
    // Сразу отправляем запрос на бэкенд для проверки telegram_chat_id
    try {
      const result = await refetchUser();
      const updatedUser = result?.data || userData || sessionManager.getUserData();
      // Показываем модальное окно Telegram сразу, если telegram_chat_id отсутствует
      if (updatedUser && !updatedUser.telegram_chat_id) {
        setTelegramModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to refetch user data:", error);
      // В случае ошибки проверяем из кэша
      const user = userData || sessionManager.getUserData();
      if (user && !user.telegram_chat_id) {
        setTelegramModalOpen(true);
      }
    }
  };
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!seats || Number(seats) < 1 || Number(seats) > 4) {
      const errorMessage = t("tripsCard.validation.seatsRange");
      toast.error(errorMessage);
      return;
    }
    setPendingRequest({ type: 'booking', data: { seats: Number(seats) } });
    setBookingDialogOpen(false);
    setConfirmationDialogOpen(true);
  };
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!seats || Number(seats) < 1 || Number(seats) > 4) {
      const errorMessage = t("tripsCard.validation.seatsRange");
      toast.error(errorMessage);
      return;
    }
    const offeredDigits = String(offeredPrice).replace(/\s/g, "");
    if (!offeredDigits || Number(offeredDigits) < 0) {
      const errorMessage = t("tripsCard.validation.priceRequired");
      toast.error(errorMessage);
      return;
    }
    setPendingRequest({ 
      type: 'offer', 
      data: {
        seats: Number(seats),
        offered_price: Number(offeredDigits),
        comment: comment || null,
      }
    });
    setOfferDialogOpen(false);
    setConfirmationDialogOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!pendingRequest) return;
    
    try {
      await tripPostMutation.mutateAsync(pendingRequest.data);
      const successMessage = pendingRequest.type === 'booking' 
        ? t("tripsCard.success.bookingCreated") 
        : t("tripsCard.success.offerSent");
      toast.success(successMessage);
      setConfirmationDialogOpen(false);
      setPendingRequest(null);
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
    } catch (err) {
      console.error("Booking/Offer error:", err);
      
      let errorMessage = "";
      if (err.response?.status === 401) {
        errorMessage = t("tripsCard.errors.unauthorized");
      } else if (err.response?.status === 403) {
        errorMessage = t("tripsCard.errors.forbidden");
      } else if (err.response?.status === 422) {
        errorMessage = t("tripsCard.errors.validation");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = pendingRequest.type === 'booking' 
          ? t("tripsCard.errors.bookingFailed") 
          : t("tripsCard.errors.offerFailed");
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCancelRequest = () => {
    setConfirmationDialogOpen(false);
    setPendingRequest(null);
  };

  const handleCancelBooking = async (e) => {
    e.stopPropagation();
    try {
      if (!trip?.my_booking?.id) return;
      await postData(`/bookings/${trip.my_booking.id}/cancel`);
      toast.success(t("tripsCard.success.bookingCancelled"));
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
    } catch (err) {
      console.error("Cancel booking error:", err);
      
      let errorMessage = "";
      if (err.response?.status === 401) {
        errorMessage = t("tripsCard.errors.unauthorized");
      } else if (err.response?.status === 403) {
        errorMessage = t("tripsCard.errors.forbidden");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = t("tripsCard.errors.cancelFailed");
      }
      
      toast.error(errorMessage);
    }
  };
  const handleClickPrice = (e) => {
    e.stopPropagation();

    const result = {
      seats: 1,
      offered_price: 5000,
      comment: "boshqa pulim yuq",
    };
  };

  return (
    <>
      <Card
        onClick={() => setIsExpanded((v) => !v)}
        className="shadow-lg rounded-3xl bg-card/90 backdrop-blur-sm cursor-pointer border py-0 ring-1 ring-blue-200/60 shadow-[0_10px_30px_rgba(59,130,246,0.15)] dark:bg-card/90"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(79,70,229,0.12))",
        }}
      >
        <CardContent className={`flex flex-col ${isExpanded ? 'p-3 sm:p-4 gap-2' : 'px-2 py-1 gap-1'}`}>
          <div className="flex items-center justify-between gap-2 text-primary font-bold text-sm sm:text-lg">
            <div
              className={`flex items-center gap-2 min-w-0 ${
                shouldStackCities ? "flex-wrap" : "flex-nowrap"
              }`}
            >
              <MapPin className="text-primary self-start" />
              <span
                className={`whitespace-normal break-words ${
                  shouldStackCities ? "basis-full max-w-full" : "max-w-[60vw] sm:max-w-none"
                }`}
              >
                {trip.from_city}
              </span>
              <Route className="text-primary self-start" />
              <span
                className={`whitespace-normal break-words ${
                  shouldStackCities ? "basis-full max-w-full" : "max-w-[60vw] sm:max-w-none"
                }`}
              >
                {trip.to_city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Price near route on desktop */}
              <span className="hidden sm:inline-block font-extrabold text-gray-900 whitespace-nowrap text-lg">
                {Number(trip.price).toLocaleString()} сум
              </span>
              {/* Expand indicator */}
              <ChevronDown 
                className={`text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
                size={20}
              />
            </div>
          </div>

          {/* Компактный блок: только дата, время и цена (на мобиле цена справа ниже) */}
          <div className={`grid grid-cols-2 ${isExpanded ? 'sm:grid-cols-4 gap-2 sm:gap-3' : 'gap-1'} text-sm`}>
            <div className="flex items-center gap-1 text-gray-700">
              <Calendar size={16} className="text-primary" /> {trip.date}
            </div>
            <div className="flex items-center gap-1 text-gray-700">
              <Clock size={16} className="text-primary" /> {trip.time}
            </div>
            {isExpanded && (
              <>
                <div className="flex items-center gap-1 text-gray-700">
                  <Users size={16} /> {trip.seats} {t("tripsCard.seats")}
                </div>
                <div className="flex items-center gap-1 text-gray-700">
                  <Car size={16} className="text-primary" /> {trip.carModel}
                </div>
              </>
            )}
            <div className="col-span-2 sm:col-span-2 flex items-center justify-between text-gray-700">
              {isExpanded ? (
                <span className="inline-flex items-center gap-1 border rounded-md px-2 py-0.5">{trip.numberCar || "Bo'sh"}</span>
              ) : (
                <span className="inline-flex items-center gap-1 sm:hidden text-gray-700">
                  <Car size={16} className="text-primary" /> {trip.carModel || ""}
                </span>
              )}
              <div className="flex sm:hidden items-center gap-2">
                <span className="font-extrabold text-gray-900 whitespace-nowrap text-sm">{Number(trip.price).toLocaleString()} сум</span>
              </div>
              <span className="hidden sm:inline-block" />
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="flex items-center gap-3">
                <Link to={`/user/${trip?.driver?.id}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className="size-9 ring-2 ring-white shadow">
                    <AvatarFallback>{getInitials(trip.driver?.name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span className="font-medium truncate max-w-[150px] sm:max-w-[220px]">{trip.driver.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">⭐ {trip.driver.rating}</span>
                </div>
              </div>
          <div className="flex items-center gap-2 text-sm text-gray-800">
            <Phone size={16} className="text-primary" />
            <span className="font-medium text-gray-600">{t("tripsCard.phoneLabel")}:</span>
            {driverPhone ? (
              <a
                href={`tel:${driverPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary underline decoration-primary/30 underline-offset-4"
              >
                {driverPhone}
              </a>
            ) : (
              <span className="text-gray-500">{t("tripsCard.phoneNotAvailable")}</span>
            )}
          </div>

              {trip.note ? (
                <div className="text-xs sm:text-sm text-gray-700 bg-white rounded-2xl p-3 border">
                  {trip.note}
                </div>
              ) : null}

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {trip?.my_booking ? (
                  <button
                    onClick={handleCancelBooking}
                    disabled={trip?.my_booking?.can_cancel === false}
                    className="bg-destructive disabled:bg-gray-300 disabled:text-gray-500 h-9 text-sm rounded-2xl text-white w-full"
                  >
                    {t("tripsCard.cancel")}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={openBookingDialog}
                      className="bg-primary h-9 rounded-2xl text-primary-foreground w-full text-xs sm:text-base px-2 whitespace-normal leading-tight"
                    >
                      {t("tripsCard.book")}
                    </button>
                    <button
                      onClick={openOfferDialog}
                      className="w-full bg-white h-9 border border-primary text-primary rounded-2xl text-xs sm:text-base px-2 whitespace-normal leading-tight"
                    >
                      {t("tripsCard.offer")}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="p-0 rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-w-[400px] w-[90vw] max-h-[calc(100svh-2rem)] overflow-y-auto"
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))' }}
        >
          <div className="rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold mb-4">{t("tripsCard.bookingTitle")}</DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600 mb-4">
                {t("tripsCard.bookingDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3">
                <Label className="text-sm font-medium">{t("tripsCard.seatsLabel")}</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => setSeats(Math.max(1, Number(seats) - 1))}
                    className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300 flex items-center justify-center"
                    disabled={Number(seats) <= 1}
                  >
                    <span className="text-sm font-bold text-gray-700">-</span>
                  </Button>
                  <div className="min-w-[40px] text-center">
                    <span className="text-sm font-medium text-gray-900">{seats}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setSeats(Math.min(4, Number(seats) + 1))}
                    className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300 flex items-center justify-center"
                    disabled={Number(seats) >= 4}
                  >
                    <span className="text-sm font-bold text-gray-700">+</span>
                  </Button>
                </div>
              </div>
              <div className="w-full flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="w-1/2 rounded-2xl">
                    {t("tripsCard.cancelButton")}
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-1/2 bg-primary text-primary-foreground rounded-2xl">
                  {t("tripsCard.submitBooking")}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="p-0 rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-w-[400px] w-[90vw] max-h-[calc(100svh-2rem)] overflow-y-auto"
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))' }}
        >
          <div className="rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold mb-4">{t("tripsCard.offerTitle")}</DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600 mb-4">
                {t("tripsCard.offerDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 overscroll-contain touch-pan-y">
            <form id="offerForm" onSubmit={handleSubmitOffer} className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <Label className="text-sm font-medium">{t("tripsCard.seatsLabel")}</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => setSeats(Math.max(1, Number(seats) - 1))}
                  className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300 flex items-center justify-center"
                  disabled={Number(seats) <= 1}
                >
                  <span className="text-sm font-bold text-gray-700">-</span>
                </Button>
                <div className="min-w-[40px] text-center">
                  <span className="text-sm font-medium text-gray-900">{seats}</span>
                </div>
                <Button
                  type="button"
                  onClick={() => setSeats(Math.min(4, Number(seats) + 1))}
                  className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300 flex items-center justify-center"
                  disabled={Number(seats) >= 4}
                >
                  <span className="text-sm font-bold text-gray-700">+</span>
                </Button>
              </div>
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="price" className="text-sm font-medium">{t("tripsCard.priceLabel")}</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  value={offeredPrice}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                    setOfferedPrice(formatted);
                  }}
                  placeholder="100 000"
                  className="pr-16 text-center bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">сум</span>
              </div>
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="comment" className="text-sm font-medium">{t("tripsCard.commentLabel")}</Label>
              <Input
                id="comment"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("tripsCard.commentPlaceholder")}
                className="bg-white"
              />
            </div>
          </form>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-1/2 rounded-2xl">
                  {t("tripsCard.cancelButton")}
                </Button>
              </DialogClose>
              <Button type="submit" form="offerForm" className="w-1/2 bg-primary text-primary-foreground rounded-2xl">
                {t("tripsCard.submitOffer")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="max-w-[400px] p-6">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              {t("trips.confirmation.title")}
            </DialogTitle>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t("trips.confirmation.message")}
            </p>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCancelRequest}
              variant="outline"
              className="flex-1 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t("trips.confirmation.cancel")}
            </Button>
            <Button
              onClick={handleConfirmRequest}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium"
            >
              {t("trips.confirmation.continue")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TelegramConnectModal 
        open={telegramModalOpen} 
        onOpenChange={setTelegramModalOpen}
        onCloseParent={(close) => {
          // Закрываем тот диалог, который был открыт (бронирование или предложение цены)
          if (bookingDialogOpen) {
            setBookingDialogOpen(false);
          }
          if (offerDialogOpen) {
            setOfferDialogOpen(false);
          }
        }}
      />
    </>
  );
}

export default TripsCard;

// Booking and Offer Dialogs
// Rendered outside return to keep file simple
// We place them after default export so they render along with the card

