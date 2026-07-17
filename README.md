# Rich Cafe - Telegram Bot & Mini App Menu

This is a premium, modern food ordering system for the "Rich" fast-food cafe. It features a responsive Telegram Mini App menu with database-backed cart syncing, order histories, interactive geolocation pinpoints using maps, and order dispatch workflows that route requests to a private Telegram administrator channel.

---

## 🛠 Project Architecture

The project is structured as a modular Monorepo:

```
c:/rich kafe 2/
├── backend/                  # Node.js + Express API + Telegraf Bot
│   ├── data/                 # SQLite storage (LibSQL)
│   ├── src/                  # Server, database hooks, and bot handlers
│   └── .env                  # Secrets, channel mappings, and store settings
│
└── frontend/                 # React SPA + Vite + Vanilla CSS
    ├── public/images/        # Food item photos
    └── src/                  # Components (Cart, Menu, Map, Checkout)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended; fully compatible with v24 on Windows).

---

### Step 1: Backend Configuration

1. Open the `/backend` folder.
2. Rename or copy `.env` from the template:
   ```bash
   cp .env.template .env   # Or edit the existing .env file directly
   ```
3. Open `.env` and fill in the values:
   - `TELEGRAM_BOT_TOKEN`: The API token acquired from [@BotFather](https://t.me/BotFather).
   - `ADMIN_CHANNEL_ID`: The unique ID of your private channel where orders will be sent (starts with `-100`).
   - `MINI_APP_URL`: Set this to your local Vite server (`http://localhost:5173`) during development. When deploying, update this to your hosted domain.

---

### Step 2: Install Dependencies

Run `npm install` inside both directories:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### Step 3: Running in Development Mode

To run the application locally with hot-reloading:

1. **Start the Backend Server (Express + Bot):**
   ```bash
   cd backend
   npm run start
   ```
   *This starts the API on port `5000` and activates the Telegram Bot.*

2. **Start the Frontend Dev Server (Vite):**
   ```bash
   cd frontend
   npm run dev
   ```
   *This starts the Web App on `http://localhost:5173`. Any API call to `/api` or `/images` will automatically be proxied to the backend on port `5000`.*

3. **Launching in Telegram:**
   - In Telegram, open [@BotFather](https://t.me/BotFather) and configure your bot's WebApp link using your local development URL (using tools like `ngrok` or `localtunnel` to tunnel port `5173` to a secure HTTPS endpoint, which Telegram requires).
   - Alternatively, test it directly in the browser by visiting `http://localhost:5173?tgId=123456&lang=ru` where query params mock the Telegram environment.

---

### Step 4: Running in Production (Single Server Port)

To run the entire app (API, Bot, and Web App) on a single port (e.g. port `5000`):

1. **Build the React Frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   *This compiles the assets into `/frontend/dist`.*

2. **Configure production environment:**
   In `backend/.env`, set:
   ```env
   NODE_ENV=production
   PORT=5000
   ```

3. **Start the Backend Server:**
   ```bash
   cd backend
   npm run start
   ```
   *Express will automatically serve the static built React bundle. All routes except `/api/*` will render the React app.*

---

## 🎨 Features & UX Design

- **Warm Fast-Food Styling:** A sleek dark-mode background matching sunset-orange and rich golden accents, designed specifically to highlight high-resolution food images.
- **Cart Synchronization:** Add items from one device and see them on another; cart states are tied to the user's `telegram_id` in SQLite.
- **Interactive Delivery Picker:** Powered by Leaflet Maps and OpenStreetMap. Drag and drop the pin directly on the map, use "Locate Me" GPS tracking, or click "Use Past Address" to recall prior credentials. Uses reverse geocoding to auto-fill the address text.
- **Bilingual Interface:** Toggle between Russian (`RU`) and Uzbek (`UZ`) seamlessly in the header. The bot matches this selection when communicating with users.
- **Off-Hours Mode:** Checks local Tashkent time against cafe operating hours. If the shop is closed, warns the customer before placing a "Pre-order" or closes the app.
- **Admin Channel Operations:** Broadcasts orders to a private admin channel with coordinates links, user info, items summaries, and action buttons (`👨🍳 Начать готовить`, `🚗 Отдать курьеру`, `✅ Доставлен`). Clicking these buttons notifies the user via bot chat in real-time.
