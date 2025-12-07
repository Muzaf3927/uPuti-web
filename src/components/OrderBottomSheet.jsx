import React, { useMemo } from "react";
import { X, MapPin, Route, Calendar, Clock, Users, DollarSign, MessageSquare, Car, CircleCheck, Phone, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { sessionManager } from "@/lib/sessionManager";

function OrderBottomSheet({ order, onClose, onSubmit, onCancel, onAcceptOffer, onRejectOffer, onRefresh, onEdit, onDelete, onComplete }) {
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

  // Получаем принятый оффер (для in_progress заказов)
  const acceptedOffer = useMemo(() => {
    if (!isMyOrder || !order.driver_offers || !Array.isArray(order.driver_offers)) {
      return null;
    }
    return order.driver_offers.find((offer) => offer.status === "accepted");
  }, [order.driver_offers, isMyOrder]);

  // Получаем данные водителя из принятого оффера
  const driver = acceptedOffer?.driver || acceptedOffer?.user || null;
  
  // Форматируем телефон водителя
  const driverPhone = useMemo(() => {
    if (!driver?.phone) return null;
    const raw = String(driver.phone);
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("998") ? `+${raw}` : `+998${raw}`;
  }, [driver?.phone]);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2000] animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
        onClick={onClose}
      />
      
      {/* Bottom Sheet - занимает половину экрана на мобильных */}
      <div className={`bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 ${!isMyOrder ? 'h-[55vh] max-h-[55vh]' : 'h-[50vh] max-h-[50vh]'} flex flex-col`}>
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
        <div className={`px-2.5 pt-0.5 ${!isMyOrder ? 'pb-0' : order.status === 'in_progress' ? 'pb-0' : 'pb-1.5'} ${!isMyOrder ? '' : order.status === 'in_progress' ? '' : 'overflow-y-auto flex-1'}`}>
          {/* Маршрут - минималистичный компактный дизайн */}
          <div className={`flex flex-col gap-0.5 ${!isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-2'}`}>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50/30">
              <MapPin className="text-blue-600 flex-shrink-0" size={12} />
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.from")}</div>
                <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{fromAddress}</div>
              </div>
            </div>
            
            <div className="flex justify-center -my-0.5 px-1">
              <Route className="text-blue-500" size={10} />
            </div>
            
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50/30">
              <MapPin className="text-red-600 flex-shrink-0" size={12} />
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-gray-400 leading-tight">{t("orders.form.to")}</div>
                <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">{toAddress}</div>
              </div>
            </div>
          </div>

          {/* Детали заказа - компактная сетка */}
          <div className={`grid grid-cols-2 gap-1 ${!isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-2'}`}>
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
          <div className={`grid grid-cols-2 gap-1 ${!isMyOrder ? 'mb-1.5' : order.status === 'in_progress' ? 'mb-1' : 'mb-2'}`}>
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
            
            {/* Сумма */}
            {order.amount && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-50/30">
                <DollarSign className="text-yellow-600 flex-shrink-0" size={11} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-gray-400 leading-tight">{t("orders.popup.price")}</span>
                  <span className="text-[10px] font-bold text-gray-900 truncate leading-tight">
                    {Number(order.amount).toLocaleString()} сум
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Комментарий */}
          {order.comment && (
            <div className={`${!isMyOrder ? 'mb-0' : order.status === 'in_progress' ? 'mb-0' : 'mb-2'} px-1.5 py-0.5 rounded-md bg-gray-50/30`}>
              <div className="flex items-start gap-1">
                <MessageSquare className="text-gray-600 flex-shrink-0 mt-0.5" size={11} />
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 mb-0.5 leading-tight">{t("orders.popup.comment")}</div>
                  <div className="text-[10px] text-gray-900 break-words leading-tight line-clamp-2">{order.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Если это мой заказ со статусом in_progress - показываем данные водителя */}
          {isMyOrder && order.status === "in_progress" && acceptedOffer && driver && (
            <div className="mb-0 border-2 border-blue-200 rounded-xl p-3 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-gray-900">
                  {t("orders.bottomSheet.driver") || "Водитель"}
                </div>
                {/* Надпись "Ваш водитель" */}
                <div className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded-md">
                  {t("orders.bottomSheet.yourDriver")}
                </div>
              </div>
              
              {/* Информация о водителе */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-900 truncate mb-1">
                    {driver.name || "Водитель"}
                  </div>
                  {driver.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500" size={14} fill="currentColor" />
                      <span className="text-sm font-semibold text-gray-700">
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
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-2 text-sm font-semibold shadow-md"
                    aria-label={t("orders.popup.phone")}
                  >
                    <Phone className="w-4 h-4" />
                    <span>{t("orders.myOrderActions.callDriver")}</span>
                  </button>
                )}
              </div>

              {/* Информация о машине */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {acceptedOffer.carModel && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 border border-gray-200">
                    <Car className="text-gray-700 flex-shrink-0" size={16} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-gray-500 leading-tight mb-0.5">Модель</span>
                      <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {acceptedOffer.carModel}
                      </span>
                    </div>
                  </div>
                )}
                {acceptedOffer.carColor && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 border border-gray-200">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-gray-500 leading-tight mb-0.5">Цвет</span>
                      <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {acceptedOffer.carColor}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {acceptedOffer.numberCar && (
                <div className="text-sm text-gray-700 mb-2 px-2.5 py-1.5 bg-white/70 rounded-lg border border-gray-200">
                  <span className="font-medium">Номер:</span> <span className="font-bold">{acceptedOffer.numberCar}</span>
                </div>
              )}

              {/* Цена оффера */}
              {acceptedOffer.price && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-50/70 border border-yellow-200 mb-0">
                  <DollarSign className="text-yellow-600 flex-shrink-0" size={16} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-500 leading-tight mb-0.5">{t("orders.popup.price")}</span>
                    <span className="text-base font-bold text-gray-900 truncate leading-tight">
                      {Number(acceptedOffer.price).toLocaleString()} сум
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Если это мой заказ - показываем список офферов (только для active) */}
          {isMyOrder && order.status === "active" && (
            <div className="mb-0">
              <div className="text-sm font-bold text-gray-900 mb-2 px-1">
                {t("orders.bottomSheet.offers")}
              </div>
              {pendingOffers.length === 0 ? (
                <div className="text-sm text-gray-500 px-2 py-2 text-center bg-gray-50/50 rounded-lg">
                  {t("orders.bottomSheet.noOffers")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="border-2 border-gray-200 rounded-xl p-3 bg-gradient-to-br from-white to-gray-50/50 shadow-sm"
                    >
                      {/* Информация о водителе */}
                      {offer.driver && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            {/* Надпись "Ваш водитель" для принятых офферов */}
                            {offer.status === "accepted" && (
                              <div className="text-xs font-bold text-green-600 mb-1 px-2 py-0.5 bg-green-50 rounded-md inline-block">
                                {t("orders.bottomSheet.yourDriver")}
                              </div>
                            )}
                            <div className="text-base font-bold text-gray-900 truncate mb-1">
                              {offer.driver.name || "Водитель"}
                            </div>
                            {offer.driver.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="text-yellow-500" size={14} fill="currentColor" />
                                <span className="text-sm font-semibold text-gray-700">
                                  {offer.driver.rating}
                                  {offer.driver.rating_count && (
                                    <span className="text-gray-500 font-normal"> ({offer.driver.rating_count})</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          {offer.driver.phone && (
                            <button
                              onClick={() => handleCall(offer.driver.phone)}
                              className="flex-shrink-0 px-3 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1.5 text-sm font-semibold shadow-md"
                              aria-label={t("orders.popup.phone")}
                            >
                              <Phone className="w-4 h-4" />
                              <span>{t("orders.myOrderActions.callDriver")}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Информация о машине */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {offer.carModel && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 border border-gray-200">
                            <Car className="text-gray-700 flex-shrink-0" size={16} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-gray-500 leading-tight mb-0.5">Модель</span>
                              <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                {offer.carModel}
                              </span>
                            </div>
                          </div>
                        )}
                        {offer.carColor && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 border border-gray-200">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-gray-500 leading-tight mb-0.5">Цвет</span>
                              <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                {offer.carColor}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {offer.numberCar && (
                        <div className="text-sm text-gray-700 mb-2 px-2.5 py-1.5 bg-white/70 rounded-lg border border-gray-200">
                          <span className="font-medium">Номер:</span> <span className="font-bold">{offer.numberCar}</span>
                        </div>
                      )}

                      {/* Цена оффера */}
                      {offer.price && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-50/70 border border-yellow-200 mb-2">
                          <DollarSign className="text-yellow-600 flex-shrink-0" size={16} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-gray-500 leading-tight mb-0.5">{t("orders.popup.price")}</span>
                            <span className="text-base font-bold text-gray-900 truncate leading-tight">
                              {Number(offer.price).toLocaleString()} сум
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Статус оффера */}
                      {offer.status === "accepted" && (
                        <div className="text-sm text-green-600 font-bold mb-2 px-2 py-1 bg-green-50 rounded-lg">
                          ✓ Принят
                        </div>
                      )}

                      {/* Кнопки действий для pending офферов */}
                      {offer.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            onClick={() => onAcceptOffer && onAcceptOffer(offer.id)}
                            className="flex-1 h-10 text-sm px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                          >
                            <CircleCheck className="w-4 h-4 mr-1.5" />
                            {t("orders.bottomSheet.acceptOffer")}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => onRejectOffer && onRejectOffer(offer.id)}
                            variant="outline"
                            className="flex-1 h-10 text-sm px-3 border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            {t("orders.bottomSheet.rejectOffer")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Кнопки действий - для моих заказов (активные) */}
        {isMyOrder && order.status === "active" && (
          <div className="px-3 pb-2 pt-2 flex gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onEdit(order);
                  onClose();
                }}
                className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs"
              >
                <Pencil className="w-4 h-4" />
                {t("orders.myOrderActions.edit")}
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                onClick={() => {
                  onDelete(order);
                  onClose();
                }}
                className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                {t("orders.myOrderActions.delete")}
              </Button>
            )}
          </div>
        )}

        {/* Кнопки действий - для моих заказов (in_progress) */}
        {isMyOrder && order.status === "in_progress" && (
          <div className="px-3 pb-2 pt-1">
            {onComplete && (
              <Button
                type="button"
                onClick={() => {
                  onComplete(order);
                  onClose();
                }}
                className="w-full h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs"
              >
                <CircleCheck className="w-3.5 h-3.5" />
                {t("orders.myOrderActions.complete") || "Завершить"}
              </Button>
            )}
          </div>
        )}
        
        {/* Кнопки действий - только для чужих заказов */}
        {!isMyOrder && (
          <div className="px-2.5 pb-1 pt-1.5 border-t border-gray-200 flex gap-2 flex-shrink-0 bg-white sticky bottom-0">
            <Button
              type="button"
              onClick={hasUserOffer ? onCancel : onSubmit}
              className={`flex-1 h-9 rounded-xl text-xs ${
                hasUserOffer
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {hasUserOffer
                ? t("orders.bottomSheet.cancelRequest")
                : t("orders.bottomSheet.sendRequest")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderBottomSheet;