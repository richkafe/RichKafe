import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { dbOperations } from './database.js';

if (!config.botToken) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is missing in the configuration!');
}

if (!config.adminChannelId || config.adminChannelId === '-100XXXXXXXXXX') {
  console.warn('WARNING: ADMIN_CHANNEL_ID is not configured! Orders will NOT be sent to admin channel.');
}

export const bot = new Telegraf(config.botToken);

const translations = {
  ru: {
    welcome: "Добро пожаловать в кафе *Rich*! 🍔🍟\nУ нас самые сочные бургеры и быстрая доставка.\n\nНажмите кнопку ниже, чтобы открыть меню и сделать заказ:",
    open_menu: "🍔 Открыть меню",
    select_lang: "Пожалуйста, выберите язык:",
    order_pending: "🕐 Ваш заказ #%orderId% успешно принят и ожидает подтверждения.",
    order_preparing: "👨‍🍳 Ваш заказ #%orderId% начал готовиться!",
    order_delivering: "🚗 Ваш заказ #%orderId% передан курьеру и доставляется!",
    order_cancelled: "❌ Ваш заказ #%orderId% был отменён.",
    order_completed: "✅ Ваш заказ #%orderId% успешно доставлен!\nПриятного аппетита! 😋",
    status_updated: "Статус обновлен!"
  },
  uz: {
    welcome: "*Rich* kafesiga xush kelibsiz! 🍔🍟\nBizda eng mazali burgerlar va tezkor yetkazib berish xizmati.\n\nMenuni ochish va buyurtma berish uchun pastdagi tugmani bosing:",
    open_menu: "🍔 Menuni ochish",
    select_lang: "Iltimos, tilni tanlang:",
    order_pending: "🕐 Buyurtmangiz #%orderId% qabul qilindi va tasdiqlanishi kutilmoqda.",
    order_preparing: "👨‍🍳 Buyurtmangiz #%orderId% tayyorlanmoqda!",
    order_delivering: "🚗 Buyurtmangiz #%orderId% kuryerga topshirildi va yetkazib berilmoqda!",
    order_cancelled: "❌ Buyurtmangiz #%orderId% bekor qilindi.",
    order_completed: "✅ Buyurtmangiz #%orderId% muvaffaqiyatli yetkazildi!\nYoqimli ishtaha! 😋",
    status_updated: "Status yangilandi!"
  }
};

// Helper: Check if a user is an admin
function isAdmin(userId) {
  return config.adminIds.length > 0 && config.adminIds.includes(userId);
}

// Bot Command / Middleware check for Groups
function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup' || ctx.chat.type === 'channel');
}

// Middleware: Only process group messages from admins (for security)
// Allow callback queries in private chat for all users (language selection etc.)
// Only block callback queries from non-admins in groups/channels (order status buttons)
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    const userId = ctx.from?.id;
    // Allow all callback queries in private chat (e.g. language selection)
    if (!isGroup(ctx)) {
      return next();
    }
    // In groups/channels, only admins can use callback buttons (order status)
    if (userId && isAdmin(userId)) {
      return next();
    }
    try { await ctx.answerCbQuery(); } catch {}
    return;
  }

  // For regular messages in groups — only process admin commands
  if (isGroup(ctx)) {
    const userId = ctx.from?.id;
    if (!userId || !isAdmin(userId)) {
      return;
    }
  }

  return next();
});

// Start command
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const username = ctx.from.username || '';
  const firstName = ctx.from.first_name || '';

  // Insert or update user
  await dbOperations.upsertUser({
    telegramId,
    username,
    firstName,
    lastName: ctx.from.last_name || null
  });

  // All users (admin + normal) — language selection in private chat
  if (ctx.chat.type === 'private') {
    return ctx.reply(
      `${translations.ru.select_lang}\n${translations.uz.select_lang}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
          Markup.button.callback('🇺🇿 O\'zbekcha', 'lang_uz')
        ]
      ])
    );
  } else {
    return ctx.reply('Бот для заказов работает только в личных сообщениях. Пожалуйста, напишите мне в ЛС.');
  }
});

// Language selections
bot.action('lang_ru', async (ctx) => {
  try {
    await ctx.answerCbQuery().catch(() => {});
    const telegramId = ctx.from.id;
    console.log(`[Bot] Language callback: user=${telegramId} lang=ru`);
    try {
      await dbOperations.updateUserLanguage(telegramId, 'ru');
    } catch (dbErr) {
      console.error(`[Bot] DB error updating language for user ${telegramId}:`, dbErr.message);
    }
    await sendWelcomeMessage(ctx, telegramId, 'ru');
  } catch (err) {
    console.error('[Bot] Error in lang_ru callback:', err.message);
  }
});

bot.action('lang_uz', async (ctx) => {
  try {
    await ctx.answerCbQuery().catch(() => {});
    const telegramId = ctx.from.id;
    console.log(`[Bot] Language callback: user=${telegramId} lang=uz`);
    try {
      await dbOperations.updateUserLanguage(telegramId, 'uz');
    } catch (dbErr) {
      console.error(`[Bot] DB error updating language for user ${telegramId}:`, dbErr.message);
    }
    await sendWelcomeMessage(ctx, telegramId, 'uz');
  } catch (err) {
    console.error('[Bot] Error in lang_uz callback:', err.message);
  }
});

// Helper: send welcome message with web app link
async function sendWelcomeMessage(ctx, telegramId, lang) {
  const t = translations[lang] || translations.ru;

  // Normalize base URL — strip trailing slashes
  const baseUrl = (config.miniAppUrl || '').replace(/\/+$/, '');
  if (!baseUrl) {
    console.error('[Bot] MINI_APP_URL is not configured! Cannot send WebApp buttons.');
  }

  const menuUrl = baseUrl;
  const adminUrl = baseUrl ? `${baseUrl}/?admin=true` : '';

  // Admin button labels by language
  const adminBtnLabel = lang === 'uz' ? '⚙️ Admin Panel' : '⚙️ Админ-панель';
  const menuBtnLabel = lang === 'uz' ? '🍽 Menyu' : '🍽 Меню';

  // Set the global Telegram menu button (bottom bar) — always opens normal menu
  if (menuUrl) {
    try {
      await ctx.setChatMenuButton({
        type: 'web_app',
        text: t.open_menu,
        web_app: { url: menuUrl }
      });
    } catch (err) {
      console.error('[Bot] Error setting Chat Menu Button:', err.message);
    }
  }

  // Build reply keyboard — admin gets 2 buttons, normal user gets 1
  const userIsAdmin = isAdmin(telegramId);
  const keyboardRows = [[Markup.button.webApp(menuBtnLabel, menuUrl)]];
  if (userIsAdmin && adminUrl) {
    keyboardRows.push([Markup.button.webApp(adminBtnLabel, adminUrl)]);
  }

  try {
    await ctx.replyWithMarkdownV2(
      escapeMarkdown(t.welcome),
      Markup.keyboard(keyboardRows).resize()
    );
  } catch (mdErr) {
    console.error('[Bot] MarkdownV2 reply failed, falling back to plain text:', mdErr.message);
    try {
      await ctx.reply(
        t.welcome.replace(/\*/g, ''),
        Markup.keyboard(keyboardRows).resize()
      );
    } catch (plainErr) {
      console.error('[Bot] Plain text reply also failed:', plainErr.message);
    }
  }
}

// Function to escape MarkdownV2 formatting characters
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Admin text command handlers
bot.hears('📊 Статистика', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    const stats = await dbOperations.getAdminStats();
    ctx.replyWithMarkdown(
      `📊 *Статистика Rich Cafe:*\n\n` +
      `📦 *Всего заказов:* ${stats.totalOrders}\n` +
      `💰 *Выручка:* ${stats.totalRevenue.toLocaleString()} UZS (без отмененных)\n` +
      `🍔 *Продуктов в базе:* ${stats.totalProducts}\n` +
      `📂 *Категорий меню:* ${stats.totalCategories}\n` +
      `⏳ *Ожидают подтверждения:* ${stats.pendingOrders}`
    );
  } catch (e) {
    ctx.reply('Ошибка получения статистики: ' + e.message);
  }
});

bot.hears('⏳ Активные заказы', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    const orders = await dbOperations.getAllOrders();
    const active = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'delivering');
    if (active.length === 0) {
      return ctx.reply('Нет активных заказов на данный момент.');
    }

    let reply = `⏳ *Активные заказы (${active.length}):*\n\n`;
    active.forEach(order => {
      const statusEmoji = order.status === 'pending' ? '⏳' : order.status === 'preparing' ? '👨‍🍳' : '🚴';
      reply += `📦 *Заказ #${order.id}* [${statusEmoji} ${order.status}]\n` +
               `📞 Телефон: \`${order.phone}\`\n` +
               `💰 Сумма: ${Number(order.total_price).toLocaleString()} UZS\n` +
               `📍 Адрес: ${order.address_text || 'Указан на карте'}\n` +
               `-------------------------\n`;
    });
    ctx.replyWithMarkdown(reply);
  } catch (e) {
    ctx.reply('Ошибка получения заказов: ' + e.message);
  }
});

bot.hears('🛑 Открыть/Закрыть кафе', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    const settings = await dbOperations.getDbSettings();
    const newBlockVal = !settings.blockOffHours;
    await dbOperations.updateDbSetting('blockOffHours', newBlockVal ? 'true' : 'false');

    ctx.reply(
      newBlockVal
        ? '🛑 Кафе успешно ЗАКРЫТО для новых предзаказов. В Mini App теперь отображается предупреждение.'
        : '🟢 Кафе успешно ОТКРЫТО. Клиенты могут делать заказы в обычном режиме!'
    );
  } catch (e) {
    ctx.reply('Ошибка изменения режима работы: ' + e.message);
  }
});

// Format Admin Channel Order Message
function formatAdminOrderMessage(order) {
  const date = new Date(order.created_at).toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const itemsText = order.items
    ? order.items.map((item) => {
        const name = escapeMarkdown(String(item.name_ru || item.name_uz || ''));
        const sum = item.quantity * item.price_at_order;
        return `  • ${name}  x${item.quantity}  —  ${sum.toLocaleString()} UZS`;
      }).join('\n')
    : '  Нет данных о товарах';

  const statusIcons = {
    pending: '⏳ Ожидает подтверждения',
    preparing: '👨‍🍳 Готовится',
    delivering: '🚗 Доставляется',
    cancelled: '❌ Отменен',
    completed: '✅ Доставлен'
  };

  const statusText = statusIcons[order.status] || order.status;
  const paymentText = order.payment_method === 'cash' ? '💵 Наличные' : '💳 Карта/Перевод';

  const firstName = order.first_name || '';
  const lastName = order.last_name || '';
  const fullName = escapeMarkdown([firstName, lastName].filter(Boolean).join(' ') || 'Не указано');
  const username = order.username ? `@${escapeMarkdown(order.username)}` : 'нет';
  const userId = order.user_id || order.telegram_id || 'нет';

  const deliveryPrice = !isNaN(Number(order.delivery_price)) ? Number(order.delivery_price).toLocaleString() : '0';
  const totalPrice = !isNaN(Number(order.total_price)) ? Number(order.total_price).toLocaleString() : '0';

  const addressText = escapeMarkdown(order.address_text || 'Указан на карте');

  const lat = order.latitude && !isNaN(parseFloat(order.latitude)) ? order.latitude : '';
  const lon = order.longitude && !isNaN(parseFloat(order.longitude)) ? order.longitude : '';
  const mapsUrl = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : null;

  return `🆕 *НОВЫЙ ЗАКАЗ #${order.id}*\n` +
         `━━━━━━━━━━━━━━━━━━━━\n\n` +
         `📅 *Дата и время:*\n  ${date} (Ташкент)\n\n` +
         `🚦 *Статус:* ${statusText}\n\n` +
         `┌─ 👤 *ИНФОРМАЦИЯ О КЛИЕНТЕ* ─┐\n` +
         `│\n` +
         `│  *Имя:* ${fullName}\n` +
         `│  *Telegram ID:* \`${userId}\`\n` +
         `│  *Username:* ${username}\n` +
         `│  *Телефон:* \`${order.phone}\`\n` +
         `│\n` +
         `└────────────────────────┘\n\n` +
         `🛒 *СОСТАВ ЗАКАЗА:*\n${itemsText}\n\n` +
         `━━━━━━━━━━━━━━━━━━━━\n` +
         `🚚 *Доставка:* ${deliveryPrice} UZS\n` +
         `💰 *ИТОГО: ${totalPrice} UZS*\n` +
         `${paymentText}\n\n` +
         `📍 *Адрес:*\n  ${addressText}\n` +
         (mapsUrl ? `🗺 [📌 Открыть на карте](${mapsUrl})` : '');
}

// Get Inline Buttons based on current status
function getAdminOrderButtons(orderId, currentStatus) {
  const buttons = [];

  if (currentStatus === 'pending') {
    buttons.push([
      Markup.button.callback('✅ Принять', `order_prepare_${orderId}`),
      Markup.button.callback('❌ Отменить', `order_cancel_${orderId}`)
    ]);
  } else if (currentStatus === 'preparing') {
    buttons.push([
      Markup.button.callback('🚗 Отдать курьеру', `order_deliver_${orderId}`),
      Markup.button.callback('❌ Отменить', `order_cancel_${orderId}`)
    ]);
  } else if (currentStatus === 'delivering') {
    buttons.push([
      Markup.button.callback('✅ Доставлен', `order_complete_${orderId}`)
    ]);
  }

  return Markup.inlineKeyboard(buttons);
}

// Send notification to Client about status change
export async function notifyClientStatusChange(orderId, status) {
  try {
    const order = await dbOperations.getOrderById(orderId);
    if (!order) return;

    const user = await dbOperations.getUser(order.user_id);
    const lang = user ? user.language_code : 'ru';
    const t = translations[lang] || translations.ru;

    let messageKey = '';
    if (status === 'pending') messageKey = 'order_pending';
    else if (status === 'preparing') messageKey = 'order_preparing';
    else if (status === 'delivering') messageKey = 'order_delivering';
    else if (status === 'cancelled') messageKey = 'order_cancelled';
    else if (status === 'completed') messageKey = 'order_completed';

    if (messageKey && order.user_id) {
      const message = t[messageKey].replace('%orderId%', orderId);
      await bot.telegram.sendMessage(order.user_id, message);
    }
  } catch (error) {
    console.error(`Failed to send status update message to user for order #${orderId}:`, error.message);
  }
}

// Send new order details to Admin Channel/Group
export async function sendOrderToAdminChannel(orderId) {
  if (!config.adminChannelId || config.adminChannelId === '-100XXXXXXXXXX' || config.adminChannelId === '') {
    console.warn(`Order #${orderId} created but ADMIN_CHANNEL_ID is not configured. Skipping notification.`);
    return;
  }

  try {
    const order = await dbOperations.getOrderById(orderId);
    if (!order) throw new Error('Order not found in database');

    const user = await dbOperations.getUser(order.user_id);
    const orderWithUser = {
      ...order,
      username: user?.username,
      first_name: user?.first_name,
      last_name: user?.last_name
    };

    const messageText = formatAdminOrderMessage(orderWithUser);
    const buttons = getAdminOrderButtons(orderId, order.status);

    await bot.telegram.sendMessage(config.adminChannelId, messageText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...buttons
    });
    console.log(`✅ Order #${orderId} sent to admin channel ${config.adminChannelId}`);
  } catch (error) {
    console.error(`Failed to send order #${orderId} to admin channel:`, error.message);
    throw error; // Re-throw so server can log it
  }
}

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['completed'],
  completed: [],
  cancelled: []
};

// Admin callback query action handlers (works in groups/channels too)
const actionRegex = /^order_(prepare|deliver|complete|cancel)_(\d+)$/;

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const match = data.match(actionRegex);

  if (!match) {
    // Not our callback, ignore
    try { await ctx.answerCbQuery(); } catch {}
    return;
  }

  const action = match[1];
  const orderId = parseInt(match[2], 10);

  const statusMapping = {
    prepare: 'preparing',
    deliver: 'delivering',
    complete: 'completed',
    cancel: 'cancelled'
  };

  const newStatus = statusMapping[action];
  if (!newStatus) return;

  try {
    // Fetch current order to validate transition
    const currentOrder = await dbOperations.getOrderById(orderId);
    if (!currentOrder) {
      return ctx.answerCbQuery('Заказ не найден!');
    }

    const currentStatus = currentOrder.status;
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      return ctx.answerCbQuery(`Невозможно изменить статус с "${currentStatus}" на "${newStatus}"`);
    }

    const order = await dbOperations.updateOrderStatus(orderId, newStatus);
    if (!order) {
      return ctx.answerCbQuery('Заказ не найден!');
    }

    const user = await dbOperations.getUser(order.user_id);
    const lang = user ? user.language_code : 'ru';
    await ctx.answerCbQuery(translations[lang]?.status_updated || 'Статус обновлен!');

    // Notify client
    try { await notifyClientStatusChange(orderId, newStatus); } catch (e) {
      console.error('Failed to notify client:', e.message);
    }

    // Update the message in the channel with new status and buttons
    const orderWithUser = { ...order, username: user?.username, first_name: user?.first_name, last_name: user?.last_name };
    const updatedText = formatAdminOrderMessage(orderWithUser);
    const updatedButtons = getAdminOrderButtons(orderId, newStatus);

    try {
      await ctx.editMessageText(updatedText, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...updatedButtons
      });
    } catch (editErr) {
      // If message can't be edited (e.g., too old), just send a new reply
      console.error('Could not edit message:', editErr.message);
    }
  } catch (error) {
    console.error('Error handling admin callback query:', error);
    try { await ctx.answerCbQuery('Произошла ошибка при обновлении статуса.'); } catch {}
  }
});

// Launch bot setup
let _botStarted = false;

export function startBot() {
  if (_botStarted) {
    console.warn('startBot() called twice — ignoring duplicate call');
    return;
  }

  if (!config.botToken) {
    console.error('Cannot start bot: TELEGRAM_BOT_TOKEN is missing!');
    return;
  }

  _botStarted = true;

  bot.launch()
    .then(() => {
      console.log('✅ Telegraf Bot started successfully (long polling).');
    })
    .catch((err) => {
      console.error('Error starting Telegraf Bot:', err.message);
      _botStarted = false;
    });

  const stopBot = () => {
    if (!_botStarted) return;
    console.log('Stopping Telegraf Bot...');
    bot.stop('SIGTERM');
    _botStarted = false;
  };

  process.once('SIGINT', stopBot);
  process.once('SIGTERM', stopBot);
}
