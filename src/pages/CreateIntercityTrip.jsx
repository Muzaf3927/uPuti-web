import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TimePicker from "@/components/ui/time-picker";
import DatePicker from "@/components/ui/date-picker";
import { usePostData } from "@/api/api";
import { X, Loader2, ArrowLeft, Plus, Minus, MapPin, Route } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function CreateIntercityTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createTripMutation = usePostData("/trips");

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [tripDate, setTripDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tripTime, setTripTime] = useState("12:00");
  const [amountInput, setAmountInput] = useState("");
  const [seats, setSeats] = useState(1);
  const [comment, setComment] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!tripDate?.trim()) {
      errors.date = "Дата обязательна";
    }
    if (!tripTime?.trim()) {
      errors.time = "Время обязательно";
    }
    if (!amountInput?.trim()) {
      errors.amount = "Сумма обязательна";
    }
    if (!seats || seats < 1 || seats > 4) {
      errors.seats = "Количество мест должно быть от 1 до 4";
    }
    
    return errors;
  };

  // Проверка, все ли обязательные поля заполнены
  const isFormValid = () => {
    return tripDate && tripTime && amountInput && seats >= 1 && seats <= 4;
  };

  // Функции для управления количеством мест
  const handleDecreaseSeats = () => {
    setSeats((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseSeats = () => {
    setSeats((prev) => Math.min(4, prev + 1));
  };

  // Обработчик отправки формы
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Заполните все обязательные поля");
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const amount = parseInt(amountInput.replace(/\s/g, ""), 10);

    const tripData = {
      from_address: fromAddress || null,
      to_address: toAddress || null,
      date: tripDate,
      time: tripTime,
      amount: amount,
      seats: seats,
      comment: comment || null,
      role: "driver",
    };

    try {
      const res = await createTripMutation.mutateAsync(tripData);
      if (res.message === "Trip created!" || res.id) {
        toast.success("Поездка успешно создана!");
        
        // Обновляем список поездок
        queryClient.invalidateQueries({ queryKey: ["data"] });
        
        // Возвращаемся назад
        navigate("/intercity");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Не удалось создать поездку. Попробуйте еще раз.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/intercity")}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Назад"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-primary">Создать поездку</h1>
          <div className="w-10" /> {/* Spacer для центрирования */}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6">
        <form onSubmit={handleCreateTrip} className="flex flex-col gap-4">
          {/* Откуда */}
          <div className="grid items-center gap-1.5">
            <Label htmlFor="from_address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Откуда
            </Label>
            <Input
              type="text"
              id="from_address"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="Город отправления"
              className="bg-white h-11"
            />
          </div>

          {/* Куда */}
          <div className="grid items-center gap-1.5">
            <Label htmlFor="to_address" className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              Куда
            </Label>
            <Input
              type="text"
              id="to_address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="Город назначения"
              className="bg-white h-11"
            />
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date" className="text-sm">Дата *</Label>
              <DatePicker
                id="date"
                value={tripDate}
                onChange={setTripDate}
                size="sm"
                dropdownMaxHeight={192}
                minDate={new Date().toISOString().split('T')[0]}
                className={`w-full h-11 ${formErrors.date ? "border-red-500" : ""} bg-white`}
              />
              {formErrors.date && <span className="text-red-500 text-xs">{formErrors.date}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="time" className="text-sm">Время *</Label>
              <TimePicker
                id="time"
                value={tripTime}
                onChange={setTripTime}
                size="sm"
                dropdownMaxHeight={112}
                className={`w-full h-11 ${formErrors.time ? "border-red-500" : ""} bg-white`}
              />
              {formErrors.time && <span className="text-red-500 text-xs">{formErrors.time}</span>}
            </div>
          </div>

          {/* Сумма и места */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="amount">Сумма (сум) *</Label>
              <div className="relative">
                <Input
                  type="text"
                  id="amount"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                    setAmountInput(formatted);
                  }}
                  placeholder="0"
                  required
                  className={`${formErrors.amount ? "border-red-500" : ""} pr-12 bg-white h-11`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">сум</span>
              </div>
              {formErrors.amount && <span className="text-red-500 text-xs">{formErrors.amount}</span>}
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="seats">Места *</Label>
              <div className="flex items-center gap-1.5 bg-white border rounded-lg h-11 px-3">
                <button
                  type="button"
                  onClick={handleDecreaseSeats}
                  disabled={seats <= 1}
                  className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Уменьшить количество"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="flex-1 text-center text-sm font-medium">{seats}</span>
                <button
                  type="button"
                  onClick={handleIncreaseSeats}
                  disabled={seats >= 4}
                  className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Увеличить количество"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              {formErrors.seats && <span className="text-red-500 text-xs">{formErrors.seats}</span>}
            </div>
          </div>

          {/* Комментарий */}
          <div className="grid items-center gap-1.5">
            <Label htmlFor="comment">Комментарий</Label>
            <Input
              type="text"
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительная информация (необязательно)"
              className="bg-white h-11"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/intercity")}
              className="flex-1 h-12 rounded-xl"
            >
              Отменить
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className={`flex-1 h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                isFormValid() && !isSubmitting
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Создание...
                </span>
              ) : (
                "Создать"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateIntercityTrip;

