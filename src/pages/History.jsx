import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGetData } from "@/api/api";
import { useI18n } from "@/app/i18n.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { MapPin, ArrowRight, Calendar, Clock, Users, Car, Route, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import TripsCardSkeleton from "@/components/TripsCardSkeleton";
import { Button } from "@/components/ui/button";

function History() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("orders");
  const [tripsPage, setTripsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const PER_PAGE = 5;
  
  // Получаем данные пользователя для определения роли
  const { data: userData } = useGetData("/user");
  const userRole = userData?.role || "passenger";
  const isDriver = userRole === "driver";
  
  // API для истории с пагинацией
  // Делаем два запроса для независимой пагинации каждого таба
  const tripsHistoryUrl = isDriver 
    ? `/driver/history?page=${tripsPage}`
    : `/passenger/history?page=${tripsPage}`;
  const bookingsHistoryUrl = isDriver 
    ? `/driver/history?page=${bookingsPage}`
    : `/passenger/history?page=${bookingsPage}`;
  
  // Загружаем данные только для активного таба
  const activeHistoryUrl = activeTab === "orders" ? tripsHistoryUrl : bookingsHistoryUrl;
  const { data: historyData, isLoading, error } = useGetData(activeHistoryUrl);
  
  // Извлекаем данные из ответа с пагинацией
  // API возвращает объект с trips и bookings, каждый из которых имеет data (пагинация)
  const trips = activeTab === "orders" ? (historyData?.trips?.data || historyData?.trips || []) : [];
  const bookings = activeTab === "bookings" ? (historyData?.bookings?.data || historyData?.bookings || []) : [];
  
  // Информация о пагинации
  const tripsPagination = activeTab === "orders" ? (historyData?.trips || {}) : {};
  const bookingsPagination = activeTab === "bookings" ? (historyData?.bookings || {}) : {};
  
  // Проверка наличия следующей страницы
  const hasNextTripsPage = tripsPagination.current_page < tripsPagination.last_page;
  const hasNextBookingsPage = bookingsPagination.current_page < bookingsPagination.last_page;
  
  // Сброс страниц при смене таба
  React.useEffect(() => {
    setTripsPage(1);
    setBookingsPage(1);
  }, [activeTab]);
  
  // Функция для форматирования даты
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ru-RU");
  };
  
  // Функция для форматирования времени
  const formatTime = (time) => {
    if (!time) return "";
    return time.substring(0, 5); // Берем только часы и минуты
  };
  
  // Компонент карточки поездки
  const TripCard = ({ trip }) => {
    // Для пассажиров: получаем информацию о водителе из booking
    // Для водителей: получаем информацию о пассажирах из booking
    const bookings = trip.booking || [];
    const firstBooking = bookings[0];
    
    // Для пассажиров: водитель из booking.user
    // Для водителей: пассажир из booking.user
    const otherUser = firstBooking?.user || trip.user || trip.driver || {};
    const otherUserCar = otherUser?.car || trip.car || {};
    
    return (
      <Card className="shadow-lg rounded-3xl bg-card/90 backdrop-blur-sm border py-3 sm:py-4 ring-1 ring-blue-200/60 shadow-[0_10px_30px_rgba(59,130,246,0.15)]">
        <CardContent className="px-3 sm:px-4">
      <div className="flex flex-col gap-2">
            {/* Маршрут */}
            <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
              <MapPin size={16} className="text-primary" />
              <span className="truncate">{trip.from_address || trip.from_city || ""}</span>
              <ArrowRight size={14} className="text-primary" />
              <span className="truncate">{trip.to_address || trip.to_city || ""}</span>
        </div>

            {/* Дата и время */}
        <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <Calendar size={16} className="text-primary" />
                <span>{formatDate(trip.date)}</span>
              </div>
          <span>•</span>
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-primary" />
                <span>{formatTime(trip.time)}</span>
              </div>
        </div>

            {/* Информация о водителе/пассажире */}
            {otherUser.name && (
              <div className="flex items-center gap-2 mt-1">
          <Avatar className="size-8 ring-2 ring-white shadow">
                  <AvatarFallback className="text-xs">
                    {getInitials(otherUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span className="font-medium truncate">{otherUser.name}</span>
                  {otherUser.rating && (
              <>
                <span className="text-gray-500">•</span>
                      <span className="text-gray-600">⭐ {otherUser.rating}</span>
              </>
            )}
          </div>
        </div>
            )}
            
            {/* Информация о машине (для пассажиров) */}
            {!isDriver && (otherUserCar.car_model || otherUserCar.model) && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Car size={16} className="text-primary" />
                <span>{otherUserCar.car_model || otherUserCar.model}</span>
                {otherUserCar.car_color || otherUserCar.color ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{otherUserCar.car_color || otherUserCar.color}</span>
                  </>
                ) : null}
                {otherUserCar.number_car || otherUserCar.number ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{otherUserCar.number_car || otherUserCar.number}</span>
                  </>
          ) : null}
              </div>
            )}
            
            {/* Дополнительная информация */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              {trip.seats && (
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{trip.seats} {t("tripsCard.seats")}</span>
                </div>
              )}
              {trip.amount && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{Number(trip.amount).toLocaleString()} сум</span>
                </div>
              )}
            </div>
            
            {/* Статус */}
            <div className="mt-1">
              <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-2xl">
                {t("history.completed")}
              </span>
        </div>
      </div>
        </CardContent>
      </Card>
    );
  };
  
  // Компонент карточки бронирования
  const BookingCard = ({ booking }) => {
    const trip = booking.trip || {};
    
    // Для пассажиров: водитель из trip.user
    // Для водителей: пассажир из booking.user
    const otherUser = isDriver ? (booking.user || {}) : (trip.user || trip.driver || {});
    const otherUserCar = otherUser?.car || trip.car || {};

  return (
      <Card className="shadow-lg rounded-3xl bg-card/90 backdrop-blur-sm border py-3 sm:py-4 ring-1 ring-blue-200/60 shadow-[0_10px_30px_rgba(59,130,246,0.15)]">
        <CardContent className="px-3 sm:px-4">
          <div className="flex flex-col gap-2">
            {/* Маршрут */}
            <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
              <MapPin size={16} className="text-primary" />
              <span className="truncate">{trip.from_address || trip.from_city || ""}</span>
              <ArrowRight size={14} className="text-primary" />
              <span className="truncate">{trip.to_address || trip.to_city || ""}</span>
            </div>
            
            {/* Дата и время */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <Calendar size={16} className="text-primary" />
                <span>{formatDate(trip.date)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-primary" />
                <span>{formatTime(trip.time)}</span>
              </div>
            </div>
            
            {/* Информация о водителе/пассажире */}
            {otherUser.name && (
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="size-8 ring-2 ring-white shadow">
                  <AvatarFallback className="text-xs">
                    {getInitials(otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span className="font-medium truncate">{otherUser.name}</span>
                  {otherUser.rating && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">⭐ {otherUser.rating}</span>
                    </>
                  )}
                </div>
                </div>
            )}
            
            {/* Информация о машине (для пассажиров) */}
            {!isDriver && (otherUserCar.car_model || otherUserCar.model) && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Car size={16} className="text-primary" />
                <span>{otherUserCar.car_model || otherUserCar.model}</span>
                {otherUserCar.car_color || otherUserCar.color ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{otherUserCar.car_color || otherUserCar.color}</span>
                  </>
                ) : null}
                {otherUserCar.number_car || otherUserCar.number ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{otherUserCar.number_car || otherUserCar.number}</span>
                  </>
                ) : null}
              </div>
            )}
            
            {/* Количество мест и цена */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              {booking.seats && (
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{booking.seats} {t("tripsCard.seats")}</span>
                </div>
              )}
              {booking.offered_price ? (
                <span className="font-semibold">{Number(booking.offered_price).toLocaleString()} сум</span>
              ) : trip.amount ? (
                <span className="font-semibold">{Number(trip.amount).toLocaleString()} сум</span>
            ) : null}
            </div>
            
            {/* Статус */}
            <div className="mt-1">
              <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-2xl">
                {t("history.completed")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full -mt-2 sm:-mt-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 fixed top-[calc(4rem+3.75rem+0.5rem+0.5rem)] sm:top-[calc(5rem+4.5rem+0.75rem+0.5rem)] left-0 right-0 max-w-[620px] mx-auto px-5 z-30 bg-transparent backdrop-blur-none border-0 shadow-none py-1 gap-2">
          <TabsTrigger 
            value="orders" 
            className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary flex items-center justify-center gap-2"
          >
            <Car size={16} />
            {t("nav.orders")}
          </TabsTrigger>
          <TabsTrigger 
            value="bookings" 
            className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary flex items-center justify-center gap-2"
          >
            <Route size={16} />
            {t("nav.booking")}
          </TabsTrigger>
        </TabsList>
        
        {/* Отступ для закрепленных табов */}
        <div className="h-[4rem] sm:h-[4.25rem]"></div>
        
        <TabsContent value="orders" className="mt-0 px-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(1).map((_, index) => (
                <TripsCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">
              {t("booking.error")}: {error.message}
            </div>
          ) : trips.length === 0 ? (
            <div className="py-4">
              <EmptyState title={t("history.empty")} />
            </div>
            ) : (
              <>
              <div className="space-y-3">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              {/* Пагинация для заказов */}
              {tripsPagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <Button 
                    variant="outline" 
                    disabled={tripsPage === 1} 
                    onClick={() => setTripsPage((p) => Math.max(1, p - 1))} 
                    aria-label="Prev page"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-sm">{tripsPage}</span>
                  <Button
                    variant="outline"
                    disabled={!hasNextTripsPage}
                    onClick={() => setTripsPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight />
                  </Button>
                </div>
            )}
          </>
        )}
        </TabsContent>
        
        <TabsContent value="bookings" className="mt-0 px-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(1).map((_, index) => (
                <TripsCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">
              {t("booking.error")}: {error.message}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-4">
              <EmptyState title={t("history.empty")} />
            </div>
            ) : (
              <>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              {/* Пагинация для броней */}
              {bookingsPagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <Button 
                    variant="outline" 
                    disabled={bookingsPage === 1} 
                    onClick={() => setBookingsPage((p) => Math.max(1, p - 1))} 
                    aria-label="Prev page"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-sm">{bookingsPage}</span>
                  <Button
                    variant="outline"
                    disabled={!hasNextBookingsPage}
                    onClick={() => setBookingsPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight />
                  </Button>
                </div>
            )}
          </>
        )}
        </TabsContent>
      </Tabs>
          </div>
  );
}

export default History;
