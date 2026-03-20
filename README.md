# 🎮 BroTracker — Full Stack

Real-time brother work schedule tracker.
**Tamil Nadu 🇮🇳 ↔ Ontario 🇨🇦**

---

## Project Structure

```
brotracker/
├── backend/          ← Node.js + Express API
│   ├── server.js
│   ├── package.json
│   └── schedule.json (auto-created on first run)
└── frontend/         ← React + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── hooks/useSchedule.js
        ├── utils/scheduleUtils.js
        ├── components/ProtectedRoute.jsx
        └── pages/
            ├── Home.jsx + Home.module.css
            ├── AdminLogin.jsx + AdminLogin.module.css
            └── AdminDashboard.jsx + AdminDashboard.module.css
```

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm start
# Runs on http://localhost:4000
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Production Build

```bash
# Build frontend
cd frontend
npm run build
# Output in frontend/dist/

# Serve dist/ with any static host, or from the backend:
# In server.js, add: app.use(express.static(path.join(__dirname, '../frontend/dist')))
```

---

## Admin Access

- URL: `http://localhost:5173/admin`
- Credentials are configured on the backend only via environment variables
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in `backend/.env`
- Use `backend/.env.example` as the template

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | /api/schedule | No | Get current schedule |
| POST   | /api/admin/login | No | Login → JWT token |
| PUT    | /api/admin/schedule | Yes | Replace full schedule |
| PATCH  | /api/admin/schedule/:id | Yes | Update one shift |
| POST   | /api/admin/schedule/reset | Yes | Reset to defaults |
| GET    | /api/health | No | Health check |

---

## Environment Variables (optional)

Create `backend/.env`:
```
PORT=4000
JWT_SECRET=your_custom_secret_here
```

---

## Features

- ✅ Real-time status (Free / Working / Ending Soon / Starting Soon)
- ✅ Live dual clock (IST ↔ Ontario)
- ✅ Countdown to next free window
- ✅ Shift progress bar
- ✅ Weekly schedule view
- ✅ Admin panel — add, edit, delete, pause shifts
- ✅ JWT authentication (8h session)
- ✅ Schedule persisted to JSON file (no DB needed)
- ✅ Falls back to cached schedule if backend offline
- ✅ Mobile + desktop responsive
- ✅ Gamified UI with animated status

---

## Deploying (Free Options)

**Backend** → [Railway](https://railway.app) or [Render](https://render.com)
**Frontend** → [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

When deploying frontend, set the API base URL in `vite.config.js`:
```js
// Replace proxy with your deployed backend URL
// In useSchedule.js and AuthContext.jsx, use full URL:
// const BASE = 'https://your-backend.railway.app'
```
