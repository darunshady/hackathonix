# NanoBiz — Offline-First Invoice & Customer Management

A hackathon MVP for micro-entrepreneurs to manage invoices and customers, even without internet connectivity.

## Architecture Overview

```
┌──────────────────────┐       ┌──────────────────────┐
│     React Frontend   │       │   Express Backend     │
│  (Vite + Tailwind)   │◄─────►│  (Node.js + MongoDB)  │
│                      │  API  │                       │
│  IndexedDB (Dexie)   │       │  Mongoose Models      │
│  Service Worker (PWA)│       │  CORS enabled         │
└──────────────────────┘       └──────────────────────┘
```

### Offline-First Flow
1. **Offline** — Data is saved to IndexedDB. A sync queue tracks pending actions.
2. **Online** — The sync manager automatically pushes queued records to the backend via `POST /api/sync`.
3. **Idempotent** — Every record carries a client-generated UUID (`clientId`), so duplicate pushes are safely upserted.

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster

### 1. Clone & Navigate

```bash
cd hackathonix
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env          # then edit MONGO_URI with your connection string
npm install
npm run dev                    # starts on http://localhost:5000
```

### 3. Frontend Setup (separate terminal)

```bash
cd frontend
cp .env.example .env           # defaults to http://localhost:5000/api
npm install
npm run dev                    # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/nanobiz` |
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment | `development` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/customers` | List all customers |
| `POST` | `/api/customers` | Create / upsert a customer |
| `GET` | `/api/invoices` | List all invoices |
| `POST` | `/api/invoices` | Create / upsert an invoice |
| `POST` | `/api/sync` | Bulk sync customers & invoices |
| `POST` | `/api/voice-process` | Voice AI placeholder |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
hackathonix/
├── backend/
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Route handlers
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── services/              # Business logic (WhatsApp, etc.)
│   ├── server.js              # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/                # PWA icons
│   ├── src/
│   │   ├── components/        # Layout, Navbar
│   │   ├── db/                # Dexie.js IndexedDB setup
│   │   ├── hooks/             # useOnlineStatus
│   │   ├── pages/             # Dashboard, Customers, Invoices
│   │   ├── services/          # API client, SyncManager, WhatsApp
│   │   ├── App.jsx            # Root component + routing
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── vite.config.js         # Vite + Tailwind + PWA config
│   ├── .env.example
│   └── package.json
│
└── README.md                  # ← you are here
```

---

## Features

- **Dashboard** — Quick stats: customer count, invoice count, revenue, pending syncs
- **Customer Management** — Add customers with name, phone, address
- **Invoice Creation** — Line items with auto-calculated totals
- **Invoice List** — Toggle paid/pending, view items, sync status
- **Offline-First** — Full IndexedDB persistence + automatic sync
- **PWA** — Installable, works offline via Service Worker
- **Sync Indicator** — Live online/offline status in navbar
- **WhatsApp** — Placeholder button opens wa.me deep-link with invoice
- **Voice Input** — Placeholder button for future AI integration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Routing | React Router 7 |
| Offline DB | Dexie.js (IndexedDB) |
| HTTP | Axios |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose 8 |
| Dev Tools | nodemon, ESLint |

---

## License

MIT
