import React, { useMemo } from "react";
import { X, Route, Calendar, Clock, Users, DollarSign, MessageSquare, Car, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";

function CompletedOrderBottomSheet({ order, onClose }) {
  const { t } = useI18n();

  if (!order) return null;

  const fromAddress = order.from_address || order.from_city || order.from || "";
  const toAddress = order.to_address || order.to_city || order.to || "";
  const time = order.time ? (order.time.includes(":") ? order.time.substring(0, 5) : order.time) : "";

  // Находим принятый оффер (status === "accepted")
  const acceptedOffer = useMemo(() => {
    if (!order.driver_offers || !Array.isArray(order.driver_offers)) {
      return null;
    }
    return order.driver_offers.find((offer) => offer.status === "accepted");
  }, [order.driver_offers]);

  const driver = acceptedOffer?.driver || null;

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
      
      {/* Bottom Sheet - компактный размер */}
      <div className="bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 max-h-[45vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
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
        <div className="px-3 pt-0 pb-2 overflow-y-auto flex-1">
          {/* Маршрут - минималистичный компактный дизайн */}
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50/30">
              <img src="/passenger.png" alt="From" className="flex-shrink-0" style={{ width: '14px', height: '14px' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-400 leading-tight">{t("orders.form.from")}</div>
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight">{fromAddress}</div>
              </div>
            </div>
            
            <div className="flex justify-center -my-0.5 px-1">
              <Route className="text-blue-500" size={12} />
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50/30">
              <img src="/toAddress.png" alt="To" className="flex-shrink-0" style={{ width: '14px', height: '14px' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-400 leading-tight">{t("orders.form.to")}</div>
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight">{toAddress}</div>
              </div>
            </div>
          </div>

          {/* Детали заказа - компактная сетка */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
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
          <div className="grid grid-cols-2 gap-1.5 mb-2">
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
            <div className="mb-2 px-2 py-1 rounded-md bg-gray-50/30">
              <div className="flex items-start gap-1.5">
                <MessageSquare className="text-gray-600 flex-shrink-0 mt-0.5" size={12} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-gray-400 mb-0.5 leading-tight">{t("orders.popup.comment")}</div>
                  <div className="text-[11px] text-gray-900 break-words leading-tight line-clamp-2">{order.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Информация о водителе (если есть принятый оффер) */}
          {acceptedOffer && driver && (
            <div className="mb-2 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
              {/* Имя водителя и рейтинг */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-gray-900 truncate">
                    {driver?.name || acceptedOffer?.driver?.name || t("common.driver")}
                  </div>
                  {driver?.rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="text-yellow-500" size={10} fill="currentColor" />
                      <span className="text-[9px] text-gray-600">
                        {driver.rating}
                        {driver.rating_count && (
                          <span className="text-gray-400"> ({driver.rating_count})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Информация о машине */}
              {acceptedOffer.carModel && (
                <div className="grid grid-cols-2 gap-1.5">
                  {acceptedOffer.carModel && (
                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/50">
                      <Car className="text-gray-600 flex-shrink-0" size={10} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] text-gray-400 leading-tight">Модель</span>
                        <span className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                          {acceptedOffer.carModel}
                        </span>
                      </div>
                    </div>
                  )}
                  {acceptedOffer.numberCar && (
                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/50">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] text-gray-400 leading-tight">{t("common.number")}</span>
                        <span className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                          {acceptedOffer.numberCar}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Кнопки действий */}
        {driver && driverPhone && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-200 flex gap-2">
            <Button
              type="button"
              onClick={() => handleCall(driverPhone)}
              className="flex-1 h-10 rounded-2xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              {t("orders.history.callDriver")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompletedOrderBottomSheet;
