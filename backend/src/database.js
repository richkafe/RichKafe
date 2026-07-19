import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize LibSQL Client (supports remote Turso on Vercel)
const isRemoteDb = !!process.env.TURSO_DATABASE_URL;
const db = isRemoteDb
  ? createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : createClient({
      url: `file:${config.dbPath}`
    });

export async function initDatabase() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      last_latitude REAL,
      last_longitude REAL,
      last_address_text TEXT,
      language_code TEXT DEFAULT 'ru',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name_ru TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      emoji TEXT DEFAULT '🍽️',
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      description_ru TEXT,
      description_uz TEXT,
      price INTEGER NOT NULL,
      photo_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address_text TEXT,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'pending',
      total_price INTEGER NOT NULL,
      delivery_price INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_order INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(telegram_id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_reminders (
      telegram_id INTEGER PRIMARY KEY,
      last_cart_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reminder_sent_at TIMESTAMP,
      cycle_id TEXT NOT NULL,
      FOREIGN KEY(telegram_id) REFERENCES users(telegram_id)
    );
  `);

  // Seed categories if empty
  const catCount = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(catCount.rows[0].count) === 0) {
    const defaultCategories = [
      { slug: 'burgers', name_ru: 'Бургеры', name_uz: 'Burgerlar', emoji: '🍔', image_url: '/images/cat_burgers.png', sort_order: 1 },
      { slug: 'lavash', name_ru: 'Лаваш', name_uz: 'Lavash', emoji: '🌯', image_url: '/images/cat_lavash.png', sort_order: 2 },
      { slug: 'fries', name_ru: 'Картофель', name_uz: 'Kartoshka', emoji: '🍟', image_url: '/images/cat_fries.png', sort_order: 3 },
      { slug: 'drinks', name_ru: 'Напитки', name_uz: 'Ichimliklar', emoji: '🥤', image_url: '/images/cat_drinks.png', sort_order: 4 },
      { slug: 'desserts', name_ru: 'Десерты', name_uz: 'Desertlar', emoji: '🍰', image_url: '/images/cat_desserts.png', sort_order: 5 },
    ];
    const catStmts = defaultCategories.map(c => ({
      sql: `INSERT INTO categories (slug, name_ru, name_uz, emoji, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [c.slug, c.name_ru, c.name_uz, c.emoji, c.image_url, c.sort_order]
    }));
    await db.batch(catStmts, 'write');
    console.log('Categories seeded.');
  }

  // Seed settings if empty
  const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (Number(settingsCount.rows[0].count) === 0) {
    const defaultSettings = [
      { key: 'deliveryCost', value: String(config.deliveryCost) },
      { key: 'freeDeliveryThreshold', value: String(config.freeDeliveryThreshold) },
      { key: 'workHours', value: String(config.workHours) },
      { key: 'blockOffHours', value: String(config.blockOffHours) }
    ];
    const settingsStmts = defaultSettings.map(s => ({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?)`,
      args: [s.key, s.value]
    }));
    await db.batch(settingsStmts, 'write');
    console.log('Settings seeded.');
  }

  // Seed delivery area defaults if missing (insert-if-missing, never overwrite)
  const deliveryDefaults = [
    { key: 'restaurantLat', value: '41.2800865' },
    { key: 'restaurantLng', value: '61.1712648' },
    { key: 'deliveryRadiusKm', value: '30' },
    { key: 'deliveryAreaEnabled', value: 'true' }
  ];
  for (const d of deliveryDefaults) {
    const existing = await db.execute({ sql: 'SELECT 1 FROM settings WHERE key = ?', args: [d.key] });
    if (existing.rows.length === 0) {
      await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?)', args: [d.key, d.value] });
    }
  }

  // Seed products if database table is empty
  const countRes = await db.execute('SELECT COUNT(*) as count FROM products');
  const count = countRes.rows[0].count;
  if (Number(count) === 0) {
    try {
      const seedPath = path.join(__dirname, '../menu_seed.json');
      const rawData = fs.readFileSync(seedPath, 'utf8');
      const seedProducts = JSON.parse(rawData);

      const statements = seedProducts.map((p) => ({
        sql: `INSERT INTO products (category, name_ru, name_uz, description_ru, description_uz, price, photo_url, is_active, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.category,
          p.name_ru,
          p.name_uz,
          p.description_ru,
          p.description_uz,
          p.price,
          p.photo_url,
          p.is_active,
          p.sort_order
        ]
      }));

      await db.batch(statements, 'write');
      console.log('Database successfully seeded with menu items.');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }
}

// User Operations
export const dbOperations = {
  async getUser(telegramId) {
    const res = await db.execute({
      sql: 'SELECT * FROM users WHERE telegram_id = ?',
      args: [telegramId]
    });
    return res.rows[0] || null;
  },

  async upsertUser({ telegramId, username, firstName, lastName = null, phone = null, languageCode = 'ru' }) {
    await db.execute({
      sql: `
        INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          username = excluded.username,
          first_name = excluded.first_name,
          last_name = excluded.last_name
      `,
      args: [telegramId, username, firstName, lastName, languageCode]
    });
    return this.getUser(telegramId);
  },

  async updateUserLanguage(telegramId, languageCode) {
    await db.execute({
      sql: 'UPDATE users SET language_code = ? WHERE telegram_id = ?',
      args: [languageCode, telegramId]
    });
  },

  async updateUserLocation(telegramId, { latitude, longitude, addressText }) {
    await db.execute({
      sql: `
        UPDATE users
        SET last_latitude = ?, last_longitude = ?, last_address_text = ?
        WHERE telegram_id = ?
      `,
      args: [latitude, longitude, addressText, telegramId]
    });
  },

  async updateUserPhone(telegramId, phone) {
    await db.execute({
      sql: 'UPDATE users SET phone = ? WHERE telegram_id = ?',
      args: [phone, telegramId]
    });
  },

  // =====================
  // Category Operations
  // =====================
  async getCategories() {
    const res = await db.execute('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC');
    return res.rows;
  },

  async getAllCategories() {
    const res = await db.execute('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.rows;
  },

  async getCategoryBySlug(slug) {
    const res = await db.execute({ sql: 'SELECT * FROM categories WHERE slug = ?', args: [slug] });
    return res.rows[0] || null;
  },

  async createCategory({ slug, name_ru, name_uz, emoji, image_url, sort_order }) {
    await db.execute({
      sql: `INSERT INTO categories (slug, name_ru, name_uz, emoji, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [slug, name_ru, name_uz, emoji || '🍽️', image_url || null, sort_order || 0]
    });
    return this.getCategoryBySlug(slug);
  },

  async updateCategory(id, { slug, name_ru, name_uz, emoji, image_url, sort_order, is_active }) {
    await db.execute({
      sql: `UPDATE categories SET slug = ?, name_ru = ?, name_uz = ?, emoji = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?`,
      args: [slug, name_ru, name_uz, emoji, image_url, sort_order, is_active, id]
    });
    const res = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
    return res.rows[0] || null;
  },

  async deleteCategory(id) {
    await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
  },

  // =====================
  // Product Operations
  // =====================
  async getProducts() {
    const res = await db.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC');
    return res.rows;
  },

  async getAllProducts() {
    const res = await db.execute('SELECT * FROM products ORDER BY sort_order ASC');
    return res.rows;
  },

  async getProductById(id) {
    const res = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [id]
    });
    return res.rows[0] || null;
  },

  async createProduct({ category, name_ru, name_uz, description_ru, description_uz, price, photo_url, sort_order }) {
    const res = await db.execute({
      sql: `INSERT INTO products (category, name_ru, name_uz, description_ru, description_uz, price, photo_url, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [category, name_ru, name_uz, description_ru || '', description_uz || '', price, photo_url || null, sort_order || 0]
    });
    return this.getProductById(Number(res.lastInsertRowid));
  },

  async updateProduct(id, { category, name_ru, name_uz, description_ru, description_uz, price, photo_url, is_active, sort_order }) {
    await db.execute({
      sql: `UPDATE products SET category = ?, name_ru = ?, name_uz = ?, description_ru = ?, description_uz = ?, price = ?, photo_url = ?, is_active = ?, sort_order = ? WHERE id = ?`,
      args: [category, name_ru, name_uz, description_ru, description_uz, price, photo_url, is_active, sort_order, id]
    });
    return this.getProductById(id);
  },

  async deleteProduct(id) {
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  },

  // Cart Operations
  async getCartItems(telegramId) {
    const res = await db.execute({
      sql: `
        SELECT c.*, p.name_ru, p.name_uz, p.price, p.photo_url, p.category
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ? AND p.is_active = 1
      `,
      args: [telegramId]
    });
    return res.rows;
  },

  async setCartItems(telegramId, items) {
    const statements = [
      {
        sql: 'DELETE FROM cart_items WHERE user_id = ?',
        args: [telegramId]
      }
    ];

    for (const item of items) {
      statements.push({
        sql: 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        args: [telegramId, item.productId, item.quantity]
      });
    }

    await db.batch(statements, 'write');

    // Track cart activity for abandoned-cart reminders
    if (items.length > 0) {
      await this.upsertCartReminder(telegramId);
    } else {
      await this.resetCartReminder(telegramId);
    }

    return this.getCartItems(telegramId);
  },

  async clearCart(telegramId) {
    await db.execute({
      sql: 'DELETE FROM cart_items WHERE user_id = ?',
      args: [telegramId]
    });
    await this.resetCartReminder(telegramId);
  },

  // =====================
  // Cart Reminder Operations
  // =====================
  async upsertCartReminder(telegramId) {
    const cycleId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
      sql: `INSERT INTO cart_reminders (telegram_id, last_cart_activity_at, reminder_sent_at, cycle_id)
            VALUES (?, CURRENT_TIMESTAMP, NULL, ?)
            ON CONFLICT(telegram_id) DO UPDATE SET
              last_cart_activity_at = CURRENT_TIMESTAMP,
              reminder_sent_at = NULL,
              cycle_id = ?`,
      args: [telegramId, cycleId, cycleId]
    });
  },

  async resetCartReminder(telegramId) {
    await db.execute({
      sql: 'DELETE FROM cart_reminders WHERE telegram_id = ?',
      args: [telegramId]
    });
  },

  async markReminderSent(telegramId) {
    await db.execute({
      sql: 'UPDATE cart_reminders SET reminder_sent_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
      args: [telegramId]
    });
  },

  async getReminderCandidates(delayMinutes) {
    const res = await db.execute({
      sql: `SELECT cr.telegram_id, u.language_code
            FROM cart_reminders cr
            JOIN users u ON cr.telegram_id = u.telegram_id
            JOIN cart_items ci ON ci.user_id = cr.telegram_id
            WHERE cr.reminder_sent_at IS NULL
              AND cr.last_cart_activity_at <= datetime('now', '-' || ? || ' minutes')
            GROUP BY cr.telegram_id`,
      args: [delayMinutes]
    });
    return res.rows;
  },

  // Order Operations
  async createOrder({ telegramId, phone, latitude, longitude, addressText, paymentMethod, totalPrice, deliveryPrice, items }) {
    const transaction = await db.transaction('write');
    try {
      const orderRes = await transaction.execute({
        sql: `
          INSERT INTO orders (user_id, phone, latitude, longitude, address_text, payment_method, total_price, delivery_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [telegramId, phone, latitude, longitude, addressText, paymentMethod, totalPrice, deliveryPrice]
      });
      
      const orderId = Number(orderRes.lastInsertRowid);

      for (const item of items) {
        await transaction.execute({
          sql: `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
            VALUES (?, ?, ?, ?)
          `,
          args: [orderId, item.productId, item.quantity, item.price]
        });
      }

      // Update user's last phone and location info
      await transaction.execute({
        sql: `
          UPDATE users
          SET phone = ?, last_latitude = ?, last_longitude = ?, last_address_text = ?
          WHERE telegram_id = ?
        `,
        args: [phone, latitude, longitude, addressText, telegramId]
      });

      // Clear user's cart in the database
      await transaction.execute({
        sql: 'DELETE FROM cart_items WHERE user_id = ?',
        args: [telegramId]
      });

      // Clear abandoned-cart reminder state
      await transaction.execute({
        sql: 'DELETE FROM cart_reminders WHERE telegram_id = ?',
        args: [telegramId]
      });

      await transaction.commit();
      return orderId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    } finally {
      transaction.close();
    }
  },

  async getOrderById(orderId) {
    const orderRes = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId]
    });
    const order = orderRes.rows[0];
    if (!order) return null;

    const itemsRes = await db.execute({
      sql: `
        SELECT oi.*, p.name_ru, p.name_uz, p.category
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `,
      args: [orderId]
    });

    return { ...order, items: itemsRes.rows };
  },

  async getOrdersByUserId(telegramId) {
    const ordersRes = await db.execute({
      sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      args: [telegramId]
    });
    const orders = ordersRes.rows;

    const result = [];
    for (const order of orders) {
      const itemsRes = await db.execute({
        sql: `
          SELECT oi.*, p.name_ru, p.name_uz, p.category
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `,
        args: [order.id]
      });
      result.push({ ...order, items: itemsRes.rows });
    }
    return result;
  },

  async updateOrderStatus(orderId, status) {
    await db.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, orderId]
    });
    return this.getOrderById(orderId);
  },

  // Stats for admin dashboard
  async getAdminStats() {
    const totalOrders = await db.execute("SELECT COUNT(*) as count FROM orders");
    const totalRevenue = await db.execute("SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status != 'cancelled'");
    const totalProducts = await db.execute("SELECT COUNT(*) as count FROM products");
    const totalCategories = await db.execute("SELECT COUNT(*) as count FROM categories");
    const pendingOrders = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    return {
      totalOrders: Number(totalOrders.rows[0].count),
      totalRevenue: Number(totalRevenue.rows[0].sum),
      totalProducts: Number(totalProducts.rows[0].count),
      totalCategories: Number(totalCategories.rows[0].count),
      pendingOrders: Number(pendingOrders.rows[0].count),
    };
  },

  async getAllOrders() {
    const res = await db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    return res.rows;
  },

  async getAllOrdersWithItems() {
    const ordersRes = await db.execute('SELECT o.*, u.username, u.first_name FROM orders o LEFT JOIN users u ON o.user_id = u.telegram_id ORDER BY o.created_at DESC LIMIT 100');
    const orders = ordersRes.rows;

    const result = [];
    for (const order of orders) {
      const itemsRes = await db.execute({
        sql: `
          SELECT oi.*, p.name_ru, p.name_uz, p.category, p.photo_url
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `,
        args: [order.id]
      });
      result.push({ ...order, items: itemsRes.rows });
    }
    return result;
  },

  async getDbSettings() {
    try {
      const res = await db.execute('SELECT * FROM settings');
      const settings = {};
      res.rows.forEach(row => {
        if (row.key === 'deliveryCost' || row.key === 'freeDeliveryThreshold') {
          settings[row.key] = parseInt(row.value, 10);
        } else if (row.key === 'blockOffHours' || row.key === 'abandonedCartReminderEnabled' || row.key === 'deliveryAreaEnabled') {
          settings[row.key] = row.value === 'true';
        } else if (row.key === 'abandonedCartReminderMinutes') {
          settings[row.key] = Math.min(1440, Math.max(1, parseInt(row.value, 10) || 5));
        } else if (row.key === 'restaurantLat' || row.key === 'restaurantLng') {
          settings[row.key] = parseFloat(row.value);
        } else if (row.key === 'deliveryRadiusKm') {
          settings[row.key] = Math.min(100, Math.max(0.5, parseFloat(row.value) || 30));
        } else {
          settings[row.key] = row.value;
        }
      });
      const defaults = {
        deliveryCost: config.deliveryCost,
        freeDeliveryThreshold: config.freeDeliveryThreshold,
        workHours: config.workHours,
        blockOffHours: config.blockOffHours,
        abandonedCartReminderEnabled: true,
        abandonedCartReminderMinutes: 5,
        restaurantLat: 41.2800865,
        restaurantLng: 61.1712648,
        deliveryRadiusKm: 30,
        deliveryAreaEnabled: true
      };
      return { ...defaults, ...settings };
    } catch (e) {
      return {
        deliveryCost: config.deliveryCost,
        freeDeliveryThreshold: config.freeDeliveryThreshold,
        workHours: config.workHours,
        blockOffHours: config.blockOffHours,
        abandonedCartReminderEnabled: true,
        abandonedCartReminderMinutes: 5,
        restaurantLat: 41.2800865,
        restaurantLng: 61.1712648,
        deliveryRadiusKm: 30,
        deliveryAreaEnabled: true
      };
    }
  },

  async updateDbSetting(key, value) {
    await db.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      args: [key, String(value), String(value)]
    });
  }
};

// Haversine distance calculation — returns straight-line distance in km
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
