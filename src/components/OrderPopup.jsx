import React, { useEffect } from "react";
import { X, MapPin, Route, Calendar, Clock, Users, DollarSign, MessageSquare, User, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/app/i18n.jsx";

function OrderPopup({ order, onClose }) {
  const { t } = useI18n();
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!order) return null;

  const fromAddress = order.from_address || order.from_city || order.from || "";
  const toAddress = order.to_address || order.to_city || order.to || "";
  const time = order.time ? (order.time.includes(":") ? order.time.substring(0, 5) : order.time) : "";
  const passenger = order.passenger || {};

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in-0 zoom-in-95 duration-200"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border-2 ring-1 ring-blue-200/60 bg-card/95 backdrop-blur-sm rounded-3xl"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-5 sm:p-6 flex flex-col gap-4 relative overflow-y-auto max-h-[90vh]">
          {/* Заголовок с кнопкой закрытия */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-primary">
              {t("orders.popup.passenger")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-red-100/50 hover:text-red-600 transition-colors"
              aria-label={t("orders.popup.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Маршрут */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-4 bg-white/90 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1.5 font-medium">{t("orders.form.from")}</div>
                <div className="text-sm sm:text-base font-bold text-gray-900 break-words leading-relaxed">{fromAddress}</div>
              </div>
            </div>
            
            <div className="flex justify-center -my-1">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200">
                <Route className="text-blue-600" size={20} />
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white/90 rounded-2xl border border-red-100/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="text-red-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1.5 font-medium">{t("orders.form.to")}</div>
                <div className="text-sm sm:text-base font-bold text-gray-900 break-words leading-relaxed">{toAddress}</div>
              </div>
            </div>
          </div>

          {/* Дата и время */}
          <div className="flex items-center gap-4 p-3 bg-white/80 rounded-xl border border-gray-100/50">
            {order.date && (
              <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                <Calendar className="text-blue-600" size={18} />
                <span className="font-medium">{order.date}</span>
              </div>
            )}
            {time && (
              <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                <Clock className="text-blue-600" size={18} />
                <span className="font-medium">{time}</span>
              </div>
            )}
          </div>

          {/* Информация о пассажире */}
          {passenger && (passenger.name || passenger.phone || passenger.rating) && (
            <div className="flex items-center gap-3 p-4 bg-white/90 rounded-xl border border-gray-100/50 shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200">
                <User className="text-blue-600" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                {passenger.name && (
                  <div className="font-bold text-base text-gray-900 truncate mb-1">
                    {passenger.name}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {passenger.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span>{passenger.phone}</span>
                    </div>
                  )}
                  {passenger.rating && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      <span className="font-medium">{passenger.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Детали заказа */}
          <div className="grid grid-cols-2 gap-3">
            {order.seats && (
              <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-gray-100/50 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="text-green-600" size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-500 font-medium">{t("orders.popup.seats")}</span>
                  <span className="text-base font-bold text-gray-900">{order.seats}</span>
                </div>
              </div>
            )}
            {order.amount && (
              <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-gray-100/50 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <DollarSign className="text-yellow-600" size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-500 font-medium">{t("orders.popup.price")}</span>
                  <span className="text-base font-bold text-gray-900">
                    {Number(order.amount).toLocaleString()} сум
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Комментарий */}
          {order.comment && (
            <div className="p-4 bg-white/90 rounded-xl border border-gray-100/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="text-purple-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-2 font-medium">{t("orders.popup.comment")}</div>
                  <div className="text-sm text-gray-900 break-words leading-relaxed">{order.comment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Статус */}
          {order.status && (
            <div className="flex items-center justify-center pt-2">
              <span
                className={`text-xs sm:text-sm py-2 px-4 rounded-full font-semibold ${
                  order.status === "active"
                    ? "bg-green-100 text-green-800 border-2 border-green-200"
                    : order.status === "completed"
                    ? "bg-blue-100 text-blue-800 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-800 border-2 border-gray-200"
                }`}
              >
                {order.status === "active"
                  ? t("orders.popup.statusActive")
                  : order.status === "completed"
                  ? t("orders.popup.statusCompleted")
                  : order.status === "cancelled"
                  ? t("orders.popup.statusCancelled")
                  : order.status}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderPopup;