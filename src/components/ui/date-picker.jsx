import React, { useState, useEffect } from "react";
import { Button } from "./button";

const DatePicker = ({ id, value, onChange, className = "", size = "md", minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // По умолчанию используем сегодняшнюю дату, если value не задан
  const getDefaultDate = () => {
    if (value) return value;
    return new Date().toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      const date = new Date(value);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  // Форматируем дату в формат ДД.ММ.ГГГГ
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
  };

  // Получаем название месяца
  const getMonthName = (date) => {
    const months = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    return months[date.getMonth()];
  };

  // Генерируем календарь для текущего месяца
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 = воскресенье, 1 = понедельник, ...)
    const firstDayOfWeek = firstDay.getDay();
    // Количество дней в месяце
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = (day) => {
    if (day === null) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    
    // Проверяем минимальную дату
    if (minDate) {
      const minDateObj = new Date(minDate);
      if (date < minDateObj) return;
    }
    
    setSelectedDate(dateString);
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarDays = generateCalendar();
  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  return (
    <div className={`relative ${className}`}>
      <Button
        id={id}
        type="button"
        variant="outline"
        className={`w-full ${size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm"} rounded-md border-input bg-white text-left focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedDate ? formatDate(selectedDate) : "Выберите дату"}</span>
      </Button>

      {isOpen && (
        <div className={`absolute top-full left-0 z-50 mt-1 bg-white border border-input rounded-lg shadow-xl w-[260px] sm:w-[300px] md:w-[340px] ${size === "sm" ? "text-sm" : ""}`}>
          {/* Заголовок календаря с навигацией */}
          <div className="flex items-center justify-between p-2 sm:p-3 border-b">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Предыдущий месяц"
            >
              <span className="text-lg sm:text-xl font-semibold">‹</span>
            </button>
            <div className="font-semibold text-sm sm:text-base">
              {getMonthName(currentMonth)} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Следующий месяц"
            >
              <span className="text-lg sm:text-xl font-semibold">›</span>
            </button>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 p-2 sm:p-3 pb-1.5 sm:pb-2">
            {dayNames.map((dayName) => (
              <div
                key={dayName}
                className={`text-center ${size === "sm" ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"} font-semibold text-gray-600 py-1`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Дни месяца */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 p-2 sm:p-3 pt-0">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-8 sm:h-9 md:h-10" />;
              }

              const year = currentMonth.getFullYear();
              const month = currentMonth.getMonth();
              const date = new Date(year, month, day);
              const dateString = date.toISOString().split('T')[0];
              const isSelected = dateString === selectedDate;
              const isToday = dateString === todayString;
              
              // Проверяем минимальную дату
              let isDisabled = false;
              if (minDate) {
                const minDateObj = new Date(minDate);
                isDisabled = date < minDateObj;
              }

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ${size === "sm" ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"} rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isToday
                      ? 'bg-primary/20 text-primary font-medium'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Закрыть при клике вне компонента */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DatePicker;
