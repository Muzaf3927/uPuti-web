import React, { useState, useEffect } from "react";
import { Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/app/i18n.jsx";
import { postData } from "@/api/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function AddCarModal({ onCarAdded, userData }) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-8 sm:pt-12 overflow-y-auto"
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
        className="bg-white rounded-xl shadow-2xl p-4 sm:p-5 max-w-sm w-full mx-4 my-4 border border-gray-200 relative z-[100000]"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{ pointerEvents: 'auto' }}
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
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-[100001] cursor-pointer"
            aria-label="Закрыть"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
        
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">
            {hasCar ? "Обновить информацию о машине" : "Добавить машину"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {hasCar 
              ? "Обновите информацию о вашей машине"
              : "Для работы водителем необходимо добавить информацию о машине"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-xs sm:text-sm">Модель машины</Label>
            <Input
              id="model"
              type="text"
              placeholder="Например: Chevrolet Cobalt"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              disabled={isSubmitting}
              className={`h-9 text-sm ${errors.model ? "border-red-500" : ""}`}
            />
            {errors.model && (
              <p className="text-xs text-red-500">{errors.model}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color" className="text-xs sm:text-sm">Цвет</Label>
            <Input
              id="color"
              type="text"
              placeholder="Например: Белый"
              value={formData.color}
              onChange={(e) => handleChange("color", e.target.value)}
              disabled={isSubmitting}
              className={`h-9 text-sm ${errors.color ? "border-red-500" : ""}`}
            />
            {errors.color && (
              <p className="text-xs text-red-500">{errors.color}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="number" className="text-xs sm:text-sm">
              Номер машины <span className="text-red-500">*</span>
            </Label>
            <Input
              id="number"
              type="text"
              placeholder="Например: 01A123AB"
              value={formData.number}
              onChange={(e) => handleChange("number", e.target.value.toUpperCase())}
              disabled={isSubmitting}
              className={`h-9 text-sm ${errors.number ? "border-red-500" : ""}`}
              required
            />
            {errors.number && (
              <p className="text-xs text-red-500">{errors.number}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-9 bg-primary hover:bg-primary/90 text-white text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                hasCar ? "Обновить" : "Добавить"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCarModal;
