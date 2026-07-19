import crypto from 'crypto';
import { config } from './config.js';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_FUTURE_SECONDS = 300; // 5 minutes clock skew tolerance

/**
 * Validate Telegram Mini Apps initData using the official HMAC algorithm.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * @param {string} initDataRaw - The raw initData URL-encoded string from X-Telegram-Init-Data header
 * @returns {{ valid: boolean, telegramId: number|null, dataCheckString: string|null, error: string|null }}
 */
export function validateTelegramInitData(initDataRaw) {
  if (!initDataRaw || typeof initDataRaw !== 'string') {
    return { valid: false, telegramId: null, dataCheckString: null, error: 'Missing initData' };
  }

  const botToken = config.botToken;
  if (!botToken) {
    return { valid: false, telegramId: null, dataCheckString: null, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  // Parse the URL-encoded initData
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) {
    return { valid: false, telegramId: null, dataCheckString: null, error: 'Missing hash in initData' };
  }

  // Remove 'hash' from the data check string construction
  params.delete('hash');

  // Sort entries alphabetically by key and build data_check_string
  const entries = [];
  params.forEach((value, key) => {
    entries.push(`${key}=${value}`);
  });
  entries.sort();
  const dataCheckString = entries.join('\n');

  // Compute HMAC-SHA256
  // Step 1: HMAC(data_check_string, "WebAppData") using bot_token as secret
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Step 2: HMAC(data_check_string, secretKey)
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  let hashValid = false;
  try {
    hashValid = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    return { valid: false, telegramId: null, dataCheckString, error: 'Hash format mismatch' };
  }

  if (!hashValid) {
    return { valid: false, telegramId: null, dataCheckString, error: 'Invalid hash' };
  }

  // Validate auth_date
  const authDateStr = params.get('auth_date');
  if (!authDateStr) {
    return { valid: false, telegramId: null, dataCheckString, error: 'Missing auth_date' };
  }

  const authDate = parseInt(authDateStr, 10);
  if (isNaN(authDate)) {
    return { valid: false, telegramId: null, dataCheckString, error: 'Invalid auth_date' };
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - authDate;

  // Reject if too old (more than 24 hours)
  if (age > MAX_AUTH_AGE_SECONDS) {
    return { valid: false, telegramId: null, dataCheckString, error: 'auth_date expired (>24h)' };
  }

  // Reject unreasonably far in the future (more than 5 minutes ahead)
  if (age < -MAX_FUTURE_SECONDS) {
    return { valid: false, telegramId: null, dataCheckString, error: 'auth_date is in the future' };
  }

  // Extract the authenticated telegram user ID
  const userStr = params.get('user');
  if (!userStr) {
    return { valid: false, telegramId: null, dataCheckString, error: 'Missing user in initData' };
  }

  let userObj;
  try {
    userObj = JSON.parse(userStr);
  } catch {
    return { valid: false, telegramId: null, dataCheckString, error: 'Invalid user JSON in initData' };
  }

  const telegramId = userObj.id;
  if (!telegramId || typeof telegramId !== 'number') {
    return { valid: false, telegramId: null, dataCheckString, error: 'Invalid user id in initData' };
  }

  return { valid: true, telegramId, dataCheckString, error: null };
}

/**
 * Express middleware that validates Telegram Mini Apps initData.
 *
 * In production: requires valid X-Telegram-Init-Data header.
 * In development (NODE_ENV !== 'production'): falls back to X-Telegram-Dev-Id header
 * so the app can be tested outside Telegram without a valid signature.
 *
 * On success, attaches req.authTelegramId (the validated user ID).
 */
export function telegramAuth(req, res, next) {
  const initDataRaw = req.headers['x-telegram-init-data'];

  if (!initDataRaw) {
    // Development fallback: allow dev-only bypass when not in production
    if (config.nodeEnv !== 'production') {
      const devId = req.headers['x-telegram-dev-id'];
      if (devId) {
        const parsed = parseInt(devId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          req.authTelegramId = parsed;
          return next();
        }
      }
      // Allow even without dev-id in non-production for easier local testing
      // but require URL param or body to contain the telegramId
      return res.status(401).json({ error: 'Missing X-Telegram-Init-Data header (required in production)' });
    }
    return res.status(401).json({ error: 'Missing X-Telegram-Init-Data header' });
  }

  const result = validateTelegramInitData(initDataRaw);

  if (!result.valid) {
    return res.status(403).json({ error: `Invalid Telegram auth: ${result.error}` });
  }

  req.authTelegramId = result.telegramId;
  next();
}

/**
 * Middleware factory: ensures the authenticated Telegram user ID matches the
 * resource owner identified by URL param :id or request body telegramId.
 *
 * Usage: router.get('/api/user/:id', telegramAuth, requireOwnTelegramId, handler)
 * The :id param is expected to be a numeric telegram ID.
 */
export function requireOwnTelegramId(req, res, next) {
  const authId = req.authTelegramId;

  // Check URL param :id first, then body telegramId
  const paramId = req.params.id ? parseInt(req.params.id, 10) : null;
  const bodyId = req.body?.telegramId ? parseInt(req.body.telegramId, 10) : null;

  const targetId = paramId || bodyId;

  if (targetId && !isNaN(targetId) && targetId === authId) {
    return next();
  }

  // Identity mismatch - the authenticated user is trying to access another user's data
  return res.status(403).json({ error: 'Identity mismatch: you can only access your own data' });
}
