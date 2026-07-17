const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/AdminPanel_backup.jsx', 'utf8');

// Insert the translations object right after API_BASE
const translations = `
const adminT = {
  ru: {
    imageLabel: "Фото (URL или файл)",
    upload: "Загрузить",
    categories: "Категории",
    add: "Добавить",
    loading: "Загрузка...",
    noCategories: "Нет категорий. Добавьте первую!",
    order: "порядок",
    hasImage: "есть фото",
    close: "Закрыть",
    open: "Открыть",
    edit: "Редактировать",
    delete: "Удалить",
    editCategory: "Редактировать категорию",
    newCategory: "Новая категория",
    slug: "Slug (латиница, без пробелов)",
    nameRu: "Название (RU)",
    nameUz: "Название (UZ)",
    emoji: "Эмодзи",
    sortOrder: "Порядковый номер",
    active: "Активен",
    cancel: "Отмена",
    saving: "Сохранение...",
    save: "Сохранить",
    products: "Товары",
    all: "Все",
    noProducts: "В этой категории нет товаров",
    newProduct: "Новый товар",
    editProduct: "Редактировать товар",
    category: "Категория",
    descRu: "Описание (RU)",
    descUz: "Описание (UZ)",
    priceUzs: "Цена (UZS)",
    productImage: "Фото товара (URL или файл)",
    orders: "Заказы",
    refresh: "Обновить",
    noOrders: "Нет заказов",
    cash: "Наличные",
    card: "Карта",
    viewOnMap: "Смотреть на карте",
    orderItems: "Состав заказа",
    deliveryFee: "Доставка",
    statusPending: "Ожидает",
    statusPreparing: "Готовится",
    statusDelivering: "В пути",
    statusCompleted: "Доставлен",
    statusCancelled: "Отменен",
    settings: "Настройки",
    mainSettings: "Основные настройки",
    deliveryCost: "Стоимость доставки (UZS)",
    freeDeliveryThreshold: "Бесплатная доставка от (UZS)",
    workHours: "Время работы (напр. 10:00-23:00)",
    cafeOpenStatus: "Статус работы кафе",
    cafeOpen: "Кафе открыто (принимает заказы)",
    cafeClosed: "Кафе закрыто (только предзаказ)",
    security: "Безопасность",
    newPassword: "Новый пароль",
    updatePassword: "Обновить пароль",
    adminPanelTitle: "Панель Администратора",
    logout: "Выйти",
    loginTitle: "Вход в админ панель",
    passwordLabel: "Пароль",
    enterPassword: "Введите пароль...",
    loginBtn: "Войти",
    stats: "Статистика",
    totalOrders: "Всего заказов",
    totalRevenue: "Выручка",
    totalProducts: "Всего товаров",
    pendingOrders: "Ожидают подтверждения",
    confirmDeleteCat: "Вы уверены, что хотите удалить категорию?",
    confirmDeleteProd: "Вы уверены, что хотите удалить товар?",
    errorReqCat: "Слуг и названия обязательны",
    errorReqProd: "Категория, названия и цена обязательны",
    errorPrice: "Цена должна быть числом"
  },
  uz: {
    imageLabel: "Rasm (URL yoki fayl)",
    upload: "Yuklash",
    categories: "Kategoriyalar",
    add: "Qo'shish",
    loading: "Yuklanmoqda...",
    noCategories: "Kategoriyalar yo'q. Birinchisini qo'shing!",
    order: "tartib",
    hasImage: "rasm bor",
    close: "Yopish",
    open: "Ochish",
    edit: "Tahrirlash",
    delete: "O'chirish",
    editCategory: "Kategoriyani tahrirlash",
    newCategory: "Yangi kategoriya",
    slug: "Slug (lotin harflari, bo'shliqsiz)",
    nameRu: "Nomi (RU)",
    nameUz: "Nomi (UZ)",
    emoji: "Emoji",
    sortOrder: "Tartib raqami",
    active: "Faol",
    cancel: "Bekor qilish",
    saving: "Saqlanmoqda...",
    save: "Saqlash",
    products: "Mahsulotlar",
    all: "Barchasi",
    noProducts: "Bu kategoriyada mahsulot yo'q",
    newProduct: "Yangi mahsulot",
    editProduct: "Mahsulotni tahrirlash",
    category: "Kategoriya",
    descRu: "Tavsif (RU)",
    descUz: "Tavsif (UZ)",
    priceUzs: "Narx (UZS)",
    productImage: "Mahsulot rasmi (fayl yoki URL)",
    orders: "Buyurtmalar",
    refresh: "Yangilash",
    noOrders: "Buyurtmalar yo'q",
    cash: "Naqd",
    card: "Karta",
    viewOnMap: "Xaritada ko'rish",
    orderItems: "Buyurtma tarkibi",
    deliveryFee: "Yetkazib berish",
    statusPending: "Kutilmoqda",
    statusPreparing: "Tayyorlanmoqda",
    statusDelivering: "Yo'lda",
    statusCompleted: "Yetkazildi",
    statusCancelled: "Bekor qilindi",
    settings: "Sozlamalar",
    mainSettings: "Asosiy sozlamalar",
    deliveryCost: "Yetkazib berish narxi (UZS)",
    freeDeliveryThreshold: "Bepul yetkazib berish (UZS)",
    workHours: "Ish vaqti (masalan, 10:00-23:00)",
    cafeOpenStatus: "Kafe ishlash holati",
    cafeOpen: "Kafe ochiq (buyurtmalar qabul qilinadi)",
    cafeClosed: "Kafe yopiq (faqat oldindan buyurtma)",
    security: "Xavfsizlik",
    newPassword: "Yangi parol",
    updatePassword: "Parolni yangilash",
    adminPanelTitle: "Admin Panel",
    logout: "Chiqish",
    loginTitle: "Admin panelga kirish",
    passwordLabel: "Parol",
    enterPassword: "Parolni kiriting...",
    loginBtn: "Kirish",
    stats: "Statistika",
    totalOrders: "Jami buyurtmalar",
    totalRevenue: "Tushum",
    totalProducts: "Jami mahsulotlar",
    pendingOrders: "Tasdiq kutayotgan",
    confirmDeleteCat: "kategoriyasini o'chirishni tasdiqlaysizmi?",
    confirmDeleteProd: "mahsulotini o'chirishni tasdiqlaysizmi?",
    errorReqCat: "Slug, RU va UZ nomlar majburiy",
    errorReqProd: "Kategoriya, RU/UZ nomlar va narx majburiy",
    errorPrice: "Narx to'g'ri son bo'lishi kerak"
  }
};
`;

content = content.replace("const API_BASE = '/api/admin';", "const API_BASE = '/api/admin';\n" + translations);

// Now, update component signatures to accept `lang`
content = content.replace("function ImageUploadField({ value, onChange, token, label = 'Rasm (URL yoki fayl)' }) {", "function ImageUploadField({ value, onChange, token, label, lang = 'ru' }) {");
// Ensure ImageUploadField usages pass lang
content = content.replace(/label="Kategoriya rasmi \(fayl yoki URL\)"/g, 'label={t.imageLabel} lang={lang}');
content = content.replace(/label="Mahsulot rasmi \(fayl yoki URL\)"/g, 'label={t.productImage} lang={lang}');

content = content.replace("function CategoryManager({ token }) {", "function CategoryManager({ token, lang, t }) {");
content = content.replace("function ProductManager({ token }) {", "function ProductManager({ token, lang, t }) {");
content = content.replace("function OrdersManager({ token }) {", "function OrdersManager({ token, lang, t }) {");
content = content.replace("function SettingsManager({ token }) {", "function SettingsManager({ token, lang, t }) {");
content = content.replace("export default function AdminPanel({ onBack }) {", "export default function AdminPanel({ onBack, lang = 'ru', toggleLanguage }) {\n  const t = adminT[lang] || adminT.ru;");

// Update render calls in AdminPanel main component
content = content.replace(/<CategoryManager token={token} \/>/g, "<CategoryManager token={token} lang={lang} t={t} />");
content = content.replace(/<ProductManager token={token} \/>/g, "<ProductManager token={token} lang={lang} t={t} />");
content = content.replace(/<OrdersManager token={token} \/>/g, "<OrdersManager token={token} lang={lang} t={t} />");
content = content.replace(/<SettingsManager token={token} \/>/g, "<SettingsManager token={token} lang={lang} t={t} />");

// Basic string replacements
// Note: Since doing all strings by exact string match is safer than regex, I'll do exact string replace.

const replacements = [
  // Categories
  ["Kategoriyalar yo'q. Birinchisini qo'shing!", "{t.noCategories}"],
  ["slug: {cat.slug} · tartib: {cat.sort_order}", "slug: {cat.slug} · {t.order}: {cat.sort_order}"],
  ["{cat.image_url && ' · 🖼️ rasm bor'}", "{cat.image_url && ` · 🖼️ ${t.hasImage}`}"],
  ["title={cat.is_active ? 'Yopish' : 'Ochish'}", "title={cat.is_active ? t.close : t.open}"],
  ["title=\"Tahrirlash\"", "title={t.edit}"],
  ["title=\"O'chirish\"", "title={t.delete}"],
  ["Slug, RU va UZ nomlar majburiy", "t.errorReqCat"],
  ["`\"${name}\" kategoriyasini o'chirishni tasdiqlaysizmi?`", "`\"${name}\" ${t.confirmDeleteCat}`"],
  ["'Kategoriyani tahrirlash' : 'Yangi kategoriya'", "t.editCategory : t.newCategory"],
  ["Kategoriyalar</h3", "{t.categories}</h3"],
  ["Qo'shish</button", "{t.add}</button"],
  ["Slug (lotin harflari, bo'shliqs iz)", "{t.slug}"],
  ["Nomi (RU)", "{t.nameRu}"],
  ["Nomi (UZ)", "{t.nameUz}"],
  ["Emoji", "{t.emoji}"],
  ["Tartib raqami", "{t.sortOrder}"],
  ["Faol</label", "{t.active}</label"],
  ["Bekor qilish</button", "{t.cancel}</button"],
  ["{saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}", "{saving ? t.saving : <><Save size={16} /> {t.save}</>}"],
  
  // Products
  ["Mahsulotlar</h3", "{t.products}</h3"],
  ["Barchasi</button", "{t.all}</button"],
  ["Bu kategoriyada mahsulot yo'q", "{t.noProducts}"],
  ["'Mahsulotni tahrirlash' : 'Yangi mahsulot'", "t.editProduct : t.newProduct"],
  ["Kategoriya</label", "{t.category}</label"],
  ["Tavsif (RU)", "{t.descRu}"],
  ["Tavsif (UZ)", "{t.descUz}"],
  ["Narx (UZS)", "{t.priceUzs}"],
  ["Kategoriya, RU/UZ nomlar va narx majburiy", "t.errorReqProd"],
  ["Narx to'g'ri son bo'lishi kerak", "t.errorPrice"],
  ["`\"${name}\" mahsulotini o'chirishni tasdiqlaysizmi?`", "`\"${name}\" ${t.confirmDeleteProd}`"],
  ["🔴 Yopiq", "🔴 {t.close}"],

  // Orders
  ["Buyurtmalar</h3", "{t.orders}</h3"],
  ["Yangilash</button", "{t.refresh}</button"],
  ["Buyurtmalar yo'q", "{t.noOrders}"],
  ["Naqd' : 'Karta", "t.cash : t.card"],
  ["Xaritada ko'rish", "{t.viewOnMap}"],
  ["Buyurtma tarkibi", "{t.orderItems}"],
  ["Yetkazib berish</span", "{t.deliveryFee}</span"],
  ["Barchasi ({orders.length})", "{t.all} ({orders.length})"],
  
  // Settings
  ["Sozlamalar</h3", "{t.settings}</h3"],
  ["Asosiy sozlamalar", "{t.mainSettings}"],
  ["Yetkazib berish narxi (UZS)", "{t.deliveryCost}"],
  ["Bepul yetkazib berish (UZS)", "{t.freeDeliveryThreshold}"],
  ["Ish vaqti", "{t.workHours}"],
  ["Kafe ishlash holati", "{t.cafeOpenStatus}"],
  ["Kafe ochiq (buyurtmalar qabul qilinadi)", "{t.cafeOpen}"],
  ["Kafe yopiq (faqat oldindan buyurtma)", "{t.cafeClosed}"],
  ["Xavfsizlik", "{t.security}"],
  ["Yangi parol", "{t.newPassword}"],
  ["Parolni yangilash", "{t.updatePassword}"],

  // Main Admin Panel
  ["Admin Panel</h1", "{t.adminPanelTitle}</h1"],
  ["Chiqish</button", "{t.logout}</button"],
  ["Admin panelga kirish", "{t.loginTitle}"],
  ["Parol</label", "{t.passwordLabel}</label"],
  ["Parolni kiriting...", "{t.enterPassword}"],
  ["Kirish</button", "{t.loginBtn}</button"],
  ["Yuklanmoqda...", "{t.loading}"],

  // Stats
  ["Jami buyurtmalar", "{t.totalOrders}"],
  ["Tushum", "{t.totalRevenue}"],
  ["Jami mahsulotlar", "{t.totalProducts}"],
  ["Tasdiq kutayotgan", "{t.pendingOrders}"]
];

for (const [search, replace] of replacements) {
  // Use regex to replace globally
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(regex, replace);
}

// Special case for STATUS_LABELS
content = content.replace(`
  const STATUS_LABELS = {
    pending: '⏳ Kutilmoqda',
    preparing: '👨‍🍳 Tayyorlanmoqda',
    delivering: '🚴 Yo\\'lda',
    completed: '✅ Yetkazildi',
    cancelled: '❌ Bekor qilindi'
  };`, `
  const STATUS_LABELS = {
    pending: '⏳ ' + t.statusPending,
    preparing: '👨‍🍳 ' + t.statusPreparing,
    delivering: '🚴 ' + t.statusDelivering,
    completed: '✅ ' + t.statusCompleted,
    cancelled: '❌ ' + t.statusCancelled
  };`);

// Write the modified content back
fs.writeFileSync('frontend/src/components/AdminPanel.jsx', content, 'utf8');
console.log("Replaced strings successfully.");
