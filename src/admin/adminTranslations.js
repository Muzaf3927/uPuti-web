export const adminTranslations = {
  ru: {
    appTitle: "UPuti Admin",

    // auth
    authSubtitleLogin: "Вход в панель администратора",
    authSubtitleRegister: "Регистрация администратора",
    authTabLogin: "Вход",
    authTabRegister: "Регистрация",
    authPhoneLabel: "Телефон (9 цифр без +998)",
    authPasswordLabel: "Пароль",
    authSecretLabel: "Секретный ключ",
    authLoginButton: "Войти",
    authRegisterButton: "Зарегистрировать",
    authNoAccount: "Нет аккаунта? Зарегистрировать администратора",
    authHasAccount: "Уже есть аккаунт? Войти",

    // layout
    sidebarTitle: "UPuti Admin",
    navCommissions: "Комиссии",
    navUsers: "Пользователи",
    navMessages: "Сообщения",
    navLogout: "Выйти",

    // commissions
    commissionsTitle: "Комиссии",
    commissionsHint: "Фильтр по дате и статистика по комиссиям.",
    filterFrom: "От",
    filterTo: "До",
    filterReset: "Сбросить",
    cardTurnover: "Общий оборот",
    cardCommission: "Доход платформы (комиссии)",
    cardRecords: "Количество записей",
    tableId: "ID комиссии",
    tableTripId: "ID поездки",
    tableDriverId: "ID водителя",
    tableDriverPhone: "Телефон водителя",
    tableTurnover: "Оборот",
    tableCommission: "Комиссия",
    tablePercent: "%",
    tableDate: "Дата",
    tableLoading: "Загрузка комиссий...",
    tableEmpty: "Нет данных за выбранный период.",
    paginationText: (page, lastPage, total) =>
      `Страница ${page} из ${lastPage} — всего ${total} записей`,

    // users
    usersTitle: "Пользователи",
    usersHint: "Управление балансом и ролями пользователей.",
    balanceTitle: "Изменить баланс",
    balancePhoneLabel: "Телефон (9 цифр без +998)",
    balanceAmountLabel: "Сумма",
    balanceActionLabel: "Действие",
    balanceActionAdd: "Пополнить",
    balanceActionSubtract: "Списать",
    balanceSubmit: "Обновить баланс",
    balanceSubmitting: "Обновление...",
    balanceDone: "Баланс обновлён",

    roleTitle: "Изменить роль",
    rolePhoneLabel: "Телефон (9 цифр без +998)",
    roleSelectLabel: "Новая роль",
    roleDriver: "Водитель",
    rolePassenger: "Пассажир",
    roleSubmit: "Обновить роль",
    roleSubmitting: "Обновление...",

    // messages
    messagesTitle: "Сообщения",
    messagesHint: "Массовые рассылки и точечные уведомления пользователям.",

    broadcastTitle: "Отправить всем пользователям",
    broadcastRoleLabel: "Роль (необязательно)",
    broadcastRoleAll: "Все",
    broadcastRoleDriver: "Только водители",
    broadcastRolePassenger: "Только пассажиры",
    broadcastMessageLabel: "Сообщение",
    broadcastSubmit: "Отправить всем",
    broadcastSubmitting: "Отправка...",

    singleTitle: "Отправить пользователю",
    singlePhoneLabel: "Телефон (9 цифр без +998)",
    singleMessageLabel: "Сообщение",
    singleSubmit: "Отправить",
    singleSubmitting: "Отправка...",
  },

  uz: {
    appTitle: "UPuti Admin",

    // auth
    authSubtitleLogin: "Administrator paneliga kirish",
    authSubtitleRegister: "Administratorni ro'yxatdan o'tkazish",
    authTabLogin: "Kirish",
    authTabRegister: "Ro'yxatdan o'tish",
    authPhoneLabel: "Telefon (9 raqam, +998 siz)",
    authPasswordLabel: "Parol",
    authSecretLabel: "Maxfiy kalit",
    authLoginButton: "Kirish",
    authRegisterButton: "Administrator qo‘shish",
    authNoAccount: "Akkaunt yo‘qmi? Administrator qo‘shish",
    authHasAccount: "Akkaunt bormi? Kirish",

    // layout
    sidebarTitle: "UPuti Admin",
    navCommissions: "Komissiyalar",
    navUsers: "Foydalanuvchilar",
    navMessages: "Xabarlar",
    navLogout: "Chiqish",

    // commissions
    commissionsTitle: "Komissiyalar",
    commissionsHint: "Sana bo‘yicha filtr va komissiya statistikasi.",
    filterFrom: "Dan",
    filterTo: "Gacha",
    filterReset: "Tozalash",
    cardTurnover: "Umumiy aylanma",
    cardCommission: "Platforma daromadi (komissiya)",
    cardRecords: "Yozuvlar soni",
    tableId: "Komissiya ID",
    tableTripId: "Safar ID",
    tableDriverId: "Haydovchi ID",
    tableDriverPhone: "Haydovchi telefoni",
    tableTurnover: "Aylanma",
    tableCommission: "Komissiya",
    tablePercent: "%",
    tableDate: "Sana",
    tableLoading: "Komissiyalar yuklanmoqda...",
    tableEmpty: "Tanlangan davrda maʼlumot yoʻq.",
    paginationText: (page, lastPage, total) =>
      `Sahifa ${page}/${lastPage} — jami ${total} yozuv`,

    // users
    usersTitle: "Foydalanuvchilar",
    usersHint: "Balans va rollarni boshqarish.",
    balanceTitle: "Balansni o‘zgartirish",
    balancePhoneLabel: "Telefon (9 raqam, +998 siz)",
    balanceAmountLabel: "Miqdor",
    balanceActionLabel: "Amal",
    balanceActionAdd: "To‘ldirish",
    balanceActionSubtract: "Ayirish",
    balanceSubmit: "Balansni yangilash",
    balanceSubmitting: "Yangilanmoqda...",
    balanceDone: "Balans yangilandi",

    roleTitle: "Rolni o‘zgartirish",
    rolePhoneLabel: "Telefon (9 raqam, +998 siz)",
    roleSelectLabel: "Yangi rol",
    roleDriver: "Haydovchi",
    rolePassenger: "Yo‘lovchi",
    roleSubmit: "Rolni yangilash",
    roleSubmitting: "Yangilanmoqda...",

    // messages
    messagesTitle: "Xabarlar",
    messagesHint: "Ommaviy xabarlar va alohida foydalanuvchilarga xabar yuborish.",

    broadcastTitle: "Barcha foydalanuvchilarga yuborish",
    broadcastRoleLabel: "Rol (majburiy emas)",
    broadcastRoleAll: "Hammasi",
    broadcastRoleDriver: "Faqat haydovchilar",
    broadcastRolePassenger: "Faqat yo‘lovchilar",
    broadcastMessageLabel: "Xabar matni",
    broadcastSubmit: "Barchaga yuborish",
    broadcastSubmitting: "Yuborilmoqda...",

    singleTitle: "Bitta foydalanuvchiga yuborish",
    singlePhoneLabel: "Telefon (9 raqam, +998 siz)",
    singleMessageLabel: "Xabar matni",
    singleSubmit: "Yuborish",
    singleSubmitting: "Yuborilmoqda...",
  },
};

