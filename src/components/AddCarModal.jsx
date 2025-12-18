import React, { useState, useEffect } from "react";
import { Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/app/i18n.jsx";
import { postData, useGetData } from "@/api/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import TelegramConnectModal from "./TelegramConnectModal";

function AddCarModal({ onCarAdded, userData }) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const { data: updatedUserData, refetch: refetchUser } = useGetData("/user");
  
  
  // Проверяем, есть ли уже машина у пользователя
  const hasCar = userData?.car && (userData.car.model || userData.car.number);
  
  // Инициализируем форму данными машины, если они есть
  const [formData, setFormData] = useState({
    model: "",
    color: "",
    number: "",
  });
  const [errors, setErrors] = useState({});
  
  // Обновляем форму при изменении userData
  useEffect(() => {
    if (userData?.car) {
      setFormData({
        model: userData.car.model || "",
        color: userData.car.color || "",
        number: userData.car.number || "",
      });
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.number || formData.number.trim() === "") {
      newErrors.number = "Номер машины обязателен";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await postData("/car/driver", {
        model: formData.model || null,
        color: formData.color || null,
        number: formData.number.trim().toUpperCase(),
      });

      toast.success("Машина успешно добавлена");
      
      // После успешного добавления машины проверяем telegram_chat_id для водителей
      // Обновляем данные пользователя перед проверкой
      // Обрабатываем ошибку refetchUser отдельно, чтобы не показывать ошибку, если основная операция успешна
      try {
        const { data: freshUserData } = await refetchUser();
        
        // Проверяем наличие telegram_chat_id
        const hasTelegram = freshUserData?.telegram_chat_id && freshUserData.telegram_chat_id.trim() !== "";
        
        if (!hasTelegram) {
          // Если нет telegram_chat_id, открываем модальное окно Telegram
          setTelegramModalOpen(true);
          // Не закрываем модальное окно добавления машины, пока не закроется Telegram модальное окно
          // Модальное окно добавления машины закроется в обработчике закрытия Telegram модального окна
          return;
        }
      } catch (refetchError) {
        // Ошибка при обновлении данных пользователя не критична, так как машина уже добавлена
        // Просто логируем ошибку, но не показываем toast.error
        console.warn("Не удалось обновить данные пользователя после добавления машины:", refetchError);
        // Продолжаем выполнение - закрываем модальное окно
      }
      
      // Если есть telegram_chat_id или произошла ошибка при обновлении, закрываем модальное окно добавления машины
      if (onCarAdded) {
        onCarAdded(response);
      }
    } catch (error) {
      console.error("Ошибка при добавлении машины:", error);
      const errorMessage = error?.response?.data?.message || "Ошибка при добавлении машины";
      toast.error(errorMessage);
      
      // Если ошибка связана с уникальностью номера
      if (error?.response?.data?.errors?.number) {
        setErrors({ number: "Этот номер уже используется" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-white via-green-50/40 to-green-100/30 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        // При редактировании можно закрыть кликом на backdrop, при первом добавлении - нельзя
        if (!hasCar && e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        } else if (hasCar && e.target === e.currentTarget) {
          // При редактировании закрываем модальное окно
          e.preventDefault();
          e.stopPropagation();
          if (onCarAdded) {
            onCarAdded(null);
          }
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-gradient-to-br from-white via-green-50/50 to-green-100/30 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-green-200/60 relative z-[100000] backdrop-blur-sm"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.05))",
          boxShadow: "0 20px 60px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1)",
          pointerEvents: 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Кнопка закрытия при редактировании */}
        {hasCar && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onCarAdded) {
                onCarAdded(null); // Закрываем без сохранения
              }
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/80 transition-all z-[100001] cursor-pointer shadow-sm border border-gray-200/50"
            aria-label="Закрыть"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
        
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {hasCar ? "Обновить информацию о машине" : "Добавить машину"}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-sm mx-auto">
            {hasCar 
              ? "Обновите информацию о вашей машине"
              : "Для работы водителем необходимо добавить информацию о машине"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></span>
              Модель машины
            </Label>
            <Input
              id="model"
              type="text"
              placeholder="Например: Chevrolet Cobalt"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              disabled={isSubmitting}
              className={`h-11 text-sm bg-white/90 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all ${errors.model ? "border-red-500 focus:ring-red-500/20" : ""}`}
            />
            {errors.model && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.model}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></span>
              Цвет
            </Label>
            <Input
              id="color"
              type="text"
              placeholder="Например: Белый"
              value={formData.color}
              onChange={(e) => handleChange("color", e.target.value)}
              disabled={isSubmitting}
              className={`h-11 text-sm bg-white/90 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all ${errors.color ? "border-red-500 focus:ring-red-500/20" : ""}`}
            />
            {errors.color && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.color}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="number" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></span>
              Номер машины <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="number"
              type="text"
              placeholder="Например: 01A123AB"
              value={formData.number}
              onChange={(e) => handleChange("number", e.target.value.toUpperCase())}
              disabled={isSubmitting}
              className={`h-11 text-sm bg-white/90 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all uppercase font-semibold tracking-wider ${errors.number ? "border-red-500 focus:ring-red-500/20" : ""}`}
              required
            />
            {errors.number && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.number}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Car className="w-4 h-4" />
                  {hasCar ? "Обновить" : "Добавить"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Модальное окно для подключения Telegram */}
      <TelegramConnectModal 
        open={telegramModalOpen} 
        onOpenChange={async (open) => {
          if (!open) {
            setTelegramModalOpen(false);
            // Обновляем данные пользователя после закрытия модального окна
            await refetchUser();
            // Закрываем модальное окно добавления машины
            if (onCarAdded) {
              onCarAdded(null);
            }
          }
        }}
        onCloseParent={() => setTelegramModalOpen(false)}
      />
    </div>
  );
}

export default AddCarModal;
