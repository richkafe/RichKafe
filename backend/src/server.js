import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { dbOperations, initDatabase } from './database.js';
import { startBot, sendOrderToAdminChannel, notifyClientStatusChange } from './bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL || 'https://frontend-production-48e4.up.railway.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // fallback to allow — safe without cookies
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ensure uploads directory exists (Railway Volume or local fallback)
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../frontend/public/images/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Serve static files
const frontendPublicPath = path.join(__dirname, '../../frontend/public');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

app.use('/images', express.static(path.join(frontendPublicPath, 'images')));
app.use('/uploads', express.static(uploadsDir));

// Simple admin auth middleware (password-based)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rich_admin_2024';
function adminAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'];
  if (!authHeader || authHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ===========================
// PUBLIC API ROUTES
// ===========================

// API: Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbOperations.getDbSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get active categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbOperations.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get products (with optional category filter)
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbOperations.getProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get user profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const telegramId = parseInt(req.params.id, 10);
    if (isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }
    let user = await dbOperations.getUser(telegramId);
    if (!user) {
      user = await dbOperations.upsertUser({
        telegramId,
        username: 'web_user',
        firstName: 'Web Client',
        lastName: null
      });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get cart items
app.get('/api/cart/:id', async (req, res) => {
  try {
    const telegramId = parseInt(req.params.id, 10);
    if (isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }
    const cartItems = await dbOperations.getCartItems(telegramId);
    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Sync/Save cart items
app.post('/api/cart/:id', async (req, res) => {
  try {
    const telegramId = parseInt(req.params.id, 10);
    const { items } = req.body;

    if (isNaN(telegramId) || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Auto-upsert user to prevent foreign key errors
    const user = await dbOperations.getUser(telegramId);
    if (!user) {
      await dbOperations.upsertUser({
        telegramId,
        username: 'web_user',
        firstName: 'Web Client',
        lastName: null
      });
    }

    const updatedCart = await dbOperations.setCartItems(telegramId, items);
    res.json(updatedCart);
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Create new order
app.post('/api/order', async (req, res) => {
  try {
    const {
      telegramId,
      phone,
      latitude,
      longitude,
      addressText,
      paymentMethod,
      totalPrice,
      deliveryPrice,
      items
    } = req.body;

    if (!telegramId || !phone || !latitude || !longitude || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format. Must be +998XXXXXXXXX' });
    }

    const tId = parseInt(telegramId, 10);

    // Auto-upsert user to prevent foreign key errors
    const user = await dbOperations.getUser(tId);
    if (!user) {
      await dbOperations.upsertUser({
        telegramId: tId,
        username: 'web_user',
        firstName: 'Web Client',
        lastName: null
      });
    }

    const orderId = await dbOperations.createOrder({
      telegramId: tId,
      phone,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      addressText,
      paymentMethod,
      totalPrice: parseInt(totalPrice, 10),
      deliveryPrice: parseInt(deliveryPrice, 10),
      items
    });

    // Send to admin channel (non-blocking - don't fail order if bot fails)
    try {
      await sendOrderToAdminChannel(orderId);
    } catch (botErr) {
      console.error('Bot notification failed (order still created):', botErr.message);
    }

    // Notify client
    try {
      await notifyClientStatusChange(orderId, 'pending');
    } catch (botErr) {
      console.error('Client notification failed:', botErr.message);
    }

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// API: Get user orders history
app.get('/api/orders/:id', async (req, res) => {
  try {
    const telegramId = parseInt(req.params.id, 10);
    if (isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }
    const orders = await dbOperations.getOrdersByUserId(telegramId);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================
// ADMIN API ROUTES (Protected)
// ===========================

// Admin: Login (verify password)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Admin: Upload image
app.post('/api/admin/upload', adminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Admin: Get dashboard stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await dbOperations.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all categories
app.get('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const categories = await dbOperations.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Create category
app.post('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { slug, name_ru, name_uz, emoji, image_url, sort_order } = req.body;
    if (!slug || !name_ru || !name_uz) {
      return res.status(400).json({ error: 'slug, name_ru, name_uz are required' });
    }
    const cat = await dbOperations.createCategory({ slug, name_ru, name_uz, emoji, image_url, sort_order });
    res.status(201).json(cat);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Admin: Update category
app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { slug, name_ru, name_uz, emoji, image_url, sort_order, is_active } = req.body;
    const cat = await dbOperations.updateCategory(id, {
      slug,
      name_ru,
      name_uz,
      emoji: emoji || '🍽️',
      image_url: image_url || null,
      sort_order: sort_order || 0,
      is_active: is_active ?? 1
    });
    res.json(cat);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete category
app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await dbOperations.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all products (including inactive)
app.get('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const products = await dbOperations.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Create product
app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const { category, name_ru, name_uz, description_ru, description_uz, price, photo_url, sort_order } = req.body;
    if (!category || !name_ru || !name_uz || !price) {
      return res.status(400).json({ error: 'category, name_ru, name_uz, price are required' });
    }
    const product = await dbOperations.createProduct({
      category, name_ru, name_uz, description_ru, description_uz,
      price: parseInt(price, 10), photo_url, sort_order
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Admin: Update product
app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { category, name_ru, name_uz, description_ru, description_uz, price, photo_url, is_active, sort_order } = req.body;
    const product = await dbOperations.updateProduct(id, {
      category, name_ru, name_uz,
      description_ru: description_ru || '',
      description_uz: description_uz || '',
      price: parseInt(price, 10),
      photo_url: photo_url || null,
      is_active: is_active ?? 1,
      sort_order: sort_order || 0
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete product
app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await dbOperations.deleteProduct(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all orders (with items)
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const orders = await dbOperations.getAllOrdersWithItems();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update order status
app.put('/api/admin/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await dbOperations.updateOrderStatus(id, status);
    // Notify client about status change
    try { await notifyClientStatusChange(id, status); } catch {}
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get settings
app.get('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const settings = await dbOperations.getDbSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update setting
app.put('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key is required' });
    await dbOperations.updateDbSetting(key, value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

export { app };

// Start Server after Database Initialization (skip on Vercel — handled by api/index.js)
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  const PORT = config.port;
  initDatabase()
    .then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Express API Server is running on http://localhost:${PORT}`);
        console.log(`✅ Also accessible on your local network via http://[YOUR_IP]:${PORT}`);
        startBot();
      });
    })
    .catch((err) => {
      console.error('Failed to initialize SQLite database:', err);
      process.exit(1);
    });
}
