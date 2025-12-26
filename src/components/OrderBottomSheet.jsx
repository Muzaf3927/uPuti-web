import React, { useMemo } from "react";
import { X, Route, Calendar, Clock, Users, DollarSign, MessageSquare, Car, CircleCheck, Phone, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { sessionManager } from "@/lib/sessionManager";

function OrderBottomSheet({ order, onClose, onSubmit, onCancel, onAcceptOffer, onRejectOffer, onRefresh, onEdit, onDelete, onComplete, onCancelBooking }) {
  const { t } = useI18n();

  if (!order) return null;

  const fromAddress = order.from_address || order.from_city || order.from || "";
  const toAddress = order.to_address || order.to_city || order.to || "";
  const time = order.time ? (order.time.includes(":") ? order.time.substring(0, 5) : order.time) : "";

  // Получаем текущего пользователя
  const currentUser = sessionManager.getUserData();
  const currentUserId = currentUser?.id;

  // Проверяем, является ли заказ моим (я пассажир)
  const isMyOrder = order.user_id === currentUserId;
  
  // Проверяем роль пользователя из API
  const isDriver = currentUser?.role === "driver";

  // Проверяем, есть ли оффер от текущего пользователя (для чужих заказов)
  const userOffer = useMemo(() => {
    if (!currentUserId || !order.driver_offers || !Array.isArray(order.driver_offers)) {
      return null;
    }
    return order.driver_offers.find(
      (offer) => offer.user_id === currentUserId && (offer.status === "pending" || offer.status === "accepted")
    );
  }, [order.driver_offers, currentUserId]);

  const hasUserOffer = !!userOffer;

  // Получаем все офферы для моего заказа (фильтруем только pending и accepted)
  const pendingOffers = useMemo(() => {
    if (!isMyOrder || !order.driver_offers || !Array.isArray(order.driver_offers)) {
      return [];
    }
    return order.driver_offers.filter(
      (offer) => offer.status === "pending" || offer.status === "accepted"
    );
  }, [order.driver_offers, isMyOrder]);

  // Получаем принятый booking (для in_progress заказов)
  // Сначала проверяем bookings, если нет - проверяем driver_offers (для обратной совместимости)
  const acceptedBooking = useMemo(() => {
    if (!isMyOrder) return null;
    
    // Проверяем bookings (новая структура)
    if (order.bookings && Array.isArray(order.bookings)) {
      return order.bookings.find((booking) => booking.status === "in_progress");
    }
    
    // Если нет bookings, проверяем driver_offers (старая структура)
    if (order.driver_offers && Array.isArray(order.driver_offers)) {
      return order.driver_offers.find((offer) => offer.status === "accepted" || offer.status === "in_progress");
    }
    
    return null;
  }, [order.bookings, order.driver_offers, isMyOrder]);

  // Получаем данные водителя из принятого booking/offer
  const driver = acceptedBooking?.user || acceptedBooking?.driver || null;
  
  // Для водителей: получаем информацию о пассажире из order.user (когда это заказ водителя в процессе)
  const passenger = isDriver && order.booking_id && order.status === "in_progress" ? order.user : null;
  
  // Форматируем телефон водителя
  const driverPhone = useMemo(() => {
    if (!driver?.phone) return null;
    const raw = String(driver.phone);
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("998") ? `+${raw}` : `+998${raw}`;
  }, [driver?.phone]);
  
  // Форматируем телефон пассажира
  const passengerPhone = useMemo(() => {
    if (!passenger?.phone) return null;
    const raw = String(passenger.phone);
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("998") ? `+${raw}` : `+998${raw}`;
  }, [passenger?.phone]);
  
  // Проверяем, является ли это заказом водителя в процессе
  const isDriverInProgressOrder = isDriver && order.booking_id && order.status === "in_progress";
  
  // Проверяем, является ли это заказом из таба "Все заказы" для водителя (активный заказ, который еще не забронирован)
  const isDriverActiveOrder = isDriver && !order.booking_id && (order.status === "active" || !order.status);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  // Функция для открытия навигатора с маршрутом
  const openNavigation = (address, lat, lng, isFrom = false) => {
    // Определяем конечную точку маршрута (адрес, на который кликнули)
    const endLat = lat;
    const endLng = lng;

    // Если нет координат конечной точки, открываем через адрес
    if (!endLat || !endLng) {
      const encodedAddress = encodeURIComponent(address);
      const yandexUrl = `https://yandex.ru/maps/?text=${encodedAddress}`;
      window.open(yandexUrl, '_blank');
      return;
    }

    // Получаем текущее местоположение пользователя
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const startLat = position.coords.latitude;
          const startLng = position.coords.longitude;

          // Пробуем открыть Яндекс.Навигатор с маршрутом от текущего местоположения до выбранного адреса
          const yandexNaviUrl = `yandexnavi://build_route?lat_from=${startLat}&lon_from=${startLng}&lat_to=${endLat}&lon_to=${endLng}`;
          
          const yandexNaviLink = document.createElement('a');
          yandexNaviLink.href = yandexNaviUrl;
          yandexNaviLink.style.display = 'none';
          document.body.appendChild(yandexNaviLink);
          yandexNaviLink.click();
          document.body.removeChild(yandexNaviLink);

          // Если Яндекс.Навигатор не установлен, через 500ms открываем веб-версию
          setTimeout(() => {
            const mapsUrl = `https://yandex.ru/maps/?rtext=${startLat},${startLng}~${endLat},${endLng}&rtt=auto`;
            window.open(mapsUrl, '_blank');
          }, 500);
        },
        (error) => {
          // Если не удалось получить местоположение, строим маршрут только до конечной точки
          console.warn('Не удалось получить местоположение:', error);
          
          const yandexNaviUrl = `yandexnavi://build_route?lat_to=${endLat}&lon_to=${endLng}`;
          
          const yandexNaviLink = document.createElement('a');
          yandexNaviLink.href = yandexNaviUrl;
          yandexNaviLink.style.display = 'none';
          document.body.appendChild(yandexNaviLink);
          yandexNaviLink.click();
          document.body.removeChild(yandexNaviLink);

          // Если Яндекс.Навигатор не установлен, через 500ms открываем веб-версию
          setTimeout(() => {
            const mapsUrl = `https://yandex.ru/maps/?rtext=${endLat},${endLng}&rtt=auto`;
            window.open(mapsUrl, '_blank');
          }, 500);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Если геолокация не поддерживается, строим маршрут только до конечной точки
      const yandexNaviUrl = `yandexnavi://build_route?lat_to=${endLat}&lon_to=${endLng}`;
      
      const yandexNaviLink = document.createElement('a');
      yandexNaviLink.href = yandexNaviUrl;
      yandexNaviLink.style.display = 'none';
      document.body.appendChild(yandexNaviLink);
      yandexNaviLink.click();
      document.body.removeChild(yandexNaviLink);

      // Если Яндекс.Навигатор не установлен, через 500ms открываем веб-версию
      setTimeout(() => {
        const mapsUrl = `https://yandex.ru/maps/?rtext=${endLat},${endLng}&rtt=auto`;
        window.open(mapsUrl, '_blank');
      }, 500);
    }
  };

  // Получаем координаты для адресов
  const fromLat = order.from_lat;
  const fromLng = order.from_lng;
  const toLat = order.to_lat || order.toLat || order.toLatitude;
  const toLng = order.to_lng || order.toLng || order.toLongitude || order.to_longitude;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2000] animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
        onClick={onClose}
      />
      
      {/* Bottom Sheet - занимает половину экрана на мобильных */}
      <div className={`bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 ${isDriverInProgressOrder || isDriverActiveOrder ? 'h-auto max-h-[50vh]' : !isMyOrder ? 'h-[55vh] max-h-[55vh]' : order.status === 'active' ? 'h-auto max-h-[45vh]' : (isMyOrder && order.status === 'in_progress' ? 'h-auto max-h-[60vh]' : 'h-[50vh] max-h-[50vh]')} flex flex-col`}>
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label={t("orders.popup.close")}
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>

        {/* Content */}
        <div className={`px-2.5 ${isDriverInProgressOrder || isDriverActiveOrder ? 'pt-0.5 pb-0.5' : 'pt-0.5'} ${isDriverInProgressOrder || isDriverActiveOrder ? 'pb-0' : !isMyOrder ? 'pb-0' : order.status === 'in_progress' ? 'pb-1' : 'pb-0'} ${isDriverInProgressOrder || isDriverActiveOrder ? 'overflow-y-auto' : !isMyOrder ? '' : order.status === 'in_progress' ? 'overflow-y-auto flex-1' : 'overflow-y-auto flex-1'}`}>
          {/* Если это заказ водителя в процессе - показываем надпись "Пассажир ждет вас" в самом верху */}
          {isDriverInProgressOrder && (
            <div className="text-center mb-1.5 pt-0.5">
              <div className="text-sm font-semibold text-blue-600">
                Пассажир ждет вас
              </div>
            </div>
          )}
          
          {/* Если это активный заказ из таба "Все заказы" для водителя - показываем надпись "Ищут машину..." */}
          {isDriverActiveOrder && (
            <div className="text-center mb-1.5 pt-0.5">
              <div className="text-sm font-semibold text-gray-700">
                Ищут машину...
              </div>
            </div>
          )}
          
          {/* Если это мой заказ со статусом active - показываем надпись "Ищется машина" в самом верху */}
          {isMyOrder && order.status === "active" && !isDriverInProgressOrder && (
            <div className="text-center mb-1.5 pt-1">
              <div className="text-base text-gray-900">
                Ищется машина
              </div>
            </div>
          )}
          
          {/* Если это мой заказ со статусом in_progress - показываем надпись "Машина найдена" в самом верху */}
          {isMyOrder && order.status === "in_progress" && !isDriverInProgressOrder && (
            <div className="text-center mb-1.5 pt-1">
              <div className="text-base text-gray-900">
                Машина найдена
              </div>
            </div>
          )}
          
          {/* Маршрут - минималистичный компактный дизайн */}
          <div className={`flex flex-col gap-0.5 ${isDriverInProgressOrder || isDriverActiveOrder ? 'mb-1' : !isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-1'}`}>
            {isDriver ? (
              <button
                onClick={() => openNavigation(fromAddress, fromLat, fromLng, true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50/30 hover:bg-blue-50/50 active:bg-blue-50/70 transition-colors cursor-pointer text-left w-full"
              >
                <img src="/passenger.png" alt="From" className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.from")}</div>
                  <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{fromAddress}</div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50/30">
                <img src="/passenger.png" alt="From" className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.from")}</div>
                  <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{fromAddress}</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center -my-0.5 px-1">
              <Route className="text-blue-500" size={10} />
            </div>
            
            {isDriver ? (
              <button
                onClick={() => openNavigation(toAddress, toLat, toLng, false)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50/30 hover:bg-red-50/50 active:bg-red-50/70 transition-colors cursor-pointer text-left w-full"
              >
                <img src="/toAddress.png" alt="To" className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.to")}</div>
                  <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{toAddress}</div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50/30">
                <img src="/toAddress.png" alt="To" className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.to")}</div>
                  <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{toAddress}</div>
                </div>
              </div>
            )}
          </div>

          {/* Детали заказа - компактная сетка */}
          <div className={`grid grid-cols-2 gap-1 ${isDriverInProgressOrder || isDriverActiveOrder ? 'mb-1' : !isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-1'}`}>
            {/* Дата */}
            {order.date && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50/30">
                <Calendar className="text-blue-600 flex-shrink-0" size={11} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-gray-400 leading-tight">{t("orders.form.date")}</span>
                  <span className="text-[10px] font-bold text-gray-900 leading-tight">{order.date}</span>
                </div>
              </div>
            )}
            
            {/* Время */}
            {time && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50/30">
                <Clock className="text-blue-600 flex-shrink-0" size={11} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-gray-400 leading-tight">{t("orders.form.time")}</span>
                  <span className="text-[10px] font-bold text-gray-900 leading-tight">{time}</span>
                </div>
              </div>
            )}
          </div>

          {/* Количество мест и сумма - компактная сетка */}
          <div className={`grid grid-cols-2 gap-1 ${isDriverInProgressOrder || isDriverActiveOrder ? 'mb-1' : !isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-1'}`}>
            {/* Количество пассажиров */}
            {order.seats && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50/30">
                <Users className="text-green-600 flex-shrink-0" size={11} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-gray-400 leading-tight">{t("orders.popup.seats")}</span>
                  <span className="text-[10px] font-semibold text-gray-900 leading-tight">{order.seats}</span>
                </div>
              </div>
            )}
            
            {/* Сумма - всегда показываем, даже если не указана */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-50/30">
              <DollarSign className="text-yellow-600 flex-shrink-0" size={11} />
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] text-gray-400 leading-tight">{t("orders.popup.price")}</span>
                <span className="text-[10px] font-bold text-gray-900 truncate leading-tight">
                  {order.amount ? `${Number(order.amount).toLocaleString()} сум` : (order.price ? `${Number(order.price).toLocaleString()} сум` : "Не указана")}
                </span>
              </div>
            </div>
          </div>

          {/* Комментарий */}
          {order.comment && (
            <div className={`${isDriverInProgressOrder || isDriverActiveOrder ? 'mb-1' : !isMyOrder ? 'mb-0' : order.status === 'in_progress' ? 'mb-0' : 'mb-1'} px-1.5 py-0.5 rounded-md bg-gray-50/30`}>
              <div className="flex items-start gap-1">
                <MessageSquare className="text-gray-600 flex-shrink-0 mt-0.5" size={11} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 mb-0.5 leading-tight">{t("orders.popup.comment")}</div>
                  <div className="text-[10px] text-gray-900 break-words leading-tight line-clamp-2">{order.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Если это заказ водителя в процессе - показываем информацию о пассажире */}
          {isDriverInProgressOrder && passenger && (
            <div className="mb-1.5 border-2 border-blue-200 rounded-xl p-2 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 shadow-sm">
              {/* Информация о пассажире */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">Пассажир</div>
                  <div className="text-sm font-bold text-gray-900 truncate mb-0.5">
                    {passenger.name || "Пассажир"}
                  </div>
                  {passenger.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500" size={12} fill="currentColor" />
                      <span className="text-xs font-semibold text-gray-700">
                        {passenger.rating}
                        {passenger.rating_count && (
                          <span className="text-gray-500 font-normal"> ({passenger.rating_count})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {passengerPhone && (
                  <button
                    onClick={() => handleCall(passengerPhone)}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-sm"
                    aria-label="Позвонить пассажиру"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Позвонить</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Если это мой заказ со статусом in_progress - показываем данные водителя */}
          {isMyOrder && order.status === "in_progress" && !isDriverInProgressOrder && acceptedBooking && driver && (
            <div className="mb-1 border-2 border-blue-200 rounded-xl p-2 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 shadow-sm">
              {/* Информация о водителе */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate mb-0.5">
                    {driver.name || "Водитель"}
                  </div>
                  {driver.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500" size={12} fill="currentColor" />
                      <span className="text-xs font-semibold text-gray-700">
                        {driver.rating}
                        {driver.rating_count && (
                          <span className="text-gray-500 font-normal"> ({driver.rating_count})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {driverPhone && (
                  <button
                    onClick={() => handleCall(driverPhone)}
                    className="flex-shrink-0 px-2 py-1 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1 text-[10px] font-semibold shadow-sm"
                    aria-label={t("orders.popup.phone")}
                  >
                    <Phone className="w-3 h-3" />
                    <span>{t("orders.myOrderActions.callDriver")}</span>
                  </button>
                )}
              </div>

              {/* Информация о машине */}
              {driver.car && (
                <>
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    {driver.car.model && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/70 border border-gray-200">
                        <Car className="text-gray-700 flex-shrink-0" size={14} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-gray-500 leading-tight mb-0.5">Модель</span>
                          <span className="text-xs font-semibold text-gray-900 truncate leading-tight">
                            {driver.car.model}
                          </span>
                        </div>
                      </div>
                    )}
                    {driver.car.color && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/70 border border-gray-200">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-gray-500 leading-tight mb-0.5">Цвет</span>
                          <span className="text-xs font-semibold text-gray-900 truncate leading-tight">
                            {driver.car.color}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {driver.car.number && (
                    <div className="text-xs text-gray-700 mb-1 px-2 py-1 bg-white/70 rounded-lg border border-gray-200">
                      <span className="font-medium">Номер:</span> <span className="font-bold">{driver.car.number}</span>
                    </div>
                  )}
                </>
              )}

              {/* Цена booking (если указана) */}
              {acceptedBooking.offered_price && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-yellow-50/70 border border-yellow-200 mb-0">
                  <DollarSign className="text-yellow-600 flex-shrink-0" size={14} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-gray-500 leading-tight mb-0.5">{t("orders.popup.price")}</span>
                    <span className="text-sm font-bold text-gray-900 truncate leading-tight">
                      {Number(acceptedBooking.offered_price).toLocaleString()} сум
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Кнопки действий - для моих заказов (активные) */}
        {isMyOrder && order.status === "active" && (
          <div className="px-3 pb-2 pt-1 border-t border-gray-100">
            {onDelete && (
              <Button
                type="button"
                onClick={() => {
                  onDelete(order);
                  onClose();
                }}
                className="w-full h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                {t("orders.myOrderActions.delete")}
              </Button>
            )}
          </div>
        )}

        {/* Кнопки действий - для водителя в процессе (отменить брон, завершить) */}
        {isDriverInProgressOrder && (
          <div className="px-3 pb-6 sm:pb-4 pt-1 border-t border-gray-100 flex-shrink-0 flex gap-2">
            {onCancelBooking && (
              <Button
                type="button"
                onClick={() => {
                  onCancelBooking(order);
                  onClose();
                }}
                className="flex-1 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <X className="w-4 h-4" />
                Отменить
              </Button>
            )}
            {onComplete && (
              <Button
                type="button"
                onClick={() => {
                  onComplete(order);
                  onClose();
                }}
                className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <CircleCheck className="w-4 h-4" />
                Завершить
              </Button>
            )}
          </div>
        )}
        
        {/* Кнопки действий - для водителя в табе "Все заказы" (забронировать заказ) */}
        {isDriverActiveOrder && (
          <div className="px-3 pb-1.5 pt-1 border-t border-gray-100 flex-shrink-0">
            {onSubmit && (
              <Button
                type="button"
                onClick={() => {
                  onSubmit();
                }}
                className="w-full h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <CircleCheck className="w-4 h-4" />
                Забронировать заказ
              </Button>
            )}
          </div>
        )}
        
        {/* Кнопки действий - для моих заказов (in_progress) - пассажир */}
        {isMyOrder && order.status === "in_progress" && !isDriverInProgressOrder && (
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
            {onDelete && (
              <Button
                type="button"
                onClick={() => {
                  onDelete(order);
                  onClose();
                }}
                className="w-full h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Отменить заказ
              </Button>
            )}
          </div>
        )}
        
        {/* Кнопки действий - только для чужих заказов (удалено по запросу) */}
      </div>
    </div>
  );
}

export default OrderBottomSheet;