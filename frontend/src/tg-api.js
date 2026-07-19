// Bridge for Telegram WebApp SDK and Backend API

// ALWAYS read window.Telegram?.WebApp dynamically — never cache a snapshot.
// The SDK may not be fully initialized when this module first executes,
// and Telegram may replace the object later when it injects initData.

const getWebApp = () => window.Telegram?.WebApp || null;

// Initialize Telegram WebApp if available (ready + expand are safe to call once)
const _initTg = getWebApp();
if (_initTg) {
  _initTg.ready();
  _initTg.expand();
}

// Extract parameters from URL or Telegram SDK
const searchParams = new URLSearchParams(window.location.search);
const queryTgId = searchParams.get('tgId');
const queryLang = searchParams.get('lang');

// Safe diagnostics — never log initData content or hash
export const logTelegramDiagnostics = () => {
  const webApp = getWebApp();
  const initData = webApp?.initData || '';
  const unsafeUser = webApp?.initDataUnsafe?.user;
  console.log(
    '[Telegram Debug]\n',
    '  WebApp exists:', !!webApp, '\n',
    '  initData present:', !!initData, '\n',
    '  initData length:', initData.length, '\n',
    '  initDataUnsafe.user exists:', !!unsafeUser, '\n',
    '  platform:', webApp?.platform || 'unknown', '\n',
    '  version:', webApp?.version || 'unknown', '\n',
    '  href:', window.location.origin + window.location.pathname
  );
  return { webAppExists: !!webApp, initDataPresent: !!initData, initDataLength: initData.length };
};

// Get real initData from Telegram WebApp (cryptographically signed by Telegram).
// Reads dynamically at call time — NOT from a cached reference.
const getInitData = () => {
  const webApp = getWebApp();
  const initData = webApp?.initData || '';
  return initData || null;
};

// Wait for initData to become available (some WebView contexts inject it asynchronously).
// Resolves with initData string or null after timeout.
export const waitForInitData = (timeoutMs = 2000) => {
  return new Promise((resolve) => {
    const immediate = getInitData();
    if (immediate) return resolve(immediate);

    const start = Date.now();
    const poll = () => {
      const data = getInitData();
      if (data) return resolve(data);
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(poll, 100);
    };
    poll();
  });
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
  const webApp = getWebApp();
  if (webApp && webApp.initDataUnsafe?.user) {
    const user = webApp.initDataUnsafe.user;
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
    isTelegram: !!webApp
  };
};

const API_BASE = import.meta.env.VITE_API_URL || '';

// Localized error for missing Telegram auth
const AUTH_MISSING_MSG = {
  ru: 'Данные авторизации Telegram не найдены. Пожалуйста, заново откройте приложение через Telegram-бота.',
  uz: "Telegram autentifikatsiya ma'lumoti topilmadi. Iltimos, ilovani Telegram bot ichidan qayta oching."
};

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
  async placeOrder(orderData, lang = 'ru') {
    // Wait briefly for initData — some WebView contexts inject it asynchronously
    let initData = getInitData();
    if (!initData) {
      initData = await waitForInitData(1500);
    }
    logTelegramDiagnostics();
    if (!initData) {
      throw new Error(AUTH_MISSING_MSG[lang] || AUTH_MISSING_MSG.ru);
    }
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

// Interface helpers for Telegram WebApp — always read dynamically
export const tgInterface = {
  showAlert(message) {
    const webApp = getWebApp();
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  },

  showConfirm(message, callback) {
    const webApp = getWebApp();
    if (webApp && typeof webApp.showConfirm === 'function') {
      webApp.showConfirm(message, (confirmed) => {
        callback(confirmed);
      });
    } else {
      const result = window.confirm(message);
      callback(result);
    }
  },

  close() {
    const webApp = getWebApp();
    if (webApp) {
      webApp.close();
    } else {
      console.log('Telegram WebApp closed.');
    }
  },

  // Set the main Telegram button
  setMainButton(text, onClick) {
    const webApp = getWebApp();
    if (!webApp) return;
    webApp.MainButton.text = text;
    webApp.MainButton.onClick(onClick);
    webApp.MainButton.show();
  },

  hideMainButton() {
    const webApp = getWebApp();
    if (!webApp) return;
    webApp.MainButton.hide();
  },

  // Device haptic feedback
  hapticImpact(style = 'medium') {
    const webApp = getWebApp();
    if (webApp && webApp.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(style);
    }
  }
};
