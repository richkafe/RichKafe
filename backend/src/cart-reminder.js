import { Markup } from 'telegraf';
import { dbOperations } from './database.js';
import { config } from './config.js';

const reminderTexts = {
  ru: {
    message: '🛒 Ваши товары всё ещё ждут вас 😋\n\nНе забудьте завершить заказ. Ваши любимые блюда всё ещё в корзине!',
    button: '🛍 Открыть корзину'
  },
  uz: {
    message: '🛒 Savatdagi mahsulotlaringiz sizni kutmoqda 😋\n\nBuyurtmangizni yakunlashni unutmang. Mazali taomlaringiz hali ham savatda!',
    button: '🛍 Savatni ochish'
  }
};

let _schedulerRunning = false;
let _processing = false;
let _intervalId = null;

export function startCartReminderScheduler(bot) {
  if (_schedulerRunning) {
    console.warn('[CartReminder] Scheduler already running — ignoring duplicate start');
    return;
  }

  if (!bot) {
    console.error('[CartReminder] Bot instance required');
    return;
  }

  _schedulerRunning = true;
  console.log('[CartReminder] Scheduler started (every 60s)');

  _intervalId = setInterval(async () => {
    try {
      await processReminderCandidates(bot);
    } catch (err) {
      console.error('[CartReminder] Scheduler tick error:', err.message);
    }
  }, 60_000);
}

export function stopCartReminderScheduler() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _schedulerRunning = false;
  console.log('[CartReminder] Scheduler stopped');
}

async function processReminderCandidates(bot) {
  if (_processing) {
    console.log('[CartReminder] Previous tick still running, skipping');
    return;
  }
  _processing = true;

  try {
    // Check if reminders are enabled
    let settings;
    try {
      settings = await dbOperations.getDbSettings();
    } catch {
      return;
    }

    if (!settings.abandonedCartReminderEnabled) return;

    const delayMinutes = settings.abandonedCartReminderMinutes || 5;

    // Find candidates: non-empty cart, activity older than delay, no reminder sent this cycle
    let candidates;
    try {
      candidates = await dbOperations.getReminderCandidates(delayMinutes);
    } catch {
      return;
    }

    if (!candidates || candidates.length === 0) return;

    const baseUrl = (config.miniAppUrl || '').replace(/\/+$/, '');
    if (!baseUrl) return;

    for (const candidate of candidates) {
      const { telegram_id: telegramId, language_code: lang } = candidate;
      const t = reminderTexts[lang] || reminderTexts.ru;
      const cartUrl = `${baseUrl}/?view=cart`;

      try {
        await bot.telegram.sendMessage(telegramId, t.message, {
          ...Markup.inlineKeyboard([
            [Markup.button.webApp(t.button, cartUrl)]
          ])
        });

        try {
          await dbOperations.markReminderSent(telegramId);
        } catch (markErr) {
          console.error(`[CartReminder] Telegram sent but failed to mark sent for ${telegramId}:`, markErr.message);
        }

        console.log(`[CartReminder] Sent reminder to user ${telegramId}`);
      } catch (err) {
        const errCode = err.response?.error_code || err.code;

        // Permanent errors — don't retry
        if (errCode === 403 || errCode === 400) {
          console.warn(`[CartReminder] User ${telegramId} unreachable (code=${errCode}). Marking sent to stop retries.`);
          await dbOperations.markReminderSent(telegramId).catch(() => {});
          continue;
        }

        // Temporary errors — leave unsent, will retry next tick (up to natural cycle reset)
        console.error(`[CartReminder] Failed to send reminder to ${telegramId}:`, err.message);
      }
    }
  } finally {
    _processing = false;
  }
}
