import React, { useState, useRef, useEffect } from "react";

// shadcn ui
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MapPin, Users, User, Phone, Headphones, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// redux toolkit
import { useDispatch } from "react-redux";
import { login } from "@/app/userSlice/userSlice";

// others
import { Link, useLocation, useNavigate } from "react-router-dom";
import { InputMask } from "@react-input/mask";
import { usePostData } from "@/api/api";
import { toast } from "sonner";
import { useI18n } from "@/app/i18n.jsx";
import Onboarding from "@/components/Onboarding";
import { safeLocalStorage } from "@/lib/localStorage";
import { sessionManager } from "@/lib/sessionManager";
import DownloadButtons from "@/components/DownloadButtons";

function Login() {
  const { t, lang, setLang } = useI18n();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const startAuthMutation = usePostData("/auth/start");
  const verifyAuthMutation = usePostData("/auth/verify");
  const dispatch = useDispatch();

  const mobileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const formData = new FormData(e.target);

    const name = formData.get("name");
    const phone = formData.get("phone");

    if (!name || !phone) {
      const errorMessage = lang === "ru"
        ? "Пожалуйста, заполните все поля"
        : "Iltimos, barcha maydonlarni to'ldiring";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    // Clean phone number - remove all non-digits, then extract only 9 digits (without 998)
    const cleanPhone = phone.replace(/\D/g, ""); // Remove all non-digits
    // Remove 998 prefix if present, keep only 9 digits
    const phoneWithoutPrefix = cleanPhone.startsWith("998")
      ? cleanPhone.slice(3)
      : cleanPhone;

    if (phoneWithoutPrefix.length !== 9) {
      const errorMessage = lang === "ru"
        ? "Номер телефона должен содержать 9 цифр"
        : "Telefon raqami 9 raqamdan iborat bo'lishi kerak";
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      const requestData = {
        name: name.trim(),
        phone: phoneWithoutPrefix,
      };

      const res = await startAuthMutation.mutateAsync(requestData);
      
      // Если пришел токен напрямую (тестовый пользователь), логиним сразу
      if (res.access_token && res.user) {
        toast.success(
          lang === "ru"
            ? "Вход выполнен успешно"
            : "Tizimga muvaffaqiyatli kirdingiz!"
        );

        // Принудительно завершаем все предыдущие сессии
        sessionManager.forceLogoutAllSessions();

        // Сохраняем токен
        safeLocalStorage.setItem("token", res.access_token);
        
        // Создаем новую сессию с данными пользователя
        sessionManager.createSession(res.user, res.access_token);
        dispatch(login(res.user));
        return;
      }
      
      // Обычный поток с OTP
      if (res.verification_id) {
        setVerificationId(res.verification_id);
        setShowOtpModal(true);
        setOtpCode("");
        setOtpError("");
        toast.success(
          lang === "ru"
            ? "Код отправлен на ваш номер телефона"
            : "Kodingiz telefon raqamingizga yuborildi"
        );
      }
    } catch (err) {
      console.error("Start auth error:", err);
      
      let errorMessage = "";
      
      if (err.response?.status === 422) {
        errorMessage = err.response?.data?.message || (lang === "ru"
          ? "Проверьте правильность введенных данных"
          : "Kiritilgan ma'lumotlarni tekshiring");
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.message || (lang === "ru"
          ? "Ошибка отправки SMS. Попробуйте ещё раз"
          : "SMS yuborishda xatolik. Qaytadan urinib ko'ring");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = lang === "ru"
          ? "Ошибка. Попробуйте ещё раз"
          : "Xatolik. Qaytadan urinib ko'ring";
      }
      
      toast.error(errorMessage);
      setFormError(errorMessage);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");

    if (!otpCode || otpCode.length !== 6) {
      const errorMessage = lang === "ru"
        ? "Введите 6-значный код"
        : "6 raqamli kodni kiriting";
      setOtpError(errorMessage);
      return;
    }

    if (!verificationId) {
      setOtpError(lang === "ru" ? "Ошибка верификации" : "Tekshirish xatosi");
      return;
    }

    try {
      const requestData = {
        verification_id: verificationId,
        code: otpCode,
      };

      const res = await verifyAuthMutation.mutateAsync(requestData);
      
      if (res.access_token && res.user) {
        toast.success(
          lang === "ru"
            ? "Вход выполнен успешно"
            : "Tizimga muvaffaqiyatli kirdingiz!"
        );

        // Принудительно завершаем все предыдущие сессии
        sessionManager.forceLogoutAllSessions();

        // Сохраняем токен
        safeLocalStorage.setItem("token", res.access_token);
        
        // Создаем новую сессию с данными пользователя
        sessionManager.createSession(res.user, res.access_token);
        dispatch(login(res.user));
        
        setShowOtpModal(false);
        setOtpCode("");
        setVerificationId(null);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      
      let errorMessage = "";
      
      if (err.response?.status === 422) {
        const backendMessage = err.response?.data?.message;
        if (backendMessage === "Invalid code" || backendMessage === "Verification expired") {
          errorMessage = backendMessage === "Invalid code"
            ? (lang === "ru" ? "Неверный код" : "Noto'g'ri kod")
            : (lang === "ru" ? "Код истёк. Запросите новый" : "Kod muddati tugadi. Yangi kod so'rang");
        } else if (backendMessage === "Too many attempts") {
          errorMessage = lang === "ru"
            ? "Слишком много попыток. Запросите новый код"
            : "Juda ko'p urinishlar. Yangi kod so'rang";
        } else {
          errorMessage = backendMessage || (lang === "ru"
            ? "Ошибка верификации"
            : "Tekshirish xatosi");
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = lang === "ru"
          ? "Ошибка верификации. Попробуйте ещё раз"
          : "Tekshirish xatosi. Qaytadan urinib ko'ring";
      }
      
      toast.error(errorMessage);
      setOtpError(errorMessage);
    }
  };

  // Show success modal if redirected after account deletion
  useEffect(() => {
    const fromState = !!location.state?.accountDeleted;
    let fromSession = false;
    try {
      fromSession = sessionStorage.getItem("accountDeleted") === "1";
    } catch (_) {}

    if (fromState || fromSession) {
      setShowDeletedModal(true);
      try {
        sessionStorage.removeItem("accountDeleted");
      } catch (_) {}
      navigate(".", { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pt-6 pb-6 px-1 flex gap-3 flex-col items-center justify-start min-h-screen">
      

      <h1 className="flex items-center justify-center text-primary font-bold">
        <img
          src="/logo.png"
          alt="UPuti"
          className="h-28 sm:h-32 lg:h-40 w-auto object-contain mix-blend-multiply"
        />
      </h1>
      
      <div className="relative w-full max-w-md -mt-2 md:mt-1">
      <Card
        className="w-full px-4 py-3 sm:py-4 border rounded-2xl ring-1 ring-blue-200/60 shadow-[0_9px_24px_rgba(59,130,246,0.15)] gap-2 sm:gap-3"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(79,70,229,0.12))" }}
      >
        <CardHeader className="relative p-0 pb-2 sm:pb-3">
          <CardTitle className="text-primary mx-auto text-lg sm:text-xl font-bold">
            {t("auth.loginTitle")}
          </CardTitle>
          <button
            type="button"
            onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full border bg-white hover:bg-accent/60 text-[10px] sm:text-xs"
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
        </CardHeader>
        <CardContent className="px-0 pt-0 pb-0">
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <div className="grid w-full max-w-sm items-center gap-2 sm:gap-3">
              <Label htmlFor="name" className="text-sm">
                {t("auth.nameLabel")}
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={lang === "ru" ? "Введите ваше имя" : "Ismingizni kiriting"}
                  required
                  autoComplete="name"
                  className="pl-10 h-8 sm:h-9 text-sm sm:text-base bg-blue-50/60"
                />
                <User
                  className="absolute left-2 top-2 text-gray-400"
                  size={16}
                />
              </div>
            </div>
            <div className="grid w-full max-w-sm items-center gap-2 sm:gap-3">
              <Label htmlFor="phone" className="text-sm">
                {t("auth.phoneLabel")}
              </Label>
              <div className="relative">
                <InputMask
                  mask="__ ___ __ __"
                  replacement={{ _: /\d/ }}
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder={t("auth.phonePlaceholder")}
                  required
                  autoComplete="tel"
                  onCopy={(e) => {
                    const v = e.currentTarget.value || "";
                    const digits = v.replace(/\D/g, "");
                    e.clipboardData.setData("text/plain", digits);
                    e.preventDefault();
                  }}
                  className="pl-20 sm:pl-24 font-normal file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 sm:h-9 w-full min-w-0 rounded-md border bg-blue-50/60 px-3 py-1 text-sm sm:text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-6 sm:file:h-7 file:border-0 file:bg-transparent file:text-xs sm:file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Phone
                  className="absolute left-2 top-2 text-gray-400"
                  size={16}
                />
                <p className="absolute left-8 sm:left-10 top-1.5 font-normal select-none text-sm">
                  +998
                </p>
              </div>
            </div>

            {formError && (
              <div className="text-red-500 text-xs sm:text-sm">
                {formError}
              </div>
            )}
            <Button
              type="submit"
              disabled={startAuthMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 h-8 sm:h-9 text-sm sm:text-base"
            >
              {startAuthMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {lang === "ru" ? "Отправка..." : "Yuborilmoqda..."}
                </span>
              ) : (
                t("auth.loginBtn")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>


      {supportOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSupportOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-card/95 backdrop-blur-sm border rounded-xl shadow-lg w-full max-w-[280px] p-4 text-center">
              <div className="mb-3">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <User className="w-10 h-10 text-primary absolute top-1 left-1" />
                  <Headphones className="w-6 h-6 text-primary absolute -top-1 -right-1" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t("support.title")}</h3>
                <p className="text-xs text-gray-600 mb-3">{t("support.description")}</p>
              </div>
              <a href="https://t.me/uputi_support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-colors text-xs font-medium">
                <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden="true"><path fill="currentColor" d="M9.04 15.49 8.88 19c.27 0 .39-.12.54-.27l1.93-2.33 3.99 2.91c.73.4 1.26.19 1.45-.68l2.63-12.36c.27-1.25-.45-1.74-1.25-1.43L3.34 9.5c-1.2.47-1.19 1.14-.21 1.45l4.63 1.44 10.77-6.8c.51-.31.98-.14.59.2z"/></svg>
                {t("support.button")}
              </a>
              <button onClick={() => setSupportOpen(false)} className="mt-4 text-xs text-destructive hover:brightness-110">{t("support.close")}</button>
            </div>
          </div>
        </div>
      )}
      {showDeletedModal && (
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeletedModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-card/95 backdrop-blur-sm border rounded-xl shadow-lg w-full max-w-[320px] p-4 text-center">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {lang === "ru" ? "Аккаунт удалён" : "Hisob o'chirildi"}
                </h3>
                <p className="text-xs text-gray-600">
                  {t("auth.deleteAccount.successMessage")}
                </p>
              </div>
              <button
                onClick={() => setShowDeletedModal(false)}
                className="mt-3 inline-flex items-center justify-center bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:brightness-110 transition-colors text-xs font-medium w-full"
              >
                {lang === "ru" ? "Понятно" : "Tushunarli"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* OTP Verification Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent preventOutsideClose={true}>
          <DialogHeader>
            <DialogTitle>
              {lang === "ru" ? "Подтверждение номера" : "Raqamni tasdiqlash"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ru"
                ? "Введите 6-значный код, отправленный на ваш номер телефона"
                : "Telefon raqamingizga yuborilgan 6 raqamli kodni kiriting"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="otpCode">
                {lang === "ru" ? "Код подтверждения" : "Tasdiqlash kodi"}
              </Label>
              <InputMask
                mask="______"
                replacement={{ _: /\d/ }}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError("");
                }}
                id="otpCode"
                name="otpCode"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                required
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest h-12 text-lg bg-blue-50/60"
              />
            </div>
            {otpError && (
              <div className="text-red-500 text-xs sm:text-sm">
                {otpError}
              </div>
            )}
            <Button
              type="submit"
              disabled={verifyAuthMutation.isPending}
              className="w-full"
            >
              {verifyAuthMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {lang === "ru" ? "Проверка..." : "Tekshirilmoqda..."}
                </span>
              ) : (
                lang === "ru" ? "Подтвердить" : "Tasdiqlash"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Download Buttons */}
      <div className="-mt-2">
        <DownloadButtons />
      </div>
      
      {/* Support button - positioned under download buttons */}
      <div className="w-full max-w-md flex items-center justify-end gap-2 mt-2">
        <p className="text-sm sm:text-base text-gray-700 font-medium">
          {lang === "ru" ? "Для вопросов и предложений" : "Talab va takliflar uchun"}
        </p>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
          aria-label={t("profilePanel.support")}
        >
          <Headphones className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default Login;
