# Supply System Frontend

Frontend application for the Supply System project, built with Next.js App Router.

It provides role-based dashboards and workflows for:

- **Admin:** customer management, reorder notices, reporting, full system control
- **Supervisor:** product and fulfillment operations, redeem code generation, reports
- **Customer:** registration/login, product browsing, order placement, code redemption

---

## Tech Stack

- Next.js 16
- React 19 + TypeScript
- TanStack React Query
- React Hook Form + Zod
- shadcn/ui + Tailwind CSS
- `nuqs` for URL query-state synchronization (for list search filters)

---

## Key Features

- Authentication via backend Sanctum token (stored through frontend auth routes)
- Role-aware routing and dashboards
- Customer profile and credit visibility
- Product browsing and management flows
- Order creation, delivery tracking, and payment status UI
- Redeem code generation/redeeming flows
- Reorder notices and fulfillment reporting views
- Global topbar search that maps to list-page `q` filters

---

## Project Structure

```text
frontend/
├── app/                    # Next.js routes (App Router)
│   ├── api/                # Route handlers (auth + backend proxy)
│   ├── customers/
│   ├── products/
│   ├── orders/
│   ├── order-items/
│   ├── redeem-codes/
│   └── reorder-notices/
├── components/             # UI and layout components
├── features/               # Domain API wrappers and schemas
├── hooks/                  # Reusable hooks
├── lib/                    # Auth, API, utilities, generated models
└── types/                  # Shared app types
```

---

## Environment

Create `.env.local` (or copy from `.env.example`):

```env
LARAVEL_API_URL=http://localhost:8000/api/v1
```

This URL must point to the running backend API.

---

## Getting Started

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Available Scripts

- `npm run dev` — run development server
- `npm run build` — create production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run generate:api` — regenerate typed API client/models from OpenAPI config

---

## Backend Integration Notes

- Auth routes:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/me`
  - `/api/auth/logout`
- Generic backend proxy route:
  - `/api/proxy/[...path]`
- The proxy injects the current session token into `Authorization: Bearer <token>` for protected backend calls.

---

## Role Navigation Defaults

Current default home pages by role:

- `admin` → `/customers`
- `supervisor` → `/products`
- `customer` → `/`

Defined in: `lib/auth/roles.ts`

