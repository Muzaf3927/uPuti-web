import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { safeLocalStorage } from "@/lib/localStorage";
import { sessionManager } from "@/lib/sessionManager";
import {
  Bell,
  Car,
  CircleUser,
  LogOut,
  Phone,
  MessageCircle,
  Headphones,
  User,
  X,
} from "lucide-react";
import { useI18n } from "@/app/i18n.jsx";
import { useDispatch } from "react-redux";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@/app/userSlice/userSlice";
import Onboarding from "@/components/Onboarding";
import { getInitials } from "@/lib/utils";
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets.jsx";
import RoleSelection from "@/components/RoleSelection";

// shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// others
import {
  usePostData,
  useGetData,
  useNotifications,
  useNotificationsUnread,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUpdateRole,
} from "@/api/api";
import { toast } from "sonner";

// Context for activeTab
const ActiveTabContext = React.createContext({
  activeTab: "passenger",
  setActiveTab: () => {},
});

export const useActiveTab = () => React.useContext(ActiveTabContext);

// get firstName
function getNthWord(str, n) {
  const parts = str.trim().split(/\s+/);
  return n >= 1 && n <= parts.length ? parts[n - 1] : null;
}

function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useI18n();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [showRoleSelection, setShowRoleSelection] = React.useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false);
  const { keyboardInset } = useKeyboardInsets();
  const updateRoleMutation = useUpdateRole();

  // Отслеживание изменений маршрута в Яндекс.Метрике
  useEffect(() => {
    if (typeof window !== "undefined" && window.ym) {
      window.ym(105604771, "hit", location.pathname + location.search);
    }
  }, [location]);

  // Проверяем, нужно ли показать онбординг
  React.useEffect(() => {
    // Disable onboarding popup globally
    try { safeLocalStorage.removeItem("showOnboarding"); } catch (_) {}
    setShowOnboarding(false);
  }, []);

  const logoutMutation = usePostData("/logout");
  const { data: notifications } = useNotifications();
  const { data: unread } = useNotificationsUnread();
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: userRefetch,
  } = useGetData("/user");

  // Проверяем, есть ли у пользователя роль (обязательная проверка при каждой загрузке)
  React.useEffect(() => {
    if (userData && !userLoading) {
      // Если у пользователя роль пустая (null, undefined, или не passenger/driver), показываем выбор роли
      const hasValidRole = userData.role === "passenger" || userData.role === "driver";
      if (!hasValidRole) {
        setShowRoleSelection(true);
      } else {
        setShowRoleSelection(false);
      }
    }
  }, [userData, userLoading]);

  // Получаем роль из профиля пользователя
  const userRole = userData?.role || "passenger";
  
  // Обработчик выбора роли
  const handleRoleSelected = () => {
    setShowRoleSelection(false);
    userRefetch(); // Обновляем данные пользователя
  };

  // Обработчик изменения роли из профиля
  const handleRoleChange = async (role) => {
    try {
      await updateRoleMutation.mutateAsync({ role });
      toast.success(t("profilePage.roleChanged"));
      setIsRoleDialogOpen(false);
      userRefetch(); // Обновляем данные пользователя
      // Обновляем страницу для применения изменений
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(
        error.response?.data?.message || 
        t("profilePage.roleChangeError")
      );
    }
  };

  const getRoleLabel = (role) => {
    if (role === "passenger") return t("nav.passengerTab");
    if (role === "driver") return t("nav.driverTab");
    return t("profilePage.none");
  };

  const handleLogout = async () => {
    try {
      const res = await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout API error:", error);
      // Продолжаем с локальным logout даже если API не работает
    } finally {
      // Всегда выполняем локальную очистку
      dispatch(logout());

      // Полная очистка всех данных сессии
      sessionManager.clearSession();

      toast.success("Muvaffaqiyatli tizimdan chiqdingiz!");
    }
  };

  // Обработка клика по уведомлению
  const handleNotificationClick = (notification) => {
    try {
      const data = JSON.parse(notification.data);
      
      // Отмечаем уведомление как прочитанное
      markRead.mutate(notification.id);
      
      // Перенаправляем в зависимости от типа уведомления
      switch (notification.type) {
        case 'chat':
          // Перенаправляем в чат
          navigate(`/chats?tripId=${data.trip_id}&receiverId=${notification.sender_id}`);
          break;
        case 'new_booking':
          // Перенаправляем на страницу запросов
          navigate('/requests');
          break;
        case 'booking_confirmed':
          // Перенаправляем на раздел брони
          navigate('/booking');
          break;
        default:
          // Для других типов уведомлений ничего не делаем
          break;
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
      // Если не удалось распарсить данные, просто отмечаем как прочитанное
      markRead.mutate(notification.id);
    }
  };
  return (
    <div className="flex flex-col min-h-screen ">
      <header className="h-16 sm:h-20 sticky top-0 z-50 bg-gradient-to-tr from-blue-100/85 to-cyan-200/75 dark:from-white/5 dark:to-white/10 backdrop-blur-md border-b">
        <div className="flex justify-between items-center py-1 sm:py-2 custom-container overflow-hidden">
          <div className="flex gap-2 sm:gap-3 items-center">
            <Link className="rounded-2xl p-0" to="/">
              <img
                src="/logo.png"
                alt="UPuti"
              className="block h-14 sm:h-16 lg:h-20 w-auto object-contain hover:opacity-100 transition-opacity mix-blend-normal"
              />
            </Link>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              type="button"
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
              className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full border bg-white/80 hover:bg-accent/60 text-[10px] sm:text-xs"
              title={lang === "uz" ? "RU" : "UZ"}
            >
              {lang === "uz" ? (
                <div className="flex gap-1 py-0">
                  <img src="/rus.png" alt="Uzbekistan" width="18" height="18" />
                  <span>RU</span>
                </div>
              ) : (
                <div className="flex gap-1 py-0">
                  <img src="/uzb.png" alt="Uzbekistan" width="18" height="18" />
                  <span>UZ</span>
                </div>
              )}
            </button>
            <div className="flex gap-2 sm:gap-3 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="relative">
                  <Bell className="cursor-pointer text-gray-700 hover:text-primary transition w-6 h-6 sm:w-7 sm:h-7" />
                  {!!unread?.unread_count && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-destructive text-white text-[9px] sm:text-[10px] flex items-center justify-center">
                      {unread.unread_count}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 sm:w-72 max-h-96 overflow-auto">
                  <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="text-xs sm:text-sm">
                      Уведомления
                    </DropdownMenuLabel>
                    <button
                      disabled={markAll.isPending}
                      onClick={() => markAll.mutate()}
                      className="text-xs text-primary hover:underline"
                    >
                      Прочитать все
                    </button>
                  </div>
                  <DropdownMenuSeparator />
                  {!notifications?.notifications?.filter((n) => !n.is_read)
                    ?.length && (
                    <DropdownMenuLabel className="text-center text-xs py-6 text-gray-500">
                      Уведомлений нет
                    </DropdownMenuLabel>
                  )}
                  {notifications?.notifications
                    ?.filter((n) => !n.is_read)
                    ?.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="whitespace-normal py-1 sm:py-2 cursor-pointer"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex items-start justify-between gap-1 sm:gap-2 w-full">
                          <div className="flex-1">
                            <div
                              className={`text-xs sm:text-sm ${
                                n.is_read
                                  ? "text-gray-600"
                                  : "text-gray-900 font-semibold"
                              }`}
                            >
                              {n.message}
                            </div>
                            {n.created_at && (
                              <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(true);
                userRefetch();
              }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base cursor-pointer hover:brightness-110 transition">
                {getInitials(userData?.name)}
              </div>
            </button>
          </div>
        </div>
      </header>
      <div className="custom-container mb-2 sm:mb-3 sticky top-16 sm:top-20 z-40">
        <Navbar />
      </div>
      <main className="grow custom-container mb-6 sm:mb-10 overflow-auto">
        <ActiveTabContext.Provider value={{ activeTab: userRole, setActiveTab: () => {} }}>
          <Outlet />
        </ActiveTabContext.Provider>
      </main>
      
      {/* Role Selection Modal */}
      {showRoleSelection && (
        <RoleSelection onRoleSelected={handleRoleSelected} />
      )}
      {/* Right Panel Profile */}
      {profileOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setProfileOpen(false)}
          />
          <div className="absolute right-1 top-1 sm:right-2 sm:top-2 h-auto max-h-[85vh] w-[85vw] max-w-[280px] bg-card/95 backdrop-blur-sm shadow-xl rounded-2xl flex flex-col overflow-hidden border ring-1 ring-blue-200/60" style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(79,70,229,0.1))" }}>
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {(userData?.name || "U").slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm sm:text-base">
                    {userData?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {userData?.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto">
              <div className="border rounded-2xl p-3 sm:p-4 bg-white/70 w-full">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {t("profilePanel.name")}:
                    </span>
                    <span className="font-medium">{userData?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {t("profilePanel.phone")}:
                    </span>
                    <span className="font-medium">
                      {userData?.phone ? `+998${userData.phone}` : "—"}
                    </span>
                  </div>
                  {userData?.rating !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {t("profilePanel.rating")}:
                      </span>
                      <span className="font-medium">
                        ⭐ {userData?.rating} ({userData?.rating_count || 0})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {userData?.role === "driver" ? (
                        <Car className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className="text-gray-500">
                        {t("profilePage.roleSection")}:
                      </span>
                      <span className="font-medium">
                        {getRoleLabel(userData?.role)}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRoleDialogOpen(true)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      disabled={updateRoleMutation.isPending}
                    >
                      {t("profilePage.changeRole")}
                    </button>
                  </div>
                </div>
              </div>
              <div className="border rounded-2xl p-3 sm:p-4 bg-white/70 w-full">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 hover:bg-accent/50 rounded-lg p-2 transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-gray-700">
                    {t("profilePanel.myProfile")}
                  </span>
                </Link>
                <button
                  onClick={() => setSupportOpen(true)}
                  className="w-full flex items-center gap-2 hover:bg-accent/50 rounded-lg p-2 transition-colors"
                >
                  <Headphones className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-gray-700">
                    {t("profilePanel.support")}
                  </span>
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full bg-destructive text-white rounded-2xl py-2 flex items-center justify-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" /> {t("profilePanel.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding disabled */}

      {/* Role Change Dialog */}
      {isRoleDialogOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsRoleDialogOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-card/95 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-[320px] p-4 border">
              <button
                onClick={() => setIsRoleDialogOpen(false)}
                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full hover:bg-accent/60 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {t("profilePage.changeRole")}
                </h3>
                <p className="text-xs text-gray-600">
                  {t("roleSelection.description")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Пассажир */}
                <button
                  onClick={() => handleRoleChange("passenger")}
                  disabled={updateRoleMutation.isPending || userData?.role === "passenger"}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    userData?.role === "passenger"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                  } ${updateRoleMutation.isPending || userData?.role === "passenger" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    userData?.role === "passenger"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm text-gray-900">
                    {t("nav.passengerTab")}
                  </span>
                </button>

                {/* Водитель */}
                <button
                  onClick={() => handleRoleChange("driver")}
                  disabled={updateRoleMutation.isPending || userData?.role === "driver"}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    userData?.role === "driver"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                  } ${updateRoleMutation.isPending || userData?.role === "driver" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    userData?.role === "driver"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <Car className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm text-gray-900">
                    {t("nav.driverTab")}
                  </span>
                </button>
              </div>
              {updateRoleMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <span>{t("roleSelection.saving")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSupportOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-card/95 backdrop-blur-sm rounded-xl shadow-lg w/full max-w-[280px] p-4 text-center border">
              <button
                onClick={() => setSupportOpen(false)}
                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full hover:bg-accent/60"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="mb-3">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <User className="w-10 h-10 text-primary absolute top-1 left-1" />
                  <Headphones className="w-6 h-6 text-primary absolute -top-1 -right-1" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {t("support.title")}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  {t("support.description")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <a
                  href="https://t.me/uputi_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-colors text-xs font-medium"
                >
                  {/* Telegram Icon */}
                  <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden="true">
                    <path fill="currentColor" d="M9.04 15.49 8.88 19c.27 0 .39-.12.54-.27l1.93-2.33 3.99 2.91c.73.4 1.26.19 1.45-.68l2.63-12.36c.27-1.25-.45-1.74-1.25-1.43L3.34 9.5c-1.2.47-1.19 1.14-.21 1.45l4.63 1.44 10.77-6.8c.51-.31.98-.14.59.2z" />
                  </svg>
                  {t("support.button")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MainLayout;
