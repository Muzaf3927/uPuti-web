import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/app/i18n.jsx";
import { postData } from "@/api/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

function DriverOfferDialog({ order, open, onOpenChange, onSuccess }) {
  const { t } = useI18n();
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [numberCar, setNumberCar] = useState("");
  const [price, setPrice] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Создаем мутацию для отправки оффера с динамическим URL
  const offerMutation = useMutation({
    mutationFn: async (offerData) => {
      if (!order?.id) {
        throw new Error("Order ID is required");
      }
      return postData(`/passenger-requests/${order.id}/offer`, offerData);
    },
  });

  // Валидация номера машины (формат: 01A000AA - 2 цифры, 1 латинская буква, 3 цифры, 2 латинские буквы)
  const validateCarNumber = (number) => {
    const regex = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/;
    return regex.test(number);
  };

  const validateForm = () => {
    const errors = {};

    if (!carModel?.trim()) {
      errors.carModel = t("trips.form.validation.carModelRequired");
    }
    if (!carColor?.trim()) {
      errors.carColor = t("trips.form.validation.carColorRequired");
    }
    if (!numberCar?.trim()) {
      errors.numberCar = t("trips.form.validation.carNumberRequired");
    } else if (!validateCarNumber(numberCar)) {
      errors.numberCar = t("orders.offerForm.validation.carNumberFormat");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (offerMutation.isPending) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("orders.offerForm.validationError"));
      return;
    }

    setFormErrors({});

    try {
      // Всегда используем цену из заказа, а не из поля
      const orderPrice = order?.amount ? Number(order.amount) : null;
      const offerData = {
        carModel: carModel.trim(),
        carColor: carColor.trim(),
        numberCar: numberCar.toUpperCase().trim(),
        price: orderPrice && orderPrice > 0 ? orderPrice : null,
      };

      const res = await offerMutation.mutateAsync(offerData);
      
      if (res.message === "Driver offer created!" || res.offer?.id) {
        toast.success(t("orders.offerForm.successMessage"));
        // Сброс формы
        setCarModel("");
        setCarColor("");
        setNumberCar("");
        setPrice("");
        setFormErrors({});
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Error creating driver offer:", err);
      
      let errorMessage = t("orders.offerForm.errorMessage");
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        errorMessage = errorMessages.join(", ");
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  const handleCarNumberChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "");
    // Ограничиваем длину до 8 символов
    if (value.length <= 8) {
      setNumberCar(value);
      // Очищаем ошибку при вводе
      if (formErrors.numberCar) {
        setFormErrors({ ...formErrors, numberCar: "" });
      }
    }
  };

  // Убираем обработчик изменения цены, так как цена теперь только из заказа
  // const handlePriceChange = (e) => {
  //   const digits = e.target.value.replace(/\D/g, "");
  //   const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  //   setPrice(formatted);
  // };

  // Автоматически заполняем цену заказа при открытии диалога
  useEffect(() => {
    if (open && order?.amount) {
      const orderPrice = Number(order.amount);
      if (orderPrice && orderPrice > 0) {
        const formatted = orderPrice.toLocaleString().replace(/,/g, " ");
        setPrice(formatted);
      }
    } else if (!open) {
      // Сбрасываем форму при закрытии диалога
      setCarModel("");
      setCarColor("");
      setNumberCar("");
      setPrice("");
      setFormErrors({});
    }
  }, [open, order?.amount]);

  // Всегда используем цену из заказа, даже если пользователь пытается изменить
  useEffect(() => {
    if (order?.amount) {
      const orderPrice = Number(order.amount);
      if (orderPrice && orderPrice > 0) {
        const formatted = orderPrice.toLocaleString().replace(/,/g, " ");
        if (price !== formatted) {
          setPrice(formatted);
        }
      }
    }
  }, [order?.amount]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6 rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-[calc(100svh-2rem)] overflow-y-auto"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold mb-2">
            {t("orders.offerForm.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600 mb-4">
            {t("orders.offerForm.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Модель машины */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="carModel" className="text-sm">
              {t("trips.form.carModel")} *
            </Label>
            <Input
              id="carModel"
              type="text"
              value={carModel}
              onChange={(e) => {
                setCarModel(e.target.value);
                if (formErrors.carModel) {
                  setFormErrors({ ...formErrors, carModel: "" });
                }
              }}
              placeholder={t("trips.form.carModelPlaceholder")}
              className={`${formErrors.carModel ? "border-red-500" : ""} bg-white h-9 text-sm`}
              required
            />
            {formErrors.carModel && (
              <span className="text-red-500 text-xs">{formErrors.carModel}</span>
            )}
          </div>

          {/* Цвет и номер машины */}
          <div className="grid grid-cols-2 gap-3">
            {/* Цвет машины */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="carColor" className="text-sm">
                {t("trips.form.carColor")} *
              </Label>
              <Input
                id="carColor"
                type="text"
                value={carColor}
                onChange={(e) => {
                  setCarColor(e.target.value);
                  if (formErrors.carColor) {
                    setFormErrors({ ...formErrors, carColor: "" });
                  }
                }}
                placeholder={t("trips.form.carColorPlaceholder")}
                className={`${formErrors.carColor ? "border-red-500" : ""} bg-white h-9 text-sm`}
                required
              />
              {formErrors.carColor && (
                <span className="text-red-500 text-xs">{formErrors.carColor}</span>
              )}
            </div>

            {/* Номер машины */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numberCar" className="text-sm">
                {t("trips.form.carNumber")} *
              </Label>
              <Input
                id="numberCar"
                type="text"
                value={numberCar}
                onChange={handleCarNumberChange}
                placeholder={t("trips.form.carNumberPlaceholder")}
                className={`uppercase ${formErrors.numberCar ? "border-red-500" : ""} bg-white h-9 text-sm`}
                maxLength={8}
                required
              />
              {formErrors.numberCar && (
                <span className="text-red-500 text-xs">{formErrors.numberCar}</span>
              )}
            </div>
          </div>

          {/* Цена (автоматически из заказа, недоступна для редактирования) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price" className="text-sm">
              {t("orders.offerForm.price")}
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                value={price}
                readOnly
                disabled
                placeholder={t("orders.offerForm.pricePlaceholder")}
                className="pr-16 bg-transparent border-transparent text-gray-400 cursor-not-allowed h-9 text-sm opacity-60"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 opacity-60">
                сум
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 opacity-70">
              {t("orders.offerForm.priceFromOrder") || "Цена автоматически берется из заказа"}
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-2xl"
              disabled={offerMutation.isPending}
            >
              {t("orders.offerForm.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={offerMutation.isPending}
              className="flex-1 h-10 rounded-2xl bg-primary text-primary-foreground"
            >
              {offerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {t("orders.offerForm.submitting")}
                </span>
              ) : (
                t("orders.offerForm.submit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DriverOfferDialog;
