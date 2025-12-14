import React, { useState, useEffect } from "react";
import Orders from "./Orders";
import TelegramConnectModal from "@/components/TelegramConnectModal.jsx";
import { useGetData } from "@/api/api";

function TripsOrders() {
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  
  // Получаем данные пользователя для проверки telegram_chat_id
  const { data: userData, refetch: refetchUser } = useGetData("/user");

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

  return (
    <div>
      <TelegramConnectModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
      />
      <Orders />
    </div>
  );
}

export default TripsOrders;

