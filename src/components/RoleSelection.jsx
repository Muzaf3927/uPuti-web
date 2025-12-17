import React, { useState, useEffect } from "react";
import { User, Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { useUpdateRole, useGetData } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AddCarModal from "./AddCarModal";
import TelegramConnectModal from "./TelegramConnectModal";

function RoleSelection({ onRoleSelected, userData, canClose = false, onClose }) {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const updateRoleMutation = useUpdateRole();
  const queryClient = useQueryClient();
  const { data: updatedUserData, refetch: refetchUser } = useGetData("/user");

  // Отслеживаем изменения telegramModalOpen для отладки
  useEffect(() => {
    console.log("RoleSelection: telegramModalOpen changed to:", telegramModalOpen);
  }, [telegramModalOpen]);

  useEffect(() => {
    if(!updatedUserData?.telegram_chat_id){
      setTelegramModalOpen(true)
    }
  }, [updatedUserData])

  const handleSelectRole = async (role) => {
    if (!role) {
      console.log("RoleSelection: No role provided");
      return;
    }
    
    if (updateRoleMutation.isPending) {
      console.log("RoleSelection: Already updating role, ignoring click");
      return;
    }
    
    console.log("RoleSelection: handleSelectRole called with role:", role);
    setSelectedRole(role);
    
    try {
      console.log("RoleSelection: Attempting to update role to:", role);
      const result = await updateRoleMutation.mutateAsync({ role });
      console.log("RoleSelection: Role updated successfully:", result);
      toast.success(
        t("roleSelection.success") || "Роль успешно выбрана"
      );
      
      // Если выбрана роль водителя, проверяем наличие машины
      if (role === "driver") {
        // Проверяем, есть ли уже машина у пользователя
        const hasCar = userData?.car && (userData.car.model || userData.car.number);
        
        if (!hasCar) {
          // Нет машины - показываем модальное окно для добавления
          setPendingRole(role);
          setShowAddCarModal(true);
          setSelectedRole(null);
          return;
        }
      }

      // Для пассажиров (если есть telegram) или если у водителя уже есть машина - обновляем страницу
      // Этот код выполнится только если мы НЕ вернулись раньше (т.е. если есть telegram или это не пассажир)
      setTimeout(() => {
        if (onRoleSelected) {
          onRoleSelected(role);
        }
        // Перезагружаем страницу, чтобы применить изменения роли
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("RoleSelection: Error updating role:", error);
      console.error("RoleSelection: Error response:", error.response);
      toast.error(
        error.response?.data?.message || 
        t("roleSelection.error") || 
        "Ошибка при выборе роли"
      );
      setSelectedRole(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // При редактировании можно закрыть кликом на backdrop, при первом входе - нельзя
        if (!canClose && e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        } else if (canClose && e.target === e.currentTarget) {
          // При редактировании закрываем модальное окно
          e.preventDefault();
          e.stopPropagation();
          if (onClose) {
            onClose();
          }
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-200 relative z-[100000]"
        onClick={(e) => {
          // Предотвращаем всплытие клика
          e.stopPropagation();
        }}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Кнопка закрытия при редактировании */}
        {canClose && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onClose) {
                onClose();
              }
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-[100001] cursor-pointer"
            aria-label="Закрыть"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
        
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {t("roleSelection.title") || "Выберите вашу роль"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            {t("roleSelection.description") || "Пожалуйста, выберите, как вы будете использовать приложение"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            {t("roleSelection.canChangeLater") || "Вы сможете изменить роль позже в настройках, если понадобится"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Пассажир */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("RoleSelection: Passenger button clicked");
              handleSelectRole("passenger");
            }}
            disabled={updateRoleMutation.isPending}
            className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedRole === "passenger"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
            } ${updateRoleMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            style={{ pointerEvents: updateRoleMutation.isPending ? 'none' : 'auto' }}
          >
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
              selectedRole === "passenger"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}>
              <User className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <span className="font-semibold text-sm sm:text-base text-gray-900">
              {t("nav.passengerTab") || "Пассажир"}
            </span>
          </button>

          {/* Водитель */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("RoleSelection: Driver button clicked");
              handleSelectRole("driver");
            }}
            disabled={updateRoleMutation.isPending}
            className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedRole === "driver"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
            } ${updateRoleMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            style={{ pointerEvents: updateRoleMutation.isPending ? 'none' : 'auto' }}
          >
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
              selectedRole === "driver"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}>
              <Car className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <span className="font-semibold text-sm sm:text-base text-gray-900">
              {t("nav.driverTab") || "Водитель"}
            </span>
          </button>
        </div>

        {updateRoleMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t("roleSelection.saving") || "Сохранение..."}</span>
          </div>
        )}
      </div>
      
      {/* Модальное окно для добавления машины */}
      {showAddCarModal && (
        <AddCarModal
          userData={userData}
          onCarAdded={(carData) => {
            setShowAddCarModal(false);
            // После добавления машины обновляем страницу
            setTimeout(() => {
              if (onRoleSelected) {
                onRoleSelected(pendingRole);
              }
              window.location.reload();
            }, 500);
          }}
        />
      )}
      
      {/* Модальное окно для подключения Telegram */}
      <TelegramConnectModal 
        open={telegramModalOpen} 
        onOpenChange={async (open) => {
          if (!open) {
            setTelegramModalOpen(false);
            // Обновляем данные пользователя после закрытия модального окна
            await refetchUser();
            // Перезагружаем страницу
            setTimeout(() => {
              if (onRoleSelected) {
                onRoleSelected("passenger");
              }
              window.location.reload();
            }, 500);
          }
        }}
        onCloseParent={() => setTelegramModalOpen(false)}
      />
    </div>
  );
}

export default RoleSelection;

