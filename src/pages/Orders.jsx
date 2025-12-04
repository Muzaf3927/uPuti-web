import React, { useEffect, useState } from "react";

// components
import OrdersMap from "@/components/OrdersMap";
import RouteSelectorMap from "@/components/RouteSelectorMap";

// icons
import { User, Search, Loader2, X } from "lucide-react";

// router
import { useLocation } from "react-router-dom";

// shad cn
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TimePicker from "@/components/ui/time-picker";

import { useGetData, usePostData } from "@/api/api";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import { useI18n } from "@/app/i18n.jsx";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSmartRefresh } from "@/hooks/useSmartRefresh.jsx";
import EmptyState from "@/components/EmptyState.jsx";

function Orders() {
  const { t } = useI18n();
  const { keyboardInset } = useKeyboardInsets();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("allOrders");
  const [currentStep, setCurrentStep] = useState(1); // 1 - карта, 2 - форма
  
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  // Используем один объект состояния для всех значений маршрута
  const [routeData, setRouteData] = useState({
    from: "",
    to: "",
    fromCoords: null, // { lat, lng }
    toCoords: null, // { lat, lng }
  });
  
  // Для обратной совместимости
  const selectedFrom = routeData.from;
  const selectedTo = routeData.to;
  const fromCoords = routeData.fromCoords;
  const toCoords = routeData.toCoords;
  const [searchFilters, setSearchFilters] = useState({
    from: "",
    to: "",
    date: "",
  });

  const [activeFilters, setActiveFilters] = useState({
    from: "",
    to: "",
    date: "",
  });

  const baseQuery = activeFilters.from
    ? `?from_address=${activeFilters.from}&to_address=${activeFilters.to}${activeFilters.date ? `&date=${activeFilters.date}` : ""}`
    : "";
  const allOrdersUrl = `/passenger-requests${baseQuery}`;
  const { data, isLoading, error, refetch } = useGetData(allOrdersUrl);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveFilters({ ...searchFilters });
    setSearchDialog(false);
  };

  const handleClearSearch = () => {
    setActiveFilters({ from: "", to: "", date: "" });
    setSearchFilters({ from: "", to: "", date: "" });
  };

  const {
    data: myOrders,
    isLoading: myOrdersLoading,
    error: myOrdersError,
    refetch: myOrdersRefetch,
  } = useGetData(`/passenger-requests/my`);

  // Умное автоматическое обновление
  const { forceRefresh, resetActivityFlags } = useSmartRefresh(
    () => {
      Promise.allSettled([refetch(), myOrdersRefetch()]);
    },
    5000,
    [refetch, myOrdersRefetch]
  );

  // Автоматическое обновление данных при переходе на страницу
  useEffect(() => {
    if (location.pathname === "/orders") {
      refetch();
      myOrdersRefetch();
    }
  }, [location.pathname, refetch, myOrdersRefetch]);

  const myOrdersList = (myOrders && myOrders.data) || [];

  const orderPostMutation = usePostData("/passenger-requests");

  const filteredOrders = Array.isArray(data?.data)
    ? data.data.filter((order) => order.status !== "completed" && order.status !== "closed")
    : data?.passenger_requests?.filter((order) => order.status !== "completed" && order.status !== "closed") || [];

  const hasActiveSearch = Boolean(activeFilters.from || activeFilters.to || activeFilters.date);
  const showSearchEmptyState = hasActiveSearch && !isLoading && filteredOrders.length === 0;

  // Определяем, какие заказы показывать в зависимости от активного таба
  const ordersToDisplay = activeTab === "allOrders" 
    ? filteredOrders 
    : myOrdersList.filter((item) => item.status !== "completed" && item.status !== "closed");
  const isLoadingOrders = activeTab === "allOrders" ? isLoading : myOrdersLoading;

  // Функция валидации формы
  const validateForm = (formData) => {
    const errors = {};
    
    if (!selectedFrom?.trim()) {
      errors.from = t("orders.form.validation.fromRequired");
    }
    if (!selectedTo?.trim()) {
      errors.to = t("orders.form.validation.toRequired");
    }
    if (!formData.get("date")?.trim()) {
      errors.date = t("orders.form.validation.dateRequired");
    }
    if (!selectedTime?.trim()) {
      errors.time = t("orders.form.validation.timeRequired");
    }
    if (!formData.get("seats")?.trim()) {
      errors.seats = t("orders.form.validation.seatsRequired");
    }
    
    // Проверка даты и времени
    const selectedDate = formData.get("date");
    const selectedTimeValue = selectedTime;
    
    if (selectedDate && selectedTimeValue) {
      const now = new Date();
      const selectedDateTime = new Date(`${selectedDate}T${selectedTimeValue}:00`);
      
      if (selectedDateTime <= now) {
        errors.dateTime = t("orders.form.validation.futureDateTime");
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const formData = new FormData(e.target);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("orders.form.validationError"));
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const date = formData.get("date");
    const time = selectedTime;
    const seats = formData.get("seats");
    const comment = formData.get("note") || "";
    const amount = formData.get("amount") || null;

    // Проверяем, что выбраны координаты
    if (!fromCoords || !toCoords) {
      toast.error(t("orders.form.validation.selectRouteOnMap"));
      setIsSubmitting(false);
      return;
    }

    const resultData = {
      from_lat: fromCoords.lat,
      from_lng: fromCoords.lng,
      from_address: selectedFrom,
      to_lat: toCoords.lat,
      to_lng: toCoords.lng,
      to_address: selectedTo,
      date,
      time,
      seats: parseInt(seats),
      comment,
      ...(amount && { amount: parseInt(amount) }),
    };

    try {
      const res = await orderPostMutation.mutateAsync(resultData);
      if (res.message === "Passenger request created!" || res.passenger_request) {
        toast.success(t("orders.form.successMessage"));
        setDialog(false);
        setCurrentStep(1);
        setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
        setFormErrors({});
        setSelectedTime("12:00");
        resetActivityFlags();
        forceRefresh();
      }
    } catch (err) {
      console.error(err);
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error(t("orders.form.errorMessage"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="w-full flex text-primary gap-2.5 mb-5">
        <Dialog 
          className="w-full" 
          open={dialog} 
          onOpenChange={(open) => {
            setDialog(open);
            if (!open) {
              // Сброс при закрытии
              setCurrentStep(1);
              setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
              setFormErrors({});
              setSelectedTime("12:00");
            }
          }}
        >
          <DialogTrigger className="w-full cursor-pointer">
            <div className="border w-full py-2 sm:px-10 sm:py-4 rounded-3xl flex flex-col items-center ring-1 ring-blue-300/70 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}>
              <User className="md:size-6 size-4" />
              <h4 className="text-sm md:text-md font-bold">{t("orders.create")}</h4>
            </div>
          </DialogTrigger>
              <DialogContent
                className="w-full h-auto sm:w-[95vw] sm:h-auto sm:max-w-[760px] sm:max-h-[calc(100svh-2rem)] p-0 sm:p-3 sm:rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm overflow-hidden"
                style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
                preventOutsideClose
                showCloseButton={false}
                autoFocusScroll
              >
            <DialogHeader className="relative flex-shrink-0 px-3 sm:px-4 pt-2 sm:pt-4 pb-1 sm:pb-2">
              <DialogTitle className="text-center text-primary font-bold pr-8 text-xs sm:text-base">
                {currentStep === 1 ? t("orders.form.step1Title") : t("orders.form.step2Title")}
              </DialogTitle>
              <DialogDescription className="sr-only">Create order dialog</DialogDescription>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-accent/50 rounded-full"
                  onClick={() => {
                    setCurrentStep(1);
                    setRouteData({ from: "", to: "", fromCoords: null, toCoords: null });
                    setFormErrors({});
                  }}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>
            
            {currentStep === 1 ? (
              // Шаг 1: Выбор маршрута на карте
              <div className="flex flex-col gap-2 sm:gap-3 h-full flex-1 overflow-hidden px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex-1 min-h-0">
                  <RouteSelectorMap
                    isOpen={dialog && currentStep === 1}
                    onRouteSelect={(route) => {
                      console.log("onRouteSelect received:", route);
                      console.log("Current routeData BEFORE:", routeData);
                      
                      // Атомарно обновляем все состояние - сохраняем существующие значения
                      setRouteData(prev => {
                        const updated = { ...prev };
                        
                        if (route.from !== undefined) {
                          updated.from = route.from;
                          console.log("Updating from:", route.from);
                        }
                        
                        if (route.to !== undefined) {
                          updated.to = route.to;
                          console.log("Updating to:", route.to);
                        }
                        
                        if (route.fromCoords !== undefined) {
                          updated.fromCoords = route.fromCoords 
                            ? { lat: route.fromCoords[0], lng: route.fromCoords[1] }
                            : null;
                          console.log("Updating fromCoords:", updated.fromCoords);
                        }
                        
                        if (route.toCoords !== undefined) {
                          updated.toCoords = route.toCoords 
                            ? { lat: route.toCoords[0], lng: route.toCoords[1] }
                            : null;
                          console.log("Updating toCoords:", updated.toCoords);
                        }
                        
                        console.log("Updated routeData:", updated);
                        return updated;
                      });
                    }}
                    fromCity={selectedFrom}
                    toCity={selectedTo}
                    setFromCity={(value) => setRouteData(prev => ({ ...prev, from: value }))}
                    setToCity={(value) => setRouteData(prev => ({ ...prev, to: value }))}
                  />
                </div>
                <div className="flex gap-2 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-1 flex-shrink-0">
                  <DialogClose asChild>
                    <Button type="button" className="rounded-2xl w-1/2 h-9 text-xs sm:text-sm">{t("orders.form.cancel")}</Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedFrom && selectedTo && fromCoords && toCoords) {
                        setCurrentStep(2);
                      } else {
                        toast.error(t("orders.form.validation.selectRouteOnMap"));
                      }
                    }}
                    disabled={!selectedFrom || !selectedTo || !fromCoords || !toCoords}
                    className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {t("orders.form.next")}
                  </Button>
                </div>
              </div>
            ) : (
              // Шаг 2: Форма с данными
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3 px-3 sm:px-4 pb-2 sm:pb-3">
                <input type="hidden" name="from" value={selectedFrom} />
                <input type="hidden" name="to" value={selectedTo} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                     onTouchMove={(e) => e.stopPropagation()}
                >
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date" className="text-xs sm:text-sm">{t("orders.form.date")} *</Label>
                      <Input 
                        type="date" 
                        id="date" 
                        name="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className={`${formErrors.date || formErrors.dateTime ? "border-red-500" : ""} bg-white h-8 sm:h-9 text-sm w-full min-w-0`}
                      />
                      {formErrors.date && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.date}</span>}
                      {formErrors.dateTime && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.dateTime}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="time" className="text-xs sm:text-sm">{t("orders.form.time")} *</Label>
                      <TimePicker
                        id="time"
                        value={selectedTime}
                        onChange={setSelectedTime}
                        size="sm"
                        dropdownMaxHeight={112}
                        className={`w-full h-8 sm:h-9 ${formErrors.time || formErrors.dateTime ? "border-red-500" : ""} bg-white`}
                      />
                      {formErrors.time && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.time}</span>}
                      {formErrors.dateTime && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.dateTime}</span>}
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="amount" className="text-xs sm:text-sm">{t("orders.form.amount")}</Label>
                    <Input 
                      type="number" 
                      id="amount" 
                      name="amount" 
                      min="0"
                      placeholder={t("orders.form.amountPlaceholder")} 
                      className="bg-white h-8 sm:h-9"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="seats" className="text-xs sm:text-sm">{t("orders.form.seats")} *</Label>
                    <Input 
                      type="number" 
                      id="seats" 
                      name="seats" 
                      defaultValue="1"
                      min="1"
                      placeholder={t("orders.form.seatsPlaceholder")} 
                      required
                      className={`${formErrors.seats ? "border-red-500" : ""} bg-white h-8 sm:h-9`}
                    />
                    {formErrors.seats && <span className="text-red-500 text-[10px] sm:text-xs">{formErrors.seats}</span>}
                  </div>
                  <div className="col-span-1 sm:col-span-2 grid items-center gap-1">
                    <Label htmlFor="note" className="text-xs sm:text-sm">{t("orders.form.note")}</Label>
                    <Input type="text" id="note" name="note" placeholder={t("orders.commentPlaceholder")} className="bg-white h-8 sm:h-9" />
                  </div>
                </div>
                <div className="flex gap-2 mt-1 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-1 flex-shrink-0" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                  <Button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-2xl w-1/2 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {t("orders.form.back")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={14} />
                        {t("orders.form.submitting")}
                      </span>
                    ) : (
                      t("orders.form.submit")
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
        <Dialog
          className="w-full"
          open={searchDialog}
          onOpenChange={setSearchDialog}
        >
          <DialogTrigger className="w-full cursor-pointer">
            <div className="border w-full py-2 sm:px-10 sm:py-4 rounded-3xl flex flex-col items-center ring-1 ring-blue-300/70 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm" style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}>
              <Search className="md:size-6 size-4" />
              <h4 className="text-sm md:text-md font-bold">{t("orders.search")}</h4>
            </div>
          </DialogTrigger>
          <DialogContent 
            className="overflow-hidden rounded-2xl ring-1 ring-blue-200/60 shadow-[0_10px_28px_rgba(59,130,246,0.18)] bg-card/90 backdrop-blur-sm max-h-none"
            style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(79,70,229,0.14))" }}
            autoFocusScroll
            showCloseButton={false}
          >
            <DialogHeader className="relative">
              <DialogTitle className="text-center text-primary font-bold pr-8">
                {t("orders.search")}
              </DialogTitle>
              <DialogDescription className="sr-only">Search order dialog</DialogDescription>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="grid w-full items-center gap-3 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain pr-1 max-h-[45svh]">
                <Label htmlFor="from">{t("orders.searchForm.from")}</Label>
                <Input
                  type="text"
                  id="from"
                  name="from"
                  value={searchFilters.from}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, from: e.target.value }))}
                  placeholder={t("orders.searchForm.fromPlaceholder")}
                  className="bg-white"
                />
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="to">{t("orders.searchForm.to")}</Label>
                  <Input
                    type="text"
                    id="to"
                    name="to"
                    value={searchFilters.to}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, to: e.target.value }))}
                    placeholder={t("orders.searchForm.toPlaceholder")}
                    className="bg-white"
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="search-date">{t("orders.searchForm.date")}</Label>
                  <Input
                    type="date"
                    id="search-date"
                    name="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder={t("orders.searchForm.datePlaceholder")}
                    className="bg-white h-9 w-full min-w-0"
                  />
                </div>
              </div>
              <div className="w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 flex gap-2 mt-2 py-1" style={{ paddingBottom: keyboardInset ? keyboardInset : undefined }}>
                <DialogClose className="w-1/2" asChild>
                  <Button className="rounded-2xl h-9 text-xs sm:text-sm">
                    {t("orders.searchForm.cancel")}
                  </Button>
                </DialogClose>
                <Button className="bg-primary text-primary-foreground rounded-2xl w-1/2 h-9 text-xs sm:text-sm" type="submit">
                  {t("orders.searchForm.search")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="px-0 rounded-3xl shadow-lg border">
        <CardContent className="px-0 rounded-3xl bg-card/90 backdrop-blur-sm">
          <Tabs defaultValue="allOrders" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="px-1 sm:px-2 w-full mb-4 sm:mb-6">
              <TabsTrigger value="allOrders" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">{t("orders.all")}</TabsTrigger>
              <TabsTrigger value="myOrders" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">{t("orders.mine")}</TabsTrigger>
            </TabsList>
            {activeFilters.from && (
              <div className="px-4 mb-2">
                <div className="flex items-center justify-between bg-accent rounded-lg p-2">
                  <div className="text-sm text-accent-foreground">
                    <span className="font-medium">Поиск:</span> {activeFilters.from} → {activeFilters.to}
                    {activeFilters.date && ` • ${activeFilters.date}`}
                  </div>
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
                    {t("orders.searchForm.clear")}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Карта всегда отображается */}
            <div className="px-4 mb-4">
              <OrdersMap orders={ordersToDisplay} isLoading={isLoadingOrders} />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Orders;
