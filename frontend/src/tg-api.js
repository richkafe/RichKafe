// Bridge for Telegram WebApp SDK and Backend API

const getWebApp = () => {
  return window.Telegram?.WebApp || null;
};

// Initialize Telegram WebApp if available
const tg = getWebApp();
if (tg) {
  tg.ready();
  tg.expand();
}

// Extract parameters from URL or Telegram SDK
const searchParams = new URLSearchParams(window.location.search);
const queryTgId = searchParams.get('tgId');
const queryLang = searchParams.get('lang');

// Determine user info
export const getUserInfo = () => {
  if (tg && tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    return {
      telegramId: user.id,
      username: user.username || '',
      firstName: user.first_name || '',
      languageCode: user.language_code === 'uz' ? 'uz' : 'ru',
      isTelegram: true
    };
  }

  // Fallback for development/testing in browser
  return {
    telegramId: queryTgId ? parseInt(queryTgId, 10) : 999999,
    username: 'test_user',
    firstName: 'Test Customer',
    languageCode: queryLang === 'uz' ? 'uz' : 'ru',
    isTelegram: !!tg
  };
};

const API_BASE = window.location.hostname === 'localhost'
  ? '' // proxy in dev
  : 'https://rich-kafe-p47f8609j-amrxonnbaxtiyorov-6047s-projects.vercel.app';

export const api = {
  // Get backend settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Get active products
  async getProducts() {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Get user profile
  async getUserProfile(telegramId) {
    const res = await fetch(`${API_BASE}/api/user/${telegramId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // Get synced cart items
  async getCart(telegramId) {
    const res = await fetch(`${API_BASE}/api/cart/${telegramId}`);
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  // Sync cart items to DB
  async syncCart(telegramId, items) {
    const res = await fetch(`${API_BASE}/api/cart/${telegramId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }) // items: [{ productId, quantity }]
    });
    if (!res.ok) throw new Error('Failed to sync cart');
    return res.json();
  },

  // Place a new order
  async placeOrder(orderData) {
    const res = await fetch(`${API_BASE}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to place order');
    }
    return res.json();
  },

  // Get user orders history
  async getOrders(telegramId) {
    const res = await fetch(`${API_BASE}/api/orders/${telegramId}`);
    if (!res.ok) throw new Error('Failed to fetch orders history');
    return res.json();
  }
};

// Interface helpers for Telegram WebApp
export const tgInterface = {
  showAlert(message) {
    if (tg) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  },

  showConfirm(message, callback) {
    if (tg && typeof tg.showConfirm === 'function') {
      tg.showConfirm(message, (confirmed) => {
        callback(confirmed);
      });
    } else {
      const result = window.confirm(message);
      callback(result);
    }
  },

  close() {
    if (tg) {
      tg.close();
    } else {
      console.log('Telegram WebApp closed.');
    }
  },

  // Set the main Telegram button
  setMainButton(text, onClick) {
    if (!tg) return;
    tg.MainButton.text = text;
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  },

  hideMainButton() {
    if (!tg) return;
    tg.MainButton.hide();
  },

  // Device haptic feedback
  hapticImpact(style = 'medium') {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  }
};
