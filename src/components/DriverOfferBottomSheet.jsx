import React, { useMemo } from "react";
import { X, Route, Calendar, Clock, Users, DollarSign, MessageSquare, Car, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { useGetData } from "@/api/api";

function DriverOfferBottomSheet({ offer, onClose }) {
  const { t } = useI18n();

  if (!offer) return null;

  const request = offer.passengerRequest || offer.passenger_request || offer.passenger_request_data || {};
  
  // Получаем user_id из passenger_request
  const passengerUserId = request.user_id || offer.passenger?.id || offer.passenger?.user_id;
  
  // Получаем данные пользователя по user_id
  const { data: passengerData } = useGetData(
    passengerUserId ? `/users/${passengerUserId}` : null
  );
  
  // Используем данные из API или из offer (если они там есть)
  const passenger = passengerData || offer.passenger || {};
  
  const fromAddress = request.from_address || request.from || "";
  const toAddress = request.to_address || request.to || "";
  const time = request.time ? (request.time.includes(":") ? request.time.substring(0, 5) : request.time) : "";

  // Форматируем телефон пассажира
  const passengerPhone = useMemo(() => {
    const phone = passenger?.phone;
    if (!phone) {
      return null;
    }
    const raw = String(phone);
    if (raw.startsWith("+")) return raw;
    return raw.startsWith("998") ? `+${raw}` : `+998${raw}`;
  }, [passenger?.phone]);

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
            {request.date && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-gray-50/30">
                <Calendar className="text-blue-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.form.date")}</span>
                  <span className="text-[11px] font-medium text-gray-900 leading-tight">{request.date}</span>
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

          {/* Количество мест и сумма заказа/оффера - компактная сетка */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {/* Количество пассажиров */}
            {request.seats && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-green-50/30">
                <Users className="text-green-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.popup.seats")}</span>
                  <span className="text-[11px] font-medium text-gray-900 leading-tight">{request.seats}</span>
                </div>
              </div>
            )}
            
            {/* Цена оффера */}
            {offer.price && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-yellow-50/30">
                <DollarSign className="text-yellow-600 flex-shrink-0" size={12} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 leading-tight">{t("orders.popup.price")}</span>
                  <span className="text-[11px] font-medium text-gray-900 truncate leading-tight">
                    {Number(offer.price).toLocaleString()} сум
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Комментарий к заказу */}
          {request.comment && (
            <div className="mb-2 px-2 py-1 rounded-md bg-gray-50/30">
              <div className="flex items-start gap-1.5">
                <MessageSquare className="text-gray-600 flex-shrink-0 mt-0.5" size={12} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-gray-400 mb-0.5 leading-tight">{t("orders.popup.comment")}</div>
                  <div className="text-[11px] text-gray-900 break-words leading-tight line-clamp-2">{request.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Информация о пассажире - всегда показываем блок */}
          <div className="mb-2 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
            {/* Имя пассажира и рейтинг */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 mb-0.5">{t("orders.popup.passenger")}</div>
                <div className="text-[12px] font-semibold text-gray-900 truncate">
                  {offer.passenger?.name || passenger?.name || "Не указано"}
                </div>
                {(offer.passenger?.rating || passenger?.rating) && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="text-yellow-500" size={10} fill="currentColor" />
                    <span className="text-[9px] text-gray-600">
                      {offer.passenger?.rating || passenger?.rating}
                    </span>
                  </div>
                )}
              </div>
              {passengerPhone ? (
                <Button
                  type="button"
                  onClick={() => handleCall(passengerPhone)}
                  className="h-8 px-3 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-1.5 text-xs flex-shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t("orders.history.callPassenger")}
                </Button>
              ) : (
                <div className="text-[10px] text-gray-400">Телефон не указан</div>
              )}
            </div>

            {/* Информация о машине (из оффера) */}
            {offer.carModel && (
              <div className="grid grid-cols-2 gap-1.5">
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
                {offer.numberCar && (
                  <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/50">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] text-gray-400 leading-tight">Номер</span>
                      <span className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                        {offer.numberCar}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Статус оффера */}
          <div className="mb-2">
            {(() => {
              const orderStatus = request.status || "";
              const offerStatus = offer.status || "";
              
              // Сначала проверяем статус заказа - если завершен, показываем "Завершен" красным
              if (orderStatus === "completed") {
                return (
                  <span className="text-[10px] sm:text-xs py-1 px-2 rounded-full whitespace-nowrap border bg-red-100 text-red-800 border-red-200">
                    {t("orders.history.completed")}
                  </span>
                );
              }
              
              // Если заказ в процессе (in_progress), показываем "В процессе" зеленым
              if (orderStatus === "in_progress") {
                return (
                  <span className="text-[10px] sm:text-xs py-1 px-2 rounded-full whitespace-nowrap border bg-green-100 text-green-800 border-green-200">
                    В процессе
                  </span>
                );
              }
              
              // Если оффер отклонен
              if (offerStatus === "declined") {
                return (
                  <span className="text-[10px] sm:text-xs py-1 px-2 rounded-full whitespace-nowrap border bg-red-100 text-red-800 border-red-200">
                    {t("orders.history.cancelled")}
                  </span>
                );
              }
              
              // По умолчанию для принятого оффера
              if (offerStatus === "accepted") {
                return (
                  <span className="text-[10px] sm:text-xs py-1 px-2 rounded-full whitespace-nowrap border bg-blue-100 text-blue-800 border-blue-200">
                    Принят
                  </span>
                );
              }
              
              return null;
            })()}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default DriverOfferBottomSheet;
