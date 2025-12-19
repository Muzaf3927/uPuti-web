import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { safeLocalStorage } from "@/lib/localStorage";

const I18nContext = createContext({ lang: "uz", t: (k) => k, setLang: () => {} });

const dict = {
  uz: {
    nav: {
      booking: "Topilgan",
      history: "Tarix",
      orders: "Yaratilgan",
      passengerTab: "Yo'lovchi",
      driverTab: "Haydovchi",
      cityPassenger: "Zakaz yaratish",
      cityDriver: "Yaqin zakazlar",
      intercityPassenger: "Haydovchi topish",
      intercityDriver: "Safar yaratish",
    },
    roleSelection: {
      title: "Rolingizni tanlang",
      description: "Iltimos, ilovadan qanday foydalanishingizni tanlang",
      canChangeLater: "Keyinroq, sozlamalarda rolni o'zgartirishingiz mumkin",
      success: "Rol muvaffaqiyatli tanlandi",
      error: "Rolni tanlashda xatolik yuz berdi",
      saving: "Saqlanmoqda...",
    },
    booking: {
      myBookings: "Olganlarim",
      loading: "Yuklanmoqda...",
      none: "Sizda bonlar yo'q.",
      myTripsNone: "Sizda zarzalar yo'q.",
      write: "Yozish",
      call: "Qo'ng'iroq qilish",
      error: "Xatolik",
      phoneNotAvailable: "Raqam ko'rsatilmagan",
      offeredPrice: "Taklif qilingan narx",
      status: {
        requested: "Kutilmoqda",
        accepted: "Qabul qilindi"
      }
    },
    history: {
      empty: "Zakaxlar tarixi bo'sh",
      completed: "Yakunlangan",
      ratingTitle: "Foydalanuvchini baholash",
      ratingComment: "Izoh (ixtiyoriy)",
      ratingSubmitted: "Baxo yuborildi",
      skip: "O'tkazib yuborish",
      next: "Keyingi",
      finish: "Yakunlash",
    },
    tripsCard: {
      seats: "o'rindiq",
      commentPlaceholder: "Shuncha so'm taklif qila olaman",
      bookingTitle: "Nechta o'rin?",
      offerTitle: "Narx taklif qilish",
      bookingDescription: "Bron qilish uchun o'rinlar sonini tanlang",
      offerDescription: "Narxingizni va o'rinlar sonini taklif qiling",
      seatsLabel: "O'rindiqlar soni",
      priceLabel: "Taklif narxi (so'm)",
      pricePerPassengerLabel: "1 yo'lovchi uchun narx (so'm)",
      totalPriceLabel: "Jami summa",
      commentLabel: "Izoh",
      submitBooking: "Yuborish",
      submitOffer: "Yuborish",
      cancelButton: "Bekor qilish",
      bookButton: "Bron qilish",
      offerButton: "Narx taklif qilish",
      validation: {
        seatsRange: "Iltimos, 1-4 o'rin orasida kiriting",
        priceRequired: "Iltimos, taklif narxini kiriting"
      },
      success: {
        bookingCreated: "Bron qilindi",
        offerSent: "Taklif yuborildi",
        bookingCancelled: "So'rov bekor qilindi"
      },
      errors: {
        unauthorized: "Tizimga kirish kerak",
        forbidden: "Bu amalni bajarish uchun ruxsat yo'q",
        validation: "Ma'lumotlarni to'g'ri kiriting",
        bookingFailed: "Bron qilishda xatolik yuz berdi",
        offerFailed: "Taklif yuborishda xatolik yuz berdi",
        cancelFailed: "Bekor qilishda xatolik yuz berdi"
      }
    },
    profile: {
      back: "Orqaga qaytish",
      edit: "Tahrirlash",
      rating: "Reyting:",
    },
    profilePage: {
      nameLabel: "Ism",
      namePlaceholder: "Ismingizni kiriting",
      save: "Saqlash",
      saving: "Saqlanmoqda...",
      cancel: "Bekor qilish",
      verified: "Tasdiqlangan",
      deleteAccount: "Akkauntni o'chirish",
      deleting: "O'chirilmoqda...",
      confirmTitle: "Akkauntni o'chirishni tasdiqlash",
      confirmDescription: "Haqiqatan ham akkauntingizni o'chirmoqchimisiz?",
      confirm: "Ha, o'chirish",
      close: "Yopish",
      errorLoading: "Profilni yuklashda xatolik",
      none: "—",
      roleSection: "Rol",
      changeRole: "Rolni o'zgartirish",
      roleChanged: "Rol muvaffaqiyatli o'zgartirildi",
      roleChangeError: "Rolni o'zgartirishda xatolik yuz berdi",
    },
    trips: {
      all: "Barcha safarlar",
      mine: "Mening safarlarim",
      create: "Safar yaratish",
      empty: "Sizda safarlar yo'q.",
      commentPlaceholder: "Samarqand orqali ketaman",
      searchEmpty: "Hozircha siz tanlagan yo'nalishda safar yo'q, keyinroq urinib ko'ring.",
      form: {
        from: "Qayerdan",
        to: "Qayerga",
        date: "Sana",
        time: "Vaqt",
        cost: "Yo'lkira",
        carModel: "Mashina modeli",
        carColor: "Mashina rangi",
        carNumber: "Mashina raqami",
        carSeats: "O'rindiqlar soni",
        note: "Izoh",
        cancel: "Bekor qilish",
        submit: "Yaratish",
        submitting: "Yaratilmoqda...",
        fromPlaceholder: "Toshkent",
        toPlaceholder: "Buxoro",
        costPlaceholder: "50000",
        carModelPlaceholder: "Nexia",
        carColorPlaceholder: "Oq",
        carNumberPlaceholder: "01A123BA",
        carSeatsPlaceholder: "4",
        validationError: "Iltimos, barcha majburiy maydonlarni to'ldiring",
        successMessage: "Safar yaratildi.",
        errorMessage: "Safar yaratishda xatolik yuz berdi.",
        validation: {
          fromRequired: "Qayerdan maydoni to'ldirilishi shart",
          toRequired: "Qayerga maydoni to'ldirilishi shart",
          dateRequired: "Sana tanlanishi shart",
          timeRequired: "Vaqt tanlanishi shart",
          costRequired: "Xizmat haqqi kiritilishi shart",
          carSeatsRequired: "O'rindiqlar soni kiritilishi shart",
          carModelRequired: "Mashina rusumi kiritilishi shart",
          carColorRequired: "Mashina rangi kiritilishi shart",
          carNumberRequired: "Mashina raqami kiritilishi shart",
          futureDateTime: "Sana va vaqt kelajakda bo'lishi kerak"
        }
      },
      searchForm: {
        from: "Qayerdan",
        to: "Qayerga",
        date: "Sana",
        fromPlaceholder: "Qaysi shahardan",
        toPlaceholder: "Qaysi shaharga",
        datePlaceholder: "06.09.2025",
        search: "Qidirish",
        cancel: "Bekor qilish",
        clear: "Qidiruvni tozalash"
      },
      confirmation: {
        title: "Tasdiqlash",
        message: "Bron qilganingizdan so'ng siz haydovchi bilan  yoki haydovchi siz bilan bog'lanishi mumkin",
        continue: "Davom etish",
        cancel: "Bekor qilish"
      }
    },
    auth: {
      loginTitle: "Tizimga kirish",
      loginBtn: "Kirish",
      nameLabel: "Ism",
      phoneLabel: "Telefon raqami",
      phonePlaceholder: "90 003 89 02",
      deleteAccount: {
        confirmCancel: "Bekor qilish",
        confirmDelete: "Ha, o'chirish",
        deleting: "O'chirilmoqda...",
        phoneLabel: "Telefon raqami",
        phonePlaceholder: "90 003 89 02",
        subtitle: "Akkauntingizni butunlay o'chirish uchun telefon raqamingiz va parolingizni kiriting",
        successMessage: "Akkaunt muvaffaqiyatli o'chirildi",
        title: "Akkauntni o'chirish",
        warning: "Diqqat! Barcha ma'lumotlar butunlay o'chiriladi va qayta tiklanmaydi!"
      },
    },
    myTripsCard: {
      requests: "So'rovlar",
      bookings: "Bronlar",
      passengers: "Yo'lovchilar",
      complete: "Yakunlash",
      edit: "Tahrirlash",
      delete: "O'chirish",
      loading: "Yuklanmoqda...",
      noRequests: "So'rovlar yo'q.",
      noBookings: "Bronlar yo'q.",
      accept: "Qabul qilish",
      decline: "Bekor qilish",
      acceptedToast: "Tasdiqlandi.",
      declinedToast: "Bekor qilindi.",
      completeToast: "Safar yakunlandi.",
      completeError: "Yakunlashda xatolik.",
      callPassenger: "Qo'ng'iroq",
      writePassenger: "Yozish",
      confirmDelete: "O'chirishni tasdiqlash",
      confirmDeleteMessage: "Rostdan ham bu safarni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
    },
    requests: {
      loading: "Yuklanmoqda...",
      emptyMine: "So'rovlaringiz yo'q.",
      emptyToMe: "Sizning kelgan so'rovlar yo'q.",
      pending: "Kutilmoqda",
      seats: "ta o'rin",
      price: "Narx",
      offer: "Taklif",
      accept: "Qabul qilish",
      decline: "Bekor qilish",
      acceptError: "Tasdiqlashda xatolik.",
      declineError: "Bekor qilishda xatolik.",
    },
    orders: {
      all: "Zakazlar",
      mine: "Qabul qilindi",
      create: "Zakaz berish",
      loading: "Yuklanmoqda...",
      history: {
        completed: "Yakunlangan",
        cancelled: "Bekor qilingan",
        callPassenger: "Yo'lovchiga qo'ng'iroq",
        callDriver: "Haydovchiga qo'ng'iroq",
      },
      myOrderActions: {
        delete: "O'chirish",
        complete: "Yakunlash",
        callDriver: "Haydovchiga qo'ng'iroq qilish",
        completeSuccess: "Buyurtma yakunlandi.",
        completeError: "Buyurtmani yakunlashda xatolik yuz berdi.",
        deleteSuccess: "Buyurtma o'chirildi.",
        deleteError: "Buyurtmani o'chirishda xatolik yuz berdi.",
        confirmDelete: "O'chirishni tasdiqlash",
        confirmDeleteMessage: "Bu buyurtmani o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.",
      },
      form: {
        from: "Qayerdan",
        to: "Qayerga",
        date: "Sana",
        time: "Vaqt",
        cancel: "Bekor qilish",
        fromPlaceholder: "Toshkent",
        toPlaceholder: "Buxoro",
        validationError: "Iltimos, barcha majburiy maydonlarni to'ldiring",
        validation: {
          fromRequired: "Qayerdan maydoni to'ldirilishi shart",
          toRequired: "Qayerga maydoni to'ldirilishi shart",
          dateRequired: "Sana tanlanishi shart",
          timeRequired: "Vaqt tanlanishi shart",
          seatsRequired: "O'rinlar soni kiritilishi shart",
          futureDateTime: "Sana va vaqt kelajakda bo'lishi kerak",
          selectRouteOnMap: "Iltimos, kartada marshrutni tanlang"
        }
      },
      map: {
        from: "Qayerdan",
        to: "Qayerga"
      },
      popup: {
        seats: "O'rinlar",
        price: "Narx",
        comment: "Izoh",
        passenger: "Yo'lovchi",
        statusActive: "Faol",
        statusCompleted: "Yakunlangan",
        statusCancelled: "Bekor qilingan",
        close: "Yopish",
        phone: "Telefon"
      },
      bottomSheet: {
        cancelSuccess: "So'rov muvaffaqiyatli bekor qilindi.",
        cancelError: "So'rovni bekor qilishda xatolik yuz berdi.",
        acceptSuccess: "Taklif qabul qilindi.",
        rejectSuccess: "Taklif rad etildi.",
        acceptError: "Taklifni qabul qilishda xatolik.",
        rejectError: "Taklifni rad etishda xatolik."
      }
    },
    profilePanel: {
      name: "Ism",
      phone: "Telefon",
      rating: "Reyting",
      support: "Texnik yordam",
      logout: "Chiqish",
    },
    support: {
      title: "Savollar va takliflar uchun",
      description: "Savollaringiz bormi? Yordam markazi bilan bog'lanish",
      button: "Yozish",
      close: "Yopish",
    },
    download: {
      android: "Yuklab olish",
      ios: "Yuklab olish",
    },
    logout: {
      success: "Muvaffaqiyatli tizimdan chiqdingiz!",
    },
    onboarding: {
      title: "UPuti ga xush kelibsiz!",
      subtitle: "Bu yerda yo'lovchilar va haydovchilar bir-birini topadilar.",
      description: "Siz tezda safar yaratishingiz yoki poputka topishingiz mumkin.",
      passengerTitle: "Yo'lovchilar uchun:",
      passengerDesc: "kerakli yo'nalish bo'yicha safarni toping — taksidan arzonroq va qulayroq.",
      driverTitle: "Haydovchilar uchun:",
      driverDesc: "kim bilan ketishingizni oldindan biling va benzin xarajatini qoplang.",
      cta: "👉 Ortiqcha tashvishlarsiz: bron qiling va yo'lga chiqing!",
      button: "Boshlash",
    },
    common: {
      driver: "Haydovchi",
      phoneNotAvailable: "Raqam ko'rsatilmagan",
      number: "Raqam",
      confirmed: "Tasdiqlangan",
      seats: "o'rindiq",
      price: "Narx",
      offer: "Taklif",
    },
    geolocation: {
      title: "Geolokatsiyani yoqing",
      description: "Ilovadan to'liq foydalanish uchun geolokatsiyani yoqishingiz kerak",
      android: {
        step1: "Telefon sozlamalariga kiring",
        step2: "Ilovalar yoki Dasturlar bo'limini tanlang",
        step3: "UPuti ilovasini toping",
        step4: "Ruxsatlar bo'limida Geolokatsiyani yoqing"
      },
      ios: {
        step1: "Telefon sozlamalariga kiring",
        step2: "Maxfiylik bo'limini tanlang",
        step3: "Xizmatlar bo'limida Geolokatsiyani toping",
        step4: "UPuti ilovasi uchun Geolokatsiyani yoqing"
      },
      generic: {
        instructions: "Brauzer sozlamalarida geolokatsiya ruxsatini yoqing"
      },
      button: "Tushundim"
    },
  },
  ru: {
    nav: {
      booking: "Брони",
      history: "История",
      orders: "Принятие",
      passengerTab: "Пассажир",
      driverTab: "Водитель",
      cityPassenger: "Создать поездку",
      cityDriver: "Поездки рядом",
      intercityPassenger: "Найти поездку",
      intercityDriver: "Создать поездку",
    },
    roleSelection: {
      title: "Выберите вашу роль",
      description: "Пожалуйста, выберите, как вы будете использовать приложение",
      canChangeLater: "Вы сможете изменить роль позже в настройках",
      success: "Роль успешно выбрана",
      error: "Ошибка при выборе роли",
      saving: "Сохранение...",
    },
    booking: {
      myBookings: "Мои брони",
      loading: "Загрузка...",
      none: "Пока нет броней.",
      myTripsNone: "Пока нет ваших поездок.",
      write: "Написать",
      call: "Позвонить",
      error: "Ошибка",
      offeredPrice: "Предложенная цена",
      status: {
        requested: "В ожидании",
        accepted: "Принято"
      }
    },
    history: {
      empty: "История поездок пуста",
      completed: "Завершено",
      ratingTitle: "Оценка пользователю",
      ratingComment: "Комментарий (необязательно)",
      ratingSubmitted: "Оценка отправлена",
      skip: "Пропустить",
      next: "Далее",
      finish: "Завершить",
    },
    tripsCard: {
      cancel: "Отменить",
      seats: "мест",
      commentPlaceholder: "Могу предложить столько сумм",
      bookingTitle: "Сколько мест?",
      offerTitle: "Предложить цену",
      bookingDescription: "Выберите количество мест для бронирования",
      offerDescription: "Предложите свою цену и количество мест",
      seatsLabel: "Количество мест",
      priceLabel: "Предложить цену (сум)",
      pricePerPassengerLabel: "Цена за 1 пассажира (сум)",
      totalPriceLabel: "Общая сумма",
      commentLabel: "Комментарий",
      submitBooking: "Отправить",
      submitOffer: "Отправить",
      cancelButton: "Отмена",
      bookButton: "Забронировать",
      offerButton: "Предложить цену",
      validation: {
        seatsRange: "Пожалуйста, введите от 1 до 4 мест",
        priceRequired: "Пожалуйста, введите предложенную цену"
      },
      success: {
        bookingCreated: "Бронь создана",
        offerSent: "Предложение отправлено",
        bookingCancelled: "Заявка отменена"
      },
      errors: {
        unauthorized: "Необходимо войти в систему",
        forbidden: "Нет прав для выполнения этого действия",
        validation: "Проверьте правильность введенных данных",
        bookingFailed: "Ошибка при бронировании",
        offerFailed: "Ошибка при отправке предложения",
        cancelFailed: "Ошибка при отмене"
      }
    },
    profile: {
      back: "Назад",
      edit: "Редактировать",
      rating: "Рейтинг:",
    },
    profilePage: {
      nameLabel: "Имя",
      namePlaceholder: "Введите имя",
      save: "Сохранить",
      saving: "Сохранение...",
      cancel: "Отмена",
      verified: "Подтвержден",
      deleteAccount: "Удалить аккаунт",
      deleting: "Удаление...",
      confirmTitle: "Подтверждение удаления аккаунта",
      confirmDescription: "Вы уверены, что хотите удалить свой аккаунт?",
      confirm: "Да, удалить",
      close: "Закрыть",
      errorLoading: "Ошибка при загрузке профиля",
      none: "—",
      roleSection: "Роль",
      changeRole: "Изменить роль",
      roleChanged: "Роль успешно изменена",
      roleChangeError: "Ошибка при изменении роли",
    },
    trips: {
      all: "Все поездки",
      mine: "Мои поездки",
      create: "Создать поездку",
      empty: "Пока у вас нет поездок.",
      searchEmpty: "Пока что по вашему маршруту нету поездки, попробуйте позже.",
      commentPlaceholder: "Поеду через Самарканд",
      form: {
        from: "Откуда",
        to: "Куда",
        date: "Дата",
        time: "Время",
        cost: "Стоимость",
        carModel: "Модель машины",
        carColor: "Цвет машины",
        carNumber: "Номер машины",
        carSeats: "Количество мест",
        note: "Примечание",
        cancel: "Отмена",
        submit: "Создать",
        submitting: "Создается...",
        fromPlaceholder: "Ташкент",
        toPlaceholder: "Бухара",
        costPlaceholder: "50000",
        carModelPlaceholder: "Nexia",
        carColorPlaceholder: "Белый",
        carNumberPlaceholder: "01А123БЦ",
        carSeatsPlaceholder: "4",
        validationError: "Пожалуйста, заполните все обязательные поля",
        successMessage: "Поездка создана.",
        errorMessage: "Ошибка при создании поездки.",
        validation: {
          fromRequired: "Поле 'Откуда' обязательно для заполнения",
          toRequired: "Поле 'Куда' обязательно для заполнения",
          dateRequired: "Дата должна быть выбрана",
          timeRequired: "Время должно быть выбрано",
          costRequired: "Стоимость должна быть указана",
          carSeatsRequired: "Количество мест должно быть указано",
          carModelRequired: "Модель машины должна быть указана",
          carColorRequired: "Цвет машины должен быть указан",
          carNumberRequired: "Номер машины должен быть указан",
          futureDateTime: "Дата и время должны быть в будущем"
        }
      },
      searchForm: {
        from: "Откуда",
        to: "Куда",
        date: "Дата",
        fromPlaceholder: "Из какого города",
        toPlaceholder: "В какой город",
        datePlaceholder: "06.09.2025",
        search: "Поиск",
        cancel: "Отмена",
        clear: "Очистить поиск"
      },
      confirmation: {
        title: "Подтверждение",
        message: "После бронирование сможете друг с другом созвониться",
        continue: "Продолжить",
        cancel: "Отмена"
      }
    },
    auth: {
      loginTitle: "Вход",
      loginBtn: "Войти",
      nameLabel: "Имя",
      phoneLabel: "Номер телефона",
      phonePlaceholder: "-- --- -- --",
      deleteAccount: {
        confirmCancel: "Отмена",
        confirmDelete: "Да, удалить",
        deleting: "Удаление...",
        phoneLabel: "Номер телефона",
        phonePlaceholder: "-- --- -- --",
        subtitle: "Для полного удаления аккаунта введите номер телефона и пароль",
        successMessage: "Аккаунт успешно удален",
        title: "Удаление аккаунта",
        warning: "Внимание! Все данные будут полностью удалены и не подлежат восстановлению!"
      },
    },
    myTripsCard: {
      requests: "Заявки",
      bookings: "Брони",
      passengers: "Пассажиры",
      complete: "Завершить",
      edit: "Редактировать",
      delete: "Удалить",
      loading: "Загрузка...",
      noRequests: "Заявок пока нет.",
      noBookings: "Броней пока нет.",
      accept: "Принять",
      decline: "Отклонить",
      acceptedToast: "Подтверждено.",
      declinedToast: "Отклонено.",
      completeToast: "Поездка завершена.",
      completeError: "Ошибка при завершении.",
      callPassenger: "Позвонить",
      writePassenger: "Написать",
      confirmDelete: "Подтверждение удаления",
      confirmDeleteMessage: "Вы уверены, что хотите удалить эту поездку? Это действие нельзя отменить.",
    },
    requests: {
      loading: "Загрузка...",
      emptyMine: "Пока нет отправленных заявок.",
      emptyToMe: "Пока нет заявок на ваши поездки.",
      pending: "В ожидании",
      seats: "мест",
      price: "Цена",
      offer: "Предложение",
      accept: "Принять",
      decline: "Отклонить",
      acceptError: "Ошибка при подтверждении.",
      declineError: "Ошибка при отклонении.",
    },
    orders: {
      all: "Все заказы",
      mine: "Мои заказы",
      create: "Создать заказ",
      loading: "Загрузка...",
      history: {
        completed: "Завершен",
        cancelled: "Отменен",
        callPassenger: "Позвонить пассажиру",
        callDriver: "Позвонить водителю",
      },
      myOrderActions: {
        delete: "Удалить",
        complete: "Завершить",
        callDriver: "Позвонить водителю",
        completeSuccess: "Заказ завершен.",
        completeError: "Ошибка при завершении заказа.",
        deleteSuccess: "Заказ удален.",
        deleteError: "Ошибка при удалении заказа.",
        confirmDelete: "Подтвердить удаление",
        confirmDeleteMessage: "Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.",
      },
      form: {
        from: "Откуда",
        to: "Куда",
        date: "Дата",
        time: "Время",
        cancel: "Отмена",
        fromPlaceholder: "Ташкент",
        toPlaceholder: "Бухара",
        validationError: "Пожалуйста, заполните все обязательные поля",
        validation: {
          fromRequired: "Поле 'Откуда' обязательно для заполнения",
          toRequired: "Поле 'Куда' обязательно для заполнения",
          dateRequired: "Дата должна быть выбрана",
          timeRequired: "Время должно быть выбрано",
          seatsRequired: "Количество мест должно быть указано",
          futureDateTime: "Дата и время должны быть в будущем",
          selectRouteOnMap: "Пожалуйста, выберите маршрут на карте"
        }
      },
      map: {
        from: "Откуда",
        to: "Куда"
      },
      popup: {
        seats: "Мест",
        price: "Цена",
        comment: "Комментарий",
        passenger: "Пассажир",
        statusActive: "Активный",
        statusCompleted: "Завершен",
        statusCancelled: "Отменен",
        close: "Закрыть",
        phone: "Телефон"
      },
      bottomSheet: {
        cancelSuccess: "Запрос успешно отменен.",
        cancelError: "Ошибка при отмене запроса.",
        acceptSuccess: "Предложение принято.",
        rejectSuccess: "Предложение отклонено.",
        acceptError: "Ошибка при принятии предложения.",
        rejectError: "Ошибка при отклонении предложения."
      }
    },
    profilePanel: {
      name: "Имя",
      phone: "Телефон",
      rating: "Рейтинг",
      support: "Техподдержка",
      logout: "Выйти",
    },
    support: {
      title: "Вопросы и предложения",
      description: "Есть вопросы? Свяжитесь  Тех поддержкой",
      button: "Написать",
      close: "Закрыть",
    },
    download: {
      android: "Скачать",
      ios: "Скачать",
    },
    logout: {
      success: "Вы успешно вышли из системы!",
    },
    onboarding: {
      title: "Добро пожаловать в UPuti!",
      subtitle: "Здесь пассажиры и водители находят друг друга.",
      description: "Вы можете быстро создать поездку или найти попутку.",
      passengerTitle: "Для пассажиров:",
      passengerDesc: "найдёшь поездку по нужному маршруту дешевле и удобнее, чем такси или автобус.",
      driverTitle: "Для водителей:",
      driverDesc: "заранее знаешь, кто поедет с тобой, и экономишь на бензине.",
      cta: "👉 Без лишних хлопот: бронируй и езжай!",
      button: "Начать",
    },
    common: {
      driver: "Водитель",
      phoneNotAvailable: "Номер не указан",
      number: "Номер",
      confirmed: "Подтверждено",
      seats: "мест",
      price: "Цена",
      offer: "Предложение",
    },
    geolocation: {
      title: "Включите геолокацию",
      description: "Для полноценного использования приложения необходимо включить геолокацию",
      android: {
        step1: "Откройте настройки телефона",
        step2: "Выберите раздел Приложения или Программы",
        step3: "Найдите приложение UPuti",
        step4: "В разделе Разрешения включите Геолокацию"
      },
      ios: {
        step1: "Откройте настройки телефона",
        step2: "Выберите раздел Конфиденциальность",
        step3: "В разделе Службы найдите Геолокацию",
        step4: "Включите Геолокацию для приложения UPuti"
      },
      generic: {
        instructions: "Включите разрешение на геолокацию в настройках браузера"
      },
      button: "Понятно"
    },
  },
};

export function I18nProvider({ children }) {
  const initialLang = (() => {
    const saved = safeLocalStorage.getItem("lang");
    if (saved === "ru" || saved === "uz") return saved;
    return "uz";
  })();
  const [lang, setLang] = useState(initialLang);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!safeLocalStorage.getItem("lang")) {
      safeLocalStorage.setItem("lang", "uz");
    }
    setIsReady(true);
  }, []);
  const t = useMemo(() => {
    const d = dict[lang] || dict.uz;
    return (key) => {
      const result = key.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), d);
      return result !== undefined ? result : key;
    };
  }, [lang]);
  const value = useMemo(
    () => ({
      lang,
      isReady,
      setLang: (l) => {
        safeLocalStorage.setItem("lang", l);
        setLang(l);
      },
      t,
    }),
    [lang, isReady, t]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}


