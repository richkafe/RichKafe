import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Clock, AlertTriangle, Sparkles, Loader } from 'lucide-react';
import { getUserInfo, api, tgInterface } from './tg-api';

import BottomNav from './components/BottomNav';
import MenuSection from './components/MenuSection';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import OrdersHistory from './components/OrdersHistory';
import AdminPanel from './components/AdminPanel';

const translations = {
  ru: {
    menu: "Меню",
    cart: "Корзина",
    checkout: "Оформление",
    orders: "Заказы",
    brandName: "Rich Cafe",
    greeting: "Привет",
    greetingSub: "Что appetite сегодня?",
    addToCart: "В корзину",
    emptyCartTitle: "Корзина пуста",
    emptyCartDesc: "Загляните в наше меню, чтобы добавить сочные бургеры и напитки!",
    goShop: "Перейти в меню",
    summaryTitle: "Детали заказа",
    itemsSum: "Сумма товаров",
    deliveryFee: "Доставка",
    deliveryFree: "Бесплатно",
    total: "Итого",
    placeOrder: "Оформить заказ",
    phoneLabel: "Номер телефона",
    phonePlaceholder: "Введите номер телефона",
    phoneHint: "Формат: +998XXXXXXXXX (9 цифр после +998)",
    phoneError: "Пожалуйста, введите корректный номер Узбекистана (+998XXXXXXXXX)",
    deliveryLabel: "Доставка",
    newLocLabel: "Указать новое местоположение",
    locHint: "Перетащите маркер на карте, чтобы указать точный адрес",
    addressPlaceholder: "Введите адрес вручную (улица, дом, кв)",
    paymentLabel: "Способ оплаты",
    cash: "Наличными курьеру",
    card: "Картой / Переводом",
    orderStatusTitle: "История заказов",
    noOrdersTitle: "Нет заказов",
    noOrdersDesc: "Вы еще не делали заказов в нашем кафе.",
    repeatOrder: "Повторить",
    status_pending: "Ожидает",
    status_preparing: "Готовится",
    status_delivering: "В пути",
    status_completed: "Доставлен",
    status_cancelled: "Отменен",
    confirmOrder: "Подтвердить заказ",
    placingOrder: "Оформление...",
    orderSuccess: "Заказ оформлен!",
    orderSuccessText: "Ваш заказ успешно принят. Бот пришлет вам уведомление в чат при изменении статуса.",
    workHoursTitle: "Кафе закрыто",
    workHoursDesc: "Наше кафе работает с %hours%. Сейчас мы закрыты, но вы можете оформить предзаказ. Желаете продолжить?",
    yes: "Продолжить",
    no: "Закрыть",
    preOrderAlert: "Внимание: вы оформляете предзаказ! Кафе закрыто.",
    locateMe: "Найти меня"
  },
  uz: {
    menu: "Menyu",
    cart: "Savat",
    checkout: "Rasmiylashtirish",
    orders: "Buyurtmalar",
    brandName: "Rich Cafe",
    greeting: "Salom",
    greetingSub: "Bugun nima istaysiz?",
    addToCart: "Savatga",
    emptyCartTitle: "Savat bo'sh",
    emptyCartDesc: "Mazali burgerlar va ichimliklarni savatga qo'shish uchun menyuga o'ting!",
    goShop: "Menyuga o'tish",
    summaryTitle: "Buyurtma tafsilotlari",
    itemsSum: "Mahsulotlar summasi",
    deliveryFee: "Yetkazib berish",
    deliveryFree: "Bepul",
    total: "Jami",
    placeOrder: "Buyurtma berish",
    phoneLabel: "Telefon raqami",
    phonePlaceholder: "Telefon raqamingizni kiriting",
    phoneHint: "Shakl: +998XXXXXXXXX (+998 dan keyin 9 ta raqam)",
    phoneError: "Iltimos, to'g'ri O'zbekiston telefon raqamini kiriting (+998XXXXXXXXX)",
    deliveryLabel: "Yetkazib berish",
    newLocLabel: "Yangi manzilni ko'rsatish",
    locHint: "Aniq manzilni ko'rsatish uchun xaritadagi belgini suring",
    addressPlaceholder: "Manzilni kiriting (ko'cha, uy, xonadon)",
    paymentLabel: "To'lov turi",
    cash: "Kurerga naqd pul",
    card: "Karta / O'tkazma",
    orderStatusTitle: "Buyurtmalar tarixi",
    noOrdersTitle: "Buyurtmalar yo'q",
    noOrdersDesc: "Siz hali kafemizda buyurtma bermagansiz.",
    repeatOrder: "Takrorlash",
    status_pending: "Kutilmoqda",
    status_preparing: "Tayyorlanmoqda",
    status_delivering: "Yo'lda",
    status_completed: "Yetkazildi",
    status_cancelled: "Bekor qilindi",
    confirmOrder: "Buyurtmani tasdiqlash",
    placingOrder: "Yuborilmoqda...",
    orderSuccess: "Buyurtma qabul qilindi!",
    orderSuccessText: "Sizning buyurtmangiz muvaffaqiyatli qabul qilindi. Bot status o'zgarganda sizga xabar beradi.",
    workHoursTitle: "Kafe yopiq",
    workHoursDesc: "Kafemiz %hours% gacha ishlaydi. Hozir biz yopiqmiz, lekin siz oldindan buyurtma berishingiz mumkin. Davom etishni xohlaysizmi?",
    yes: "Davom etish",
    no: "Yopish",
    preOrderAlert: "Diqqat: siz oldindan buyurtma bermoqdasiz! Kafe hozir yopiq.",
    locateMe: "Mening joyim"
  }
};

function getGreetingFirstName(user) {
  if (user.firstName) return user.firstName.split(' ')[0];
  return '';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('menu');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [settings, setSettings] = useState({
    deliveryCost: 15000,
    freeDeliveryThreshold: 150000,
    workHours: "10:00-23:00",
    blockOffHours: false
  });
  const [user, setUser] = useState(getUserInfo());
  const [lang, setLang] = useState(user.languageCode || 'ru');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorkHoursWarning, setShowWorkHoursWarning] = useState(false);
  const [isOffHours, setIsOffHours] = useState(false);
  const [showAdmin, setShowAdmin] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('admin') === 'true';
  });

  const checkWorkHours = useCallback((workHoursString) => {
    try {
      if (!workHoursString) return false;
      const [startStr, endStr] = workHoursString.split('-');
      const now = new Date();
      const options = { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false };
      const formatter = new Intl.DateTimeFormat([], options);
      const [nowHour, nowMin] = formatter.format(now).split(':').map(Number);
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);
      const nowMinutes = nowHour * 60 + nowMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes < startMinutes) {
        return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
      }
      return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    } catch (e) {
      console.error('Error checking work hours:', e);
      return true;
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const settingsData = await api.getSettings();
        setSettings(settingsData);

        const open = checkWorkHours(settingsData.workHours);
        if (!open) {
          setIsOffHours(true);
          setShowWorkHoursWarning(true);
        }

        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(),
          fetch('/api/categories').then(r => r.json()).catch(() => [])
        ]);
        setProducts(productsData);
        setCategories(categoriesData);

        const userProfile = await api.getUserProfile(user.telegramId);
        if (userProfile) {
          setUser(prev => ({
            ...prev,
            phone: userProfile.phone || prev.phone,
            lastLatitude: userProfile.last_latitude || prev.lastLatitude,
            lastLongitude: userProfile.last_longitude || prev.lastLongitude,
            lastAddressText: userProfile.last_address_text || prev.lastAddressText,
            languageCode: userProfile.language_code || prev.languageCode
          }));

          if (userProfile.language_code) {
            setLang(userProfile.language_code);
          }

          const cartItems = await api.getCart(user.telegramId);
          const cartDict = {};
          cartItems.forEach(item => {
            cartDict[item.product_id] = item.quantity;
          });
          setCart(cartDict);
        }
      } catch (error) {
        console.error('Failed to load startup data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.telegramId, checkWorkHours]);

  useEffect(() => {
    if (activeTab === 'orders') {
      async function loadOrders() {
        try {
          const ordersHistory = await api.getOrders(user.telegramId);
          setOrders(ordersHistory);
        } catch (error) {
          console.error('Failed to fetch orders:', error);
        }
      }
      loadOrders();
    }
  }, [activeTab, user.telegramId]);

  const syncCart = async (updatedCart) => {
    setCart(updatedCart);
    const items = Object.keys(updatedCart)
      .map(id => ({ productId: parseInt(id, 10), quantity: updatedCart[id] }))
      .filter(item => item.quantity > 0);
    try {
      await api.syncCart(user.telegramId, items);
    } catch (e) {
      console.error('Failed to sync cart to database:', e);
    }
  };

  const handleAddToCart = (productId) => {
    const updated = { ...cart, [productId]: (cart[productId] || 0) + 1 };
    syncCart(updated);
  };

  const handleRemoveFromCart = (productId) => {
    if (!cart[productId]) return;
    const updated = { ...cart };
    if (updated[productId] <= 1) {
      delete updated[productId];
    } else {
      updated[productId] -= 1;
    }
    syncCart(updated);
  };

  const handleRemoveEntirely = (productId) => {
    const updated = { ...cart };
    delete updated[productId];
    syncCart(updated);
  };

  const handleRepeatOrder = (items) => {
    const updatedCart = {};
    items.forEach(item => {
      updatedCart[item.productId] = item.quantity;
    });
    syncCart(updatedCart);
    setActiveTab('cart');
  };

  const handleOrderSuccess = () => {
    setCart({});
    api.getUserProfile(user.telegramId).then(profile => {
      if (profile) {
        setUser(prev => ({
          ...prev,
          phone: profile.phone || prev.phone,
          lastLatitude: profile.last_latitude || prev.lastLatitude,
          lastLongitude: profile.last_longitude || prev.lastLongitude,
          lastAddressText: profile.last_address_text || prev.lastAddressText
        }));
      }
    });
  };

  const toggleLanguage = () => {
    const newLang = lang === 'ru' ? 'uz' : 'ru';
    tgInterface.hapticImpact('light');
    setLang(newLang);
  };

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const firstName = getGreetingFirstName(user);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader size={48} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  if (showAdmin) {
    return (
      <div className="app-container">
        <AdminPanel onBack={() => setShowAdmin(false)} lang={lang} toggleLanguage={toggleLanguage} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <Sparkles className="brand-icon" />
          <h1 className="brand-text">{translations[lang].brandName}</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="lang-switch" onClick={toggleLanguage} title="Switch language">
            <Globe size={14} color="var(--text-secondary)" style={{ marginRight: '2px' }} />
            <span className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}>RU</span>
            <span className={`lang-btn ${lang === 'uz' ? 'active' : ''}`}>UZ</span>
          </button>
        </div>
      </header>

      <main className="content-area">
        {isOffHours && (
          <div className="delivery-hint" style={{ color: 'var(--accent-red)', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{translations[lang].preOrderAlert}</span>
          </div>
        )}

        {activeTab === 'menu' && (
          <>
            <div className="greeting-hero">
              <h2>{translations[lang].greeting}{firstName ? `, ${firstName}` : ''}!</h2>
              <p>{translations[lang].greetingSub}</p>
            </div>
            <MenuSection
              products={products}
              categories={categories}
              cart={cart}
              onAdd={handleAddToCart}
              onRemove={handleRemoveFromCart}
              setActiveTab={setActiveTab}
              lang={lang}
              t={translations}
              settings={settings}
            />
          </>
        )}

        {activeTab === 'cart' && (
          <CartView
            products={products}
            cart={cart}
            onAdd={handleAddToCart}
            onRemove={handleRemoveFromCart}
            onRemoveEntirely={handleRemoveEntirely}
            setActiveTab={setActiveTab}
            lang={lang}
            t={translations}
            settings={settings}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutView
            user={user}
            cart={cart}
            products={products}
            settings={settings}
            setActiveTab={setActiveTab}
            lang={lang}
            t={translations}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersHistory
            orders={orders}
            onRepeatOrder={handleRepeatOrder}
            setActiveTab={setActiveTab}
            lang={lang}
            t={translations}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        lang={lang}
        t={translations}
      />

      {showWorkHoursWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Clock className="modal-icon" />
            <h3 className="modal-title">{translations[lang].workHoursTitle}</h3>
            <p className="modal-desc">
              {translations[lang].workHoursDesc.replace('%hours%', settings.workHours)}
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                className="btn-modal-close"
                onClick={() => {
                  tgInterface.hapticImpact('light');
                  setShowWorkHoursWarning(false);
                }}
              >
                {translations[lang].yes}
              </button>
              <button
                className="btn-modal-close"
                style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                onClick={() => tgInterface.close()}
              >
                {translations[lang].no}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
