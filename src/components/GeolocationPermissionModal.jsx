import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, CheckCircle } from "lucide-react";
import { useI18n } from "@/app/i18n.jsx";

function GeolocationPermissionModal({ open, onOpenChange }) {
  const { t, lang } = useI18n();
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Определяем платформу
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera || "";
    const isAndroidDevice = /Android/i.test(userAgent);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent);
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);
  }, []);

  // Проверяем статус геолокации
  useEffect(() => {
    if (!open) return;

    const checkGeolocation = async () => {
      if (!navigator.geolocation) {
        setHasChecked(true);
        return;
      }

      // Проверяем разрешение через Permissions API, если доступен
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          setHasChecked(true);
          
          // Если разрешение уже предоставлено, закрываем модальное окно
          if (permissionStatus.state === 'granted') {
            onOpenChange(false);
            return;
          }
        } catch (error) {
          // Permissions API может не поддерживаться, продолжаем проверку
          console.log("Permissions API not supported, using fallback");
        }
      }

      // Альтернативная проверка: пытаемся получить позицию с коротким таймаутом
      navigator.geolocation.getCurrentPosition(
        () => {
          // Геолокация работает, закрываем модальное окно
          setHasChecked(true);
          onOpenChange(false);
        },
        (error) => {
          setHasChecked(true);
          // Если ошибка PERMISSION_DENIED, оставляем модальное окно открытым
          if (error.code !== error.PERMISSION_DENIED) {
            // Другие ошибки (timeout, unavailable) - тоже закрываем
            onOpenChange(false);
          }
        },
        {
          timeout: 1000,
          maximumAge: 0,
        }
      );
    };

    checkGeolocation();
  }, [open, onOpenChange]);

  const handleOpenSettings = () => {
    // Для Android и iOS можно попробовать открыть настройки приложения
    // Но это зависит от реализации нативного приложения
    // Пока просто закрываем модальное окно
    onOpenChange(false);
  };

  if (!open || !hasChecked) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent preventOutsideClose={true} showCloseButton={false}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-white">
                <Settings className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl">
            {t("geolocation.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            {t("geolocation.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3">
            {isAndroid && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.android.step1")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.android.step2")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.android.step3")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.android.step4")}
                  </p>
                </div>
              </>
            )}
            {isIOS && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.ios.step1")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.ios.step2")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.ios.step3")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t("geolocation.ios.step4")}
                  </p>
                </div>
              </>
            )}
            {!isAndroid && !isIOS && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {t("geolocation.generic.instructions")}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleOpenSettings}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 h-10"
            >
              <span className="flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                {t("geolocation.button")}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GeolocationPermissionModal;

