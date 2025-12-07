import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/app/i18n.jsx";
import { Car, Users, MapPin, CheckCircle } from "lucide-react";

function Onboarding({ onComplete, setLang }) {
  const { t, lang } = useI18n();

  return (
    <div className="fixed inset-0 bg-[radial-gradient(700px_350px_at_-10%_-20%,_oklch(0.94_0.07_220)_0%,_transparent_60%),radial-gradient(900px_450px_at_110%_0%,_oklch(0.92_0.06_220)_0%,_transparent_60%)] z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl shadow-xl border bg-card/95 backdrop-blur-sm relative max-h-[95vh] overflow-y-auto rounded-2xl">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          {/* Кнопка переключения языков */}
          <button
            type="button"
            onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full border bg-white hover:bg-accent/60 text-[10px] sm:text-xs font-medium shadow-sm"
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

          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img
                src="/logo.png"
                alt="UPuti"
                className="h-12 sm:h-14 lg:h-16 w-auto object-contain mix-blend-multiply"
              />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-2 sm:mb-3">
              {t("onboarding.title")}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 mb-1 sm:mb-2">
              {t("onboarding.subtitle")}
            </p>
            <p className="text-sm sm:text-base text-gray-500">
              {t("onboarding.description")}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 lg:space-y-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Пассажиры */}
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary rounded-xl">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                  {t("onboarding.passengerTitle")}
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  {t("onboarding.passengerDesc")}
                </p>
              </div>
            </div>

            {/* Водители */}
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-accent rounded-xl">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                  {t("onboarding.driverTitle")}
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  {t("onboarding.driverDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-700">
              {t("onboarding.cta")}
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onComplete}
              className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 sm:px-8 sm:py-3 rounded-full text-sm sm:text-base lg:text-lg font-semibold shadow-lg w-full sm:w-auto"
            >
              {t("onboarding.button")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Onboarding;
