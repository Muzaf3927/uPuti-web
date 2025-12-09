import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveTab } from "@/layout/MainLayout";
import { useI18n } from "@/app/i18n.jsx";
import Trips from "./Trips";
import Orders from "./Orders";
import TelegramConnectModal from "@/components/TelegramConnectModal.jsx";
import { useGetData } from "@/api/api";

function TripsOrders() {
  const { t } = useI18n();
  const { activeTab } = useActiveTab();
  const showPassengerContent = activeTab === "passenger";
  const showDriverContent = activeTab === "driver";
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  
  // Получаем данные пользователя для проверки telegram_chat_id
  const { data: userData, refetch: refetchUser } = useGetData("/user");
  
  // Дефолтное значение в зависимости от роли
  const defaultTab = showPassengerContent ? "createOrder" : "searchOrder";
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);

  // Обновляем активный таб при смене роли
  useEffect(() => {
    const newDefaultTab = showPassengerContent ? "createOrder" : "searchOrder";
    setActiveSubTab(newDefaultTab);
  }, [showPassengerContent, showDriverContent]);

  // Проверка telegram_chat_id для всех пользователей при загрузке страницы
  // Независимо от роли - если telegram_chat_id пустой, показываем модальное окно
  useEffect(() => {
    if (!userData) return;
    
    // Проверяем на null, undefined и пустую строку
    const telegramChatId = userData.telegram_chat_id;
    // Правильная проверка: если telegram_chat_id пустой (null, undefined, или пустая строка), то hasTelegram = false
    const hasTelegram = Boolean(telegramChatId && String(telegramChatId).trim() !== "");
    
    console.log("TripsOrders: Checking telegram_chat_id", {
      role: userData.role,
      telegram_chat_id: telegramChatId,
      type: typeof telegramChatId,
      hasTelegram,
      shouldShowModal: !hasTelegram
    });
    
    if (!hasTelegram) {
      console.log("TripsOrders: Opening Telegram modal - telegram_chat_id is empty");
      setTelegramModalOpen(true);
    }
  }, [userData]);

  // Обновляем данные пользователя при закрытии модального окна Telegram
  useEffect(() => {
    const handleFocus = () => {
      if (!telegramModalOpen) {
        refetchUser();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [telegramModalOpen, refetchUser]);

  // Для пассажира: "Заказы" (первый) и "Поездки"
  // Для водителя: "Заказы" (первый) и "Поездки"
  const passengerTabs = [
    { value: "createOrder", label: t("tripsOrders.orders") },
    { value: "searchTrip", label: t("tripsOrders.trips") },
  ];

  const driverTabs = [
    { value: "searchOrder", label: t("tripsOrders.orders") },
    { value: "createTrip", label: t("tripsOrders.trips") },
  ];

  const tabs = showPassengerContent ? passengerTabs : driverTabs;

  return (
    <div>
      <TelegramConnectModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
      />
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="px-1 sm:px-2 w-full mb-4 sm:mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {showPassengerContent && (
          <>
            <TabsContent value="createOrder">
              <Orders />
            </TabsContent>
            <TabsContent value="searchTrip">
              <Trips />
            </TabsContent>
          </>
        )}

        {showDriverContent && (
          <>
            <TabsContent value="searchOrder">
              <Orders />
            </TabsContent>
            <TabsContent value="createTrip">
              <Trips />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default TripsOrders;

