import React, { useEffect } from "react";
import {
  ArrowRight,
  Check,
  MapPin,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useGetData, usePostData, postData, bookingsApi } from "@/api/api";
import { useI18n } from "@/app/i18n.jsx";
import EmptyState from "@/components/EmptyState.jsx";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useActiveTab } from "@/layout/MainLayout";

function Requests() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { activeTab } = useActiveTab();
  
  // API для моих pending запросов (где я пассажир)
  const { data: mineRes, isPending: mineLoading, error: mineError, refetch: refetchMine } = useGetData(
    "/bookings/my/pending",
    {
      refetchInterval: 5000, // Автоматическое обновление каждые 5 секунд
      refetchOnWindowFocus: true, // Обновление при фокусе на окне
    }
  );
  
  // API для pending запросов на мои поездки (где я водитель)
  const { data: toMeRes, isPending: toMeLoading, error: toMeError, refetch: refetchToMe } = useGetData(
    "/bookings/to-my-trips/pending",
    {
      refetchInterval: 5000, // Автоматическое обновление каждые 5 секунд
      refetchOnWindowFocus: true, // Обновление при фокусе на окне
    }
  );
  
  // Получаем количество непрочитанных сообщений (React Query автоматически дедуплицирует запрос с Navbar)
  const { data: unreadCounts } = useQuery({ 
    queryKey: ["bookings", "unread-count"], 
    queryFn: bookingsApi.getUnreadCount, 
    refetchInterval: 60000,
    staleTime: 30000,
    cacheTime: 300000
  });

  // Автоматическое обновление данных при переходе на страницу и переключении табов
  useEffect(() => {
    if (location.pathname === "/requests") {
      refetchMine();
      refetchToMe();
    }
  }, [location.pathname, activeTab, refetchMine, refetchToMe]);


  const handleConfirm = async (bookingId) => {
    try {
      await postData(`/bookings/${bookingId}`, { status: "confirmed" });
      toast.success("Tasdiqlandi.");
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
    } catch (e) {
      console.error(e);
      toast.error("Tasdiqlashda xatolik.");
    }
  };

  const handleDecline = async (bookingId) => {
    try {
      await postData(`/bookings/${bookingId}`, { status: "declined" });
      toast.success("Bekor qilindi.");
      queryClient.invalidateQueries({ queryKey: ["bookings", "unread-count"] });
      // Обновляем все возможные запросы поездок (включая с фильтрами)
      queryClient.invalidateQueries({ queryKey: ["data"] });
    } catch (e) {
      console.error(e);
      toast.error("Bekor qilishda xatolik.");
    }
  };

  const mine = mineRes?.bookings || [];
  const toMe = toMeRes?.bookings || [];

  // Показываем только нужный контент в зависимости от activeTab
  const showPassengerContent = activeTab === "passenger";
  const showDriverContent = activeTab === "driver";

  return (
    <div className="w-full">
      {showPassengerContent && (
        <Card className="bg-card/90 backdrop-blur-sm border shadow-lg">
          <CardContent className="flex flex-col gap-3 sm:gap-5 py-4 sm:py-6">
            {mineLoading ? (
              <div className="text-sm">{t("requests.loading")}</div>
            ) : mineError ? (
              <div className="text-red-600 text-sm">Xatolik: {mineError.message}</div>
            ) : mine.length === 0 ? (
              <EmptyState title={t("requests.emptyMine")} />
            ) : (
              mine.map((b) => (
                <div
                  key={b.id}
                  className="border p-3 sm:p-5 rounded-2xl ring-1 ring-blue-200/60 shadow-[0_6px_18px_rgba(59,130,246,0.12)] hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                  style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                >
                  <h2 className="flex items-center font-bold text-primary text-sm sm:text-base">
                    <MapPin className="mr-1 sm:mr-2 w-4 h-4" />
                    {b.trip?.from_city}
                    <ArrowRight size={14} className="mx-1" />
                    {b.trip?.to_city}
                  </h2>
                  <div className="flex justify-between mt-2 text-xs sm:text-sm">
                    <p>
                      {b.trip?.date} • {b.trip?.time}
                    </p>
                    <span className="bg-primary text-primary-foreground py-1 px-2 rounded-2xl text-xs">{t("requests.pending")}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs sm:text-sm">
                    <span>
                      {b.seats} {t("requests.seats")}
                    </span>
                    {b.offered_price ? (
                      <span>
                        {t("requests.offer")}: {b.offered_price} сум
                      </span>
                    ) : (
                      <span>
                        {t("requests.price")}: {b.trip?.price} сум
                      </span>
                    )}
                  </div>
                  {b.comment ? (
                    <div className="text-xs sm:text-sm bg-white border p-2 sm:p-3 lg:p-5 rounded-2xl mt-2">
                      {b.comment}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
      {showDriverContent && (
        <Card className="bg-card/90 backdrop-blur-sm border shadow-lg">
          <CardContent className="flex flex-col gap-3 sm:gap-5 py-4 sm:py-6">
            {toMeLoading ? (
              <div className="text-sm">{t("requests.loading")}</div>
            ) : toMeError ? (
              <div className="text-red-600 text-sm">Xatolik: {toMeError.message}</div>
            ) : toMe.length === 0 ? (
              <EmptyState title={t("requests.emptyToMe")} />
            ) : (
              toMe.map((b) => (
                <div
                  key={b.id}
                  className="border p-3 sm:p-5 rounded-2xl ring-1 ring-blue-200/60 shadow-[0_6px_18px_rgba(59,130,246,0.12)] hover:shadow-[0_8px_22px_rgba(59,130,246,0.16)] transition-shadow"
                  style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(79,70,229,0.1))" }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <Avatar className="size-6 sm:size-8 lg:size-10">
                      <AvatarFallback className="text-xs sm:text-sm">{getInitials(b.user?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="text-xs sm:text-sm lg:text-base">
                        <h2 className="font-bold text-primary">{b.user?.name || "Foydalanuvchi"}</h2>
                      </div>
                    </div>
                    <p className="bg-primary text-primary-foreground py-1 px-2 rounded-2xl text-xs sm:text-sm">{t("requests.pending")}</p>
                  </div>
                  <div className="bg-white/70 border p-2 sm:p-3 lg:p-4 rounded-2xl mt-2">
                    <h3 className="flex items-center font-bold text-primary text-xs sm:text-sm">
                      <MapPin className="mr-1 sm:mr-2 w-4 h-4" />
                      {b.trip?.from_city}
                      <ArrowRight size={14} className="mx-1" />
                      {b.trip?.to_city}
                    </h3>
                    <div className="flex justify-between mt-2 text-xs sm:text-sm">
                      <p>
                        {b.trip?.date} • {b.trip?.time}
                      </p>
                      {b.offered_price ? (
                        <span>
                          {t("requests.offer")}: {b.offered_price} сум
                        </span>
                      ) : (
                        <span>
                          {t("requests.price")}: {b.trip?.price} сум
                        </span>
                      )}
                    </div>
                    {b.comment ? (
                      <div className="text-xs sm:text-sm text-gray-700 mt-1">{b.comment}</div>
                    ) : null}
                  </div>
                  <div className="w-full flex gap-2 sm:gap-3 mt-3">
                    <button
                      onClick={() => handleConfirm(b.id)}
                      className="w-full flex justify-center items-center gap-1 sm:gap-2 bg-primary text-primary-foreground rounded-3xl py-2 px-2 sm:px-3 text-xs sm:text-sm hover:brightness-110 transition-all duration-300 cursor-pointer"
                    >
                      <Check size={14} className="sm:w-4 sm:h-4" /> {t("requests.accept")}
                    </button>
                    <button
                      onClick={() => handleDecline(b.id)}
                      className="w-full flex justify-center items-center gap-1 sm:gap-2 border border-destructive text-destructive rounded-3xl py-2 px-2 sm:px-3 text-xs sm:text-sm hover:bg-destructive/10 transition-all duration-300 cursor-pointer"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" /> {t("requests.decline")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Requests;
