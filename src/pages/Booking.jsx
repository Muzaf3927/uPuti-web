import { ArrowRight, MapPin, MessageCircle, ChevronDown, ChevronUp, Phone } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// shad ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

import { useParams } from "react-router-dom";

import { useGetData, bookingsApi } from "@/api/api";
import { useI18n } from "@/app/i18n.jsx";
import RefreshFab from "@/components/RefreshFab.jsx";
import { useQuery } from "@tanstack/react-query";
import { useActiveTab } from "@/layout/MainLayout";
import { useActivePage } from "@/hooks/useActivePage";


function Booking() {
  const { t } = useI18n();
  const location = useLocation();
  const { activeTab } = useActiveTab();
  const { isActivePage } = useActivePage();

  // API для всех броней пассажира (requested и in_progress)
  // Автообновление только если страница активна
  const { data: myBookingsRes, isPending: myBookingsLoading, error: myBookingsError, refetch: refetchMyBookings } = useGetData("/bookings/my/for/passenger/in-progress", {
    refetchInterval: isActivePage("booking") ? 5000 : false, // Автоматическое обновление каждые 5 секунд только на активной странице
    refetchOnWindowFocus: true, // Обновление при фокусе на окне
  });

  // API /bookings/to-my-trips/confirmed удален
  const confirmedBookingsToMyTripsRes = null;
  const confirmedBookingsToMyTripsLoading = false;
  const confirmedBookingsToMyTripsError = null;
  const refetchConfirmedToMyTrips = () => {};

  // Получаем количество непрочитанных сообщений (React Query автоматически дедуплицирует запрос с Navbar)
  const { data: unreadCounts } = useQuery({ 
    queryKey: ["bookings", "unread-count"], 
    queryFn: bookingsApi.getUnreadCount, 
    refetchInterval: 60000,
    staleTime: 30000,
    cacheTime: 300000
  });

  // Listen global refresh
  useEffect(() => {
    const handler = () => { Promise.allSettled([refetchMyBookings(), refetchConfirmedToMyTrips()]); };
    window.addEventListener("app:refresh", handler);
    return () => window.removeEventListener("app:refresh", handler);
  }, [refetchMyBookings, refetchConfirmedToMyTrips]);

  // Автоматическое обновление данных при переходе на страницу и переключении табов
  useEffect(() => {
    if (isActivePage("booking")) {
      refetchMyBookings();
      // API /bookings/to-my-trips/confirmed удален
    }
  }, [location.pathname, activeTab, refetchMyBookings, isActivePage]);

  // Обрабатываем данные броней - API может возвращать массив или объект
  const myBookingsList = Array.isArray(myBookingsRes) 
    ? myBookingsRes 
    : (myBookingsRes?.bookings || myBookingsRes?.data || []);
  
  const myBookings = myBookingsList;
  // API /bookings/to-my-trips/confirmed удален
  const confirmedBookingsToMyTrips = [];

  // Группируем брони по поездкам для второй вкладки
  const bookingsByTrip = React.useMemo(() => {
    // API удален - возвращаем пустой объект
    return {};
  }, []);

  // Показываем только нужный контент в зависимости от activeTab
  const showPassengerContent = activeTab === "passenger";
  const showDriverContent = activeTab === "driver";

  return (
      <>
        {showPassengerContent && (
            <Card className="rounded-3xl shadow-lg border bg-card/90 backdrop-blur-sm">
              <CardContent className="flex flex-col gap-4 py-6 rounded-3xl">
                {myBookingsLoading ? (
                    <div>{t("booking.loading")}</div>
                ) : myBookingsError ? (
                    <div className="text-red-600">{t("booking.error")}: {myBookingsError.message}</div>
                ) : myBookings.length === 0 ? (
                    <div>{t("booking.none")}</div>
                ) : (
                    myBookings.map((b) => {
                      // Определяем статус бронирования
                      const bookingStatus = b.status || b.booking_status || "requested";
                      const isRequested = bookingStatus === "requested" || bookingStatus === "pending";
                      const isInProgress = bookingStatus === "in_progress" || bookingStatus === "confirmed";
                      
                      return (
                        <div
                          key={b.id}
                          className="border rounded-xl p-3 shadow-[0_6px_18px_rgba(59,130,246,0.12)] ring-1 ring-blue-200/60 hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                          style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Avatar className="size-10 sm:size-12 flex-shrink-0">
                                <AvatarFallback className="text-sm font-semibold">{getInitials(b.trip?.driver?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">
                              {b.trip?.from_city} <ArrowRight size={14} className="inline" /> {b.trip?.to_city}
                            </span>
                                  {/* Статус бронирования */}
                                  {isRequested ? (
                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full w-fit font-medium">
                                      {t("booking.status.requested")}
                                    </span>
                                  ) : isInProgress ? (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full w-fit font-medium">
                                      {t("booking.status.accepted")}
                                    </span>
                                  ) : (
                                    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full w-fit">
                                      {t("common.confirmed")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {b.trip?.date} • {b.trip?.time}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                                  <span>{b.seats} {t("common.seats")}</span>
                                  {b.offered_price ? (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        {t("booking.offeredPrice")}: {Number(b.offered_price).toLocaleString()} сум
                                      </span>
                                  ) : (
                                      <span>{t("common.price")}: {Number(b.trip?.price || 0).toLocaleString()} сум</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                  <Phone size={12} />
                                  <span>{b.trip?.driver?.phone ? `+998${b.trip.driver.phone}` : t("common.phoneNotAvailable")}</span>
                                </div>
                                {b.comment && (
                                    <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
                                      "{b.comment}"
                                    </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                              <a
                                  href={b.trip?.driver?.phone ? `tel:+998${b.trip.driver.phone}` : '#'}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm hover:shadow-md flex-1 sm:flex-none ${
                                      b.trip?.driver?.phone
                                          ? 'bg-secondary text-secondary-foreground hover:brightness-110'
                                          : 'bg-gray-400 text-white cursor-not-allowed'
                                  }`}
                                  onClick={!b.trip?.driver?.phone ? (e) => e.preventDefault() : undefined}
                              >
                                <Phone size={14} />
                                <span className="hidden sm:inline">{t("booking.call")}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
        )}
        {showDriverContent && (
            <Card className="rounded-3xl shadow-lg border bg-card/90 backdrop-blur-sm">
              <CardContent className="flex flex-col gap-4 py-6 rounded-3xl">
                {confirmedBookingsToMyTripsLoading ? (
                    <div>{t("booking.loading")}</div>
                ) : confirmedBookingsToMyTripsError ? (
                    <div className="text-red-600">{t("booking.error")}: {confirmedBookingsToMyTripsError.message}</div>
                ) : Object.keys(bookingsByTrip).length === 0 ? (
                    <div>{t("booking.myTripsNone")}</div>
                ) : (
                    Object.values(bookingsByTrip).map(({ trip, bookings }) => (
                        <div key={trip.id} className="flex flex-col gap-2">
                          {bookings.map((b) => (
                              <div
                                key={b.id}
                                className="border rounded-xl p-3 shadow-[0_6px_18px_rgba(59,130,246,0.12)] ring-1 ring-blue-200/60 hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                                style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <Avatar className="size-10 sm:size-12 flex-shrink-0">
                                      <AvatarFallback className="text-sm font-semibold">{getInitials(b.user?.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {trip.from_city} <ArrowRight size={14} className="inline" /> {trip.to_city}
                                </span>
                                        <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full w-fit">{t("common.confirmed")}</span>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600">
                                        {trip.date} • {trip.time}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <span>{b.seats} {t("common.seats")}</span>
                                        {b.offered_price ? (
                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    {t("common.offer")}: {b.offered_price} сум
                                  </span>
                                        ) : (
                                            <span>{t("common.price")}: {trip.price} сум</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                        <span className="font-medium">{b.user?.name || "Foydalanuvchi"}</span>
                                      </div>
                                      {b.user?.phone && (
                                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                            <Phone size={12} />
                                            <span>+998{b.user.phone}</span>
                                          </div>
                                      )}
                                      {b.comment && (
                                          <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
                                            "{b.comment}"
                                          </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                                    <Link
                                        to={`/chats?tripId=${trip.id}&receiverId=${b.user?.id}`}
                                        className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:brightness-110 transition-colors shadow-sm hover:shadow-md flex-1 sm:flex-none"
                                    >
                                      <MessageCircle size={14} />
                                      <span className="hidden sm:inline">{t("booking.write")}</span>
                                    </Link>
                                    <a
                                        href={b.user?.phone ? `tel:+998${b.user.phone}` : '#'}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm hover:shadow-md flex-1 sm:flex-none ${
                                            b.user?.phone
                                                ? 'bg-secondary text-secondary-foreground hover:brightness-110'
                                                : 'bg-gray-400 text-white cursor-not-allowed'
                                        }`}
                                        onClick={!b.user?.phone ? (e) => e.preventDefault() : undefined}
                                    >
                                      <Phone size={14} />
                                      <span className="hidden sm:inline">{t("booking.call")}</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                    ))
                )}
              </CardContent>
            </Card>
        )}
        {/* RefreshFab рендерится глобально из MainLayout через портал */}
      </>
  );
}

export default Booking;