import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Orders from "./Orders";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/app/i18n.jsx";
import { useGetData } from "@/api/api";
import { Plus, Search } from "lucide-react";
import TripsCard from "@/components/TripsCard";
import MyTripsCard from "@/components/MyTripsCard";
import MyTripsCardIntercity from "@/components/MyTripsCardIntercity";
import TripsCardSkeleton from "@/components/TripsCardSkeleton";
import EmptyState from "@/components/EmptyState";

function TripsOrders({ type = "city" }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // Получаем данные пользователя для определения роли
  const { data: userData } = useGetData("/user");
  const userRole = userData?.role || "passenger";
  
  // Для водителей показываем табы "Все заказы" и "Мои брони"
  // Для пассажиров показываем табы "Создать заказ" и "Мои заказы"
  const isDriver = userRole === "driver";
  
  // Устанавливаем начальный таб в зависимости от роли
  const [activeTab, setActiveTab] = useState(isDriver ? "all-orders" : "create");
  
  // Обновляем активный таб при изменении роли
  useEffect(() => {
    if (isDriver && activeTab === "create") {
      setActiveTab("all-orders");
    } else if (!isDriver && activeTab === "all-orders") {
      setActiveTab("create");
    }
  }, [isDriver, activeTab]);

  // Хуки должны вызываться на верхнем уровне, не условно
  // Для водителей: получаем мои поездки (только для межгорода)
  // API фильтрует по role=driver на бэкенде
  const {
    data: myTripsData,
    isLoading: myTripsLoading,
    error: myTripsError,
    refetch: myTripsRefetch,
  } = useGetData(type === "intercity" && isDriver ? "/trips/my?page=1&per_page=10" : null);

  // Для пассажиров в межгороде: получаем забронированные поездки
  const {
    data: myBookingsData,
    isLoading: myBookingsLoading,
    error: myBookingsError,
    refetch: myBookingsRefetch,
  } = useGetData(type === "intercity" && !isDriver ? "/bookings/my/for/passenger/in-progress" : null);

  // Для пассажиров в межгороде: получаем все активные поездки водителей
  const {
    data: allTripsData,
    isLoading: allTripsLoading,
    error: allTripsError,
    refetch: allTripsRefetch,
  } = useGetData(type === "intercity" && !isDriver ? "/trips/for/passenger/active" : null);

  // Для межгорода показываем кнопки и список поездок
  if (type === "intercity") {

    // API возвращает массив напрямую (get() возвращает коллекцию)
    const myTripsList = Array.isArray(myTripsData) 
      ? myTripsData 
      : (myTripsData?.data || []);

    // Фильтруем поездки (исключаем завершенные) и преобразуем поля для совместимости с MyTripsCard
    // API для межгорода возвращает from_address/to_address, а MyTripsCard ожидает from_city/to_city
    const filteredMyTrips = Array.isArray(myTripsList)
      ? myTripsList
          .filter((trip) => trip.status !== "completed")
          .map((trip) => ({
            ...trip,
            // Преобразуем поля для совместимости с MyTripsCard
            from_city: trip.from_address || trip.from_city || "",
            to_city: trip.to_address || trip.to_city || "",
            seats_total: trip.seats || trip.seats_total || 1,
            price: trip.amount || trip.price || 0,
            // Для межгорода могут отсутствовать поля машины, устанавливаем пустые значения
            carModel: trip.carModel || trip.car_model || "",
            carColor: trip.carColor || trip.car_color || "",
            numberCar: trip.numberCar || trip.number_car || "",
          }))
      : [];
    
    // Для пассажиров: обрабатываем данные забронированных поездок
    // API /bookings/my/confirmed возвращает массив бронирований с вложенным trip
    const myBookingsList = Array.isArray(myBookingsData) 
      ? myBookingsData 
      : (myBookingsData?.data || []);

    // Преобразуем бронирования в формат поездок для отображения
    const filteredMyBookings = Array.isArray(myBookingsList)
      ? myBookingsList
          .filter((booking) => booking.trip && booking.trip.role === "driver")
          .map((booking) => {
            const trip = booking.trip;
            const driver = trip.user || trip.driver;
            const car = trip.user?.car || trip.car || {};
            
            return {
              ...trip,
              // Добавляем информацию о бронировании
              my_booking: booking,
              booking_id: booking.id,
              booking_seats: booking.seats,
              // Преобразуем поля для совместимости с TripsCard
              from_city: trip.from_address || trip.from_city || "",
              to_city: trip.to_address || trip.to_city || "",
              // Используем количество мест из бронирования, а не из поездки
              seats: booking.seats || trip.seats || 1,
              price: trip.amount || trip.price || 0,
              // Преобразуем поля машины
              carModel: trip.carModel || trip.car_model || car.car_model || car.model || "",
              carColor: trip.carColor || trip.car_color || car.car_color || car.color || "",
              numberCar: trip.numberCar || trip.number_car || car.number_car || car.number || "",
              // Убеждаемся, что driver доступен для компонента
              driver: driver || trip.driver,
            };
          })
      : [];

    // Для пассажиров: обрабатываем данные всех поездок
    // API возвращает пагинированный ответ, данные в allTripsData.data
    const allTripsList = Array.isArray(allTripsData) 
      ? allTripsData 
      : (allTripsData?.data || []);

    // Преобразуем поля для совместимости с TripsCard
    // API уже фильтрует по status != 'completed', поэтому дополнительная фильтрация не нужна
    const filteredAllTrips = Array.isArray(allTripsList)
      ? allTripsList.map((trip) => {
          // Информация о водителе и машине может быть в trip.user и trip.user.car
          const driver = trip.user || trip.driver;
          const car = trip.user?.car || trip.car || {};
          
          return {
            ...trip,
            // Преобразуем поля для совместимости с TripsCard
            from_city: trip.from_address || trip.from_city || "",
            to_city: trip.to_address || trip.to_city || "",
            seats: trip.seats || 1,
            price: trip.amount || trip.price || 0,
            // Преобразуем поля машины (из trip.user.car или прямых полей)
            carModel: trip.carModel || trip.car_model || car.car_model || car.model || "",
            carColor: trip.carColor || trip.car_color || car.car_color || car.color || "",
            numberCar: trip.numberCar || trip.number_car || car.number_car || car.number || "",
            // Убеждаемся, что driver доступен для компонента
            driver: driver || trip.driver,
          };
        })
      : [];

    return (
      <div className="w-full">
        {/* Кнопка создания/поиска */}
        <div className="px-4 pt-4 pb-3">
          {isDriver ? (
            <Button
              onClick={() => navigate("/intercity/create")}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-12 text-base font-medium hover:brightness-110 transition-all"
            >
              <Plus size={20} />
              Создать поездку
            </Button>
          ) : (
            <Button
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 h-12 text-base font-medium hover:brightness-110 transition-all"
            >
              <Search size={20} />
              Искать поездку
            </Button>
          )}
        </div>

        {/* Раздел с поездками */}
        <div className="px-4">
          {isDriver ? (
            <>
              <div className="pt-3 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-primary">Мои поездки</h3>
              </div>
              <div className="space-y-3">
                {myTripsLoading ? (
                  Array(2)
                    .fill(1)
                    .map((_, index) => <TripsCardSkeleton key={index} />)
                ) : myTripsError ? (
                  <div className="text-center text-sm text-red-600 py-4">
                    Ошибка загрузки поездок
                  </div>
                ) : filteredMyTrips.length === 0 ? (
                  <div className="p-3">
                    <EmptyState title="Нет поездок" />
                  </div>
                ) : (
                  filteredMyTrips.map((trip) => <MyTripsCardIntercity trip={trip} key={trip.id} />)
                )}
              </div>
            </>
          ) : (
            <>
              {/* Раздел "Мои брони" для пассажиров */}
              <div className="pt-2 pb-1">
                <h3 className="text-xs sm:text-sm font-bold text-primary">Мои брони</h3>
              </div>
              <div className="space-y-3 mb-3">
                {myBookingsLoading ? (
                  Array(2)
                    .fill(1)
                    .map((_, index) => <TripsCardSkeleton key={index} />)
                ) : myBookingsError ? (
                  <div className="text-center text-xs text-red-600 py-2">
                    Ошибка загрузки бронирований
                  </div>
                ) : filteredMyBookings.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-2">
                    Нет забронированных поездок
                  </div>
                ) : (
                  filteredMyBookings.map((trip) => <TripsCard trip={trip} key={trip.id} />)
                )}
              </div>

              {/* Раздел "Все поездки" для пассажиров */}
              <div className="pt-2 pb-1">
                <h3 className="text-xs sm:text-sm font-bold text-primary">Все поездки</h3>
              </div>
              <div className="space-y-3">
                {allTripsLoading ? (
                  Array(2)
                    .fill(1)
                    .map((_, index) => <TripsCardSkeleton key={index} />)
                ) : allTripsError ? (
                  <div className="text-center text-xs text-red-600 py-2">
                    Ошибка загрузки поездок
                  </div>
                ) : filteredAllTrips.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-2">
                    Нет доступных поездок
                  </div>
                ) : (
                  filteredAllTrips.map((trip) => <TripsCard trip={trip} key={trip.id} />)
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Для города показываем текущую логику с табами и картами
  return (
    <div className="w-full -mt-2 sm:-mt-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 fixed top-[calc(4rem+3.75rem+0.5rem+0.5rem)] sm:top-[calc(5rem+4.5rem+0.75rem+0.5rem)] left-0 right-0 max-w-[620px] mx-auto px-5 z-30 bg-transparent backdrop-blur-none border-0 shadow-none py-1 gap-2">
          {isDriver ? (
            <>
              <TabsTrigger value="all-orders" className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary">
                Все заказы
              </TabsTrigger>
              <TabsTrigger value="my-orders" className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary">
                Мои брони
              </TabsTrigger>
            </>
          ) : (
            <>
          <TabsTrigger value="create" className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary">
            Создать заказ
          </TabsTrigger>
          <TabsTrigger value="my-orders" className="flex-1 border border-green-400/50 bg-gradient-to-tr from-white/80 to-green-50/60 text-black data-[state=active]:bg-gradient-to-tr data-[state=active]:from-primary data-[state=active]:to-cyan-400 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-primary">
            Мои заказы
          </TabsTrigger>
            </>
          )}
        </TabsList>
        
        {/* Отступ для закрепленных табов */}
        <div className="h-[4rem] sm:h-[4.25rem]"></div>
        
        {isDriver ? (
          <>
            <TabsContent value="all-orders" className="mt-0">
              <Orders showCreateOrder={false} showAllOrders={true} onBookingSuccess={() => setActiveTab("my-orders")} />
            </TabsContent>
            <TabsContent value="my-orders" className="mt-0">
              <Orders showCreateOrder={false} showAllOrders={false} />
            </TabsContent>
          </>
        ) : (
          <>
        <TabsContent value="create" className="mt-0 -mt-4">
          <Orders showCreateOrder={true} onOrderCreated={() => setActiveTab("my-orders")} />
        </TabsContent>
        <TabsContent value="my-orders" className="mt-0">
          <Orders showCreateOrder={false} />
        </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default TripsOrders;

