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

// Get real initData from Telegram WebApp (cryptographically signed by Telegram)
const getInitData = () => {
  if (tg && tg.initData) {
    return tg.initData;
  }
  return null;
};

// Build headers that include Telegram identity verification for backend auth
const authHeaders = (extra = {}) => {
  const headers = { ...extra };
  const initData = getInitData();
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }
  return headers;
};

// Determine user info (used for UI display only — backend validates the real initData)
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

  // Fallback for development/testing in browser (only used when tg.initDataUnsafe unavailable)
  return {
    telegramId: queryTgId ? parseInt(queryTgId, 10) : 999999,
    username: 'test_user',
    firstName: 'Test Customer',
    languageCode: queryLang === 'uz' ? 'uz' : 'ru',
    isTelegram: !!tg
  };
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = {
  // Get backend settings (public — no auth needed)
  async getSettings() {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Get active products (public — no auth needed)
  async getProducts() {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Get user profile (protected — requires Telegram auth)
  async getUserProfile(telegramId) {
    const res = await fetch(`${API_BASE}/api/user/${telegramId}`, {
      headers: authHeaders()
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // Get synced cart items (protected — requires Telegram auth)
  async getCart(telegramId) {
    const res = await fetch(`${API_BASE}/api/cart/${telegramId}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  // Sync cart items to DB (protected — requires Telegram auth)
  async syncCart(telegramId, items) {
    const res = await fetch(`${API_BASE}/api/cart/${telegramId}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to sync cart');
    return res.json();
  },

  // Place a new order (protected — requires Telegram auth)
  async placeOrder(orderData) {
    const res = await fetch(`${API_BASE}/api/order`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to place order');
    }
    return res.json();
  },

  // Get user orders history (protected — requires Telegram auth)
  async getOrders(telegramId) {
    const res = await fetch(`${API_BASE}/api/orders/${telegramId}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch orders history');
    return res.json();
  }
};

// Resolve image URL: prepend API_BASE for uploaded images, leave others as-is
export function getImageUrl(path) {
  if (!path) return '/images/rich_burger.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    const base = API_BASE || '';
    return `${base.replace(/\/+$/, '')}${path}`;
  }
  return path;
}

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
