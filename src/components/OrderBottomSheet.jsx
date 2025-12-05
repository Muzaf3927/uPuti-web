import React, { useMemo } from "react";
import { X, MapPin, Route, Calendar, Clock, Users, DollarSign, MessageSquare, Car, CircleCheck, Phone, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { sessionManager } from "@/lib/sessionManager";

function OrderBottomSheet({ order, onClose, onSubmit, onCancel, onAcceptOffer, onRejectOffer, onRefresh, onEdit, onDelete }) {
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
      <div className="bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 h-[50vh] max-h-[50vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label={t("orders.popup.close")}
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="px-3 pt-1 pb-2 overflow-y-auto flex-1">
          {/* Маршрут - минималистичный компактный дизайн */}
          <div className="flex flex-col gap-1 mb-2.5">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50/30">
              <MapPin className="text-blue-600 flex-shrink-0" size={14} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-400 leading-tight">{t("orders.form.from")}</div>
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight">{fromAddress}</div>
              </div>
            </div>
            
            <div className="flex justify-center -my-0.5 px-1">
              <Route className="text-blue-500" size={12} />
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50/30">
              <MapPin className="text-red-600 flex-shrink-0" size={14} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-400 leading-tight">{t("orders.form.to")}</div>
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight">{toAddress}</div>
              </div>
            </div>
          </div>

          {/* Детали заказа - компактная сетка */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {/* Дата */}
            {order.date && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-gray-50/30">
                <Calendar className="text-blue-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.form.date")}</span>
                  <span className="text-[11px] font-medium text-gray-900 leading-tight">{order.date}</span>
                </div>
              </div>
            )}
            
            {/* Время */}
            {time && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-gray-50/30">
                <Clock className="text-blue-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.form.time")}</span>
                  <span className="text-[11px] font-medium text-gray-900 leading-tight">{time}</span>
                </div>
              </div>
            )}
          </div>

          {/* Количество мест и сумма - компактная сетка */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {/* Количество пассажиров */}
            {order.seats && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-green-50/30">
                <Users className="text-green-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.popup.seats")}</span>
                  <span className="text-[11px] font-medium text-gray-900 leading-tight">{order.seats}</span>
                </div>
              </div>
            )}
            
            {/* Сумма */}
            {order.amount && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-yellow-50/30">
                <DollarSign className="text-yellow-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.popup.price")}</span>
                  <span className="text-[11px] font-medium text-gray-900 truncate leading-tight">
                    {Number(order.amount).toLocaleString()} сум
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Комментарий */}
          {order.comment && (
            <div className="mb-2.5 px-2 py-1 rounded-md bg-gray-50/30">
              <div className="flex items-start gap-1.5">
                <MessageSquare className="text-gray-600 flex-shrink-0 mt-0.5" size={12} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-gray-400 mb-0.5 leading-tight">{t("orders.popup.comment")}</div>
                  <div className="text-[11px] text-gray-900 break-words leading-tight line-clamp-2">{order.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Если это мой заказ - показываем список офферов */}
          {isMyOrder && (
            <div className="mb-2.5">
              <div className="text-[11px] font-semibold text-gray-900 mb-1.5 px-1">
                {t("orders.bottomSheet.offers")}
              </div>
              {pendingOffers.length === 0 ? (
                <div className="text-[10px] text-gray-500 px-2 py-1.5 text-center">
                  {t("orders.bottomSheet.noOffers")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="border border-gray-200 rounded-lg p-2 bg-gray-50/50"
                    >
                      {/* Информация о водителе */}
                      {offer.driver && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-gray-900 truncate">
                              {offer.driver.name || "Водитель"}
                            </div>
                            {offer.driver.rating && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="text-yellow-500" size={10} fill="currentColor" />
                                <span className="text-[9px] text-gray-600">
                                  {offer.driver.rating}
                                  {offer.driver.rating_count && (
                                    <span className="text-gray-400"> ({offer.driver.rating_count})</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          {offer.driver.phone && (
                            <button
                              onClick={() => handleCall(offer.driver.phone)}
                              className="flex-shrink-0 p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                              aria-label={t("orders.popup.phone")}
                            >
                              <Phone className="text-blue-600" size={12} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Информация о машине */}
                      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        {offer.carModel && (
                          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/50">
                            <Car className="text-gray-600 flex-shrink-0" size={10} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] text-gray-400 leading-tight">Модель</span>
                              <span className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                                {offer.carModel}
                              </span>
                            </div>
                          </div>
                        )}
                        {offer.carColor && (
                          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/50">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] text-gray-400 leading-tight">Цвет</span>
                              <span className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                                {offer.carColor}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {offer.numberCar && (
                        <div className="text-[10px] text-gray-600 mb-1.5 px-1.5">
                          Номер: <span className="font-medium">{offer.numberCar}</span>
                        </div>
                      )}

                      {/* Цена оффера */}
                      {offer.price && (
                        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-yellow-50/50 mb-1.5">
                          <DollarSign className="text-yellow-600 flex-shrink-0" size={10} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] text-gray-400 leading-tight">{t("orders.popup.price")}</span>
                            <span className="text-[11px] font-medium text-gray-900 truncate leading-tight">
                              {Number(offer.price).toLocaleString()} сум
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Статус оффера */}
                      {offer.status === "accepted" && (
                        <div className="text-[9px] text-green-600 font-medium mb-1.5 px-1.5">
                          ✓ Принят
                        </div>
                      )}

                      {/* Кнопки действий для pending офферов */}
                      {offer.status === "pending" && (
                        <div className="flex gap-1.5 mt-1.5">
                          <Button
                            type="button"
                            onClick={() => onAcceptOffer && onAcceptOffer(offer.id)}
                            className="flex-1 h-8 text-[10px] px-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          >
                            <CircleCheck className="w-3 h-3 mr-1" />
                            {t("orders.bottomSheet.acceptOffer")}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => onRejectOffer && onRejectOffer(offer.id)}
                            variant="outline"
                            className="flex-1 h-8 text-[10px] px-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-3 h-3 mr-1" />
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
          <div className="px-5 pb-5 pt-3 border-t border-gray-200 flex gap-3">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onEdit(order);
                  onClose();
                }}
                className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2"
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
                className="flex-1 h-11 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t("orders.myOrderActions.delete")}
              </Button>
            )}
          </div>
        )}
        
        {/* Кнопки действий - только для чужих заказов */}
        {!isMyOrder && (
          <div className="px-5 pb-5 pt-3 border-t border-gray-200 flex gap-3">
            <Button
              type="button"
              onClick={hasUserOffer ? onCancel : onSubmit}
              className={`flex-1 h-11 rounded-2xl ${
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