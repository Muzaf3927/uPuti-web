import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, MessageSquare } from "lucide-react";
import { useI18n } from "@/app/i18n.jsx";
import { useTelegramConnect } from "@/api/api";

function TelegramConnectModal({ open, onOpenChange, onCloseParent }) {
  const { t, lang } = useI18n();
  const connectMutation = useTelegramConnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await connectMutation.mutateAsync();
      const telegramUrl = response.telegram_connect_url;
      
      if (telegramUrl) {
        // Открываем URL в новой вкладке
        window.open(telegramUrl, "_blank", "noopener,noreferrer");
        
        // Закрываем модальное окно через небольшую задержку
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      }
    } catch (error) {
      console.error("Failed to get Telegram connect URL:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Закрываем родительский диалог (создание поездки/бронирования)
    if (onCloseParent) {
      onCloseParent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent preventOutsideClose={true}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl">
            {lang === "ru"
              ? "Не пропускайти запросов!"
              : "So'rovlarni o'tqazib yubormang!"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            {lang === "ru"
              ? "Чтобы получать моментально ваши брони, заявки или сообщения, включите Telegram бот"
              : "So'rovlar, bronlar yoki xabarlarni o'z vaqtida qabul qilish uchun Telegram botni ulang"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {lang === "ru"
                  ? "Нажмите кнопку ниже для подключения"
                  : "Telegramga ulash tugmasini bosing"}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {lang === "ru"
                  ? "Откроется Telegram, нажмите Start"
                  : "Telegramda Start tugmasini bosing"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || connectMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 h-10"
            >
              {isConnecting || connectMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {lang === "ru" ? "Подключение..." : "Ulanmoqda..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {lang === "ru"
                    ? "Подключить Telegram"
                    : "Telegramga ulash"}
                </span>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full h-10"
              disabled={isConnecting || connectMutation.isPending}
            >
              {lang === "ru" ? "Закрыть" : "Yopish"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TelegramConnectModal;


