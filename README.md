# Supply System

Supply System is a full-stack web application for managing customers, products, orders, delivery, credit, redeem codes, and stock reorder notifications.

This repository contains:

- `backend/` — Laravel 12 API (Sanctum auth, role-based access)
- `frontend/` — Next.js 16 dashboard/client app

---

## Architecture

- **Backend:** PHP 8.4+, Laravel 12, Sanctum, MySQL/SQLite (PostgreSQL in Render deployment), queue/scheduler support
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, React Query, React Hook Form, Zod, shadcn/ui

---

## Core Features

- Customer account creation with linked login (`users` + `customers`)
- Role-based access (`admin`, `supervisor`, `customer`)
- Product catalog management
- Order lifecycle management:
  - `pending` → `processing` → `completed` / `cancelled`
- Delivery tracking with cumulative `deliveredQuantity`
- Customer credit debit/restore on order create/cancel
- Redeem code creation and redemption
- Reorder notices for low stock
- Fulfillment report endpoint (`/reports/fulfillment`)
- Frontend global search (`q` query param) across key list pages

---

## Repository Structure

```text
supply-system/
├── backend/
│   ├── app/
│   ├── database/
│   ├── docs/api.md
│   ├── tests/
│   └── README.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   └── README.md
└── render.yaml
```

---

## Quick Start (Local Development)

### 1) Start the Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure database in `.env` (SQLite is easiest for local), then run:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Backend API base URL:

```text
http://localhost:8000/api/v1
```

### 2) Start the Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Set `LARAVEL_API_URL` in `.env.local` (default):

```env
LARAVEL_API_URL=http://localhost:8000/api/v1
```

Run:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## Documentation

- Backend API reference: `backend/docs/api.md`
- Backend Docker guide: `backend/README_DOCKER.md`
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`

---

## Deployment

`render.yaml` contains Render configuration for backend + PostgreSQL deployment.
