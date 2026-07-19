import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root folder
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  adminChannelId: process.env.ADMIN_CHANNEL_ID || '',
  adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(id => id !== '').map(id => parseInt(id, 10)).filter(id => !isNaN(id)),
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  miniAppUrl: process.env.MINI_APP_URL || 'http://localhost:5173',
  adminPassword: process.env.ADMIN_PASSWORD,
  deliveryCost: parseInt(process.env.DELIVERY_COST || '15000', 10),
  freeDeliveryThreshold: parseInt(process.env.FREE_DELIVERY_THRESHOLD || '150000', 10),
  workHours: process.env.WORK_HOURS || '10:00-23:00',
  blockOffHours: process.env.BLOCK_OFF_HOURS === 'true',
  dbPath: path.join(__dirname, '../data/rich_cafe.db')
};

