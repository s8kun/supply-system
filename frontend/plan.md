# Supply Company System Frontend Plan

## Goal

Build the frontend in Next.js with Lucide icons, using the Laravel backend in `../Supply_company_System Backend` as the source of truth.

This plan is based on:

- `routes/api.php`
- all API controllers, requests, resources, models, services, migrations
- bundled OpenAPI file: `../Supply_company_System Backend/apiSchema.json`
- bundled docs: `../Supply_company_System Backend/docs/api.md`

## Backend Summary

- Backend style: Laravel API with Sanctum bearer tokens
- Base API prefix: `/api/v1`
- Roles:
  - `admin`
  - `supervisor`
  - `customer`
- Main modules:
  - auth
  - customers
  - products
  - orders
  - order items
  - redeem codes
  - reorder notices

## Important Contract Notes

These matter before writing the UI:

1. Protected endpoints use bearer token auth, so the safest frontend approach is a Next.js BFF/proxy layer with secure cookies instead of storing the Laravel token in `localStorage`.
2. Requests are mostly camelCase in the Laravel request classes.
3. `register` is inconsistent:
   - `docs/api.md` and old `.http` tests use `passwordConfirmation`
   - OpenAPI shows `password_confirmation`
   - Laravel `confirmed` validation normally expects `password_confirmation`
   - Frontend should treat `password_confirmation` as the safer field unless backend behavior is verified live
4. Some old test files send snake_case for customer fields, but the active request classes expect camelCase.
5. Controllers paginate list endpoints, but the bundled OpenAPI file documents plain arrays.
   - Real Laravel paginated resources often return nested pagination metadata.
   - Frontend API utilities should normalize list responses and verify the exact runtime shape early.
6. Auth register OpenAPI response is incomplete.
   - Controller actually returns `201`
   - response contains `user`, `customer`, and `token`
7. Order business rules are not trivial:
   - customers can only see their own orders
   - creating an order reduces customer credit immediately
   - cancelling restores credit
   - stock is reduced only when order items are marked `delivered`
   - reorder notices are created when stock falls to or below reorder level after delivery

## Recommended Stack

### Core

- `next`
  - Use App Router and TypeScript.
- `lucide-react`
  - Use for navigation, action icons, status icons, empty states.
- `shadcn/ui`
  - Fastest way to build consistent admin/customer UI on top of Next.js.
  - Use its sidebar, dialog, sheet, select, table, pagination, badge, card, form, input, textarea, alert-dialog, skeleton, sonner integrations.

### Data, API, and validation

- `@tanstack/react-query`
  - Best fit for protected REST data, caching, invalidation, pagination, optimistic refresh after mutations.
- `orval`
  - Biggest time saver in this repo because the backend already ships an OpenAPI file.
  - Use it to generate TypeScript models and API clients from `../Supply_company_System Backend/apiSchema.json`.
- `react-hook-form`
  - Fast, lightweight forms for login, register, product create/update, order create, customer CRUD, redeem code flows.
- `zod`
  - Frontend form schemas and client-side validation.
- `@hookform/resolvers`
  - Connect Zod to React Hook Form.

### UI productivity

- `@tanstack/react-table`
  - Needed for customer/product/order/order-item/reorder-notice tables.
- `sonner`
  - Simple global toast system.
- `nuqs`
  - Store filters, page, search, sort in URL query params.
- `date-fns`
  - Date formatting for due dates, created dates, redeem timestamps.

### Optional but useful

- `msw`
  - Useful if you want local frontend progress before backend is running.
  - Orval can also generate mocks.

## Suggested Install Set

```bash
pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
pnpm dlx shadcn@latest init
pnpm add lucide-react @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-table react-hook-form zod @hookform/resolvers sonner nuqs date-fns
pnpm add -D orval msw
```

If you choose Orval React Query mode with its default client, add:

```bash
pnpm add axios
```

## Architecture Decision

### Recommended: Next.js BFF layer

Use Next.js route handlers and server utilities as a thin proxy in front of Laravel:

- login/register route handlers call Laravel auth endpoints
- save bearer token in `httpOnly`, `secure`, `sameSite=lax` cookie
- server-side fetch helpers read the cookie and attach `Authorization: Bearer <token>`
- client components never directly manage raw auth token
- role checks happen in middleware/layout guards using `/auth/me`

This gives:

- safer auth handling
- easier SSR/server component data loading
- no repeated token plumbing in the browser
- easier future deployment behind one frontend domain

### Alternative: direct browser-to-Laravel API

Only choose this if speed matters more than security structure. It is simpler to start, but worse for token handling.

## Proposed Frontend Structure

```text
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx
      page.tsx
      products/
        page.tsx
        new/page.tsx
        [productId]/page.tsx
        [productId]/edit/page.tsx
      orders/
        page.tsx
        new/page.tsx
        [orderId]/page.tsx
      order-items/
        page.tsx
        [orderItemId]/page.tsx
      customers/
        page.tsx
        new/page.tsx
        [customerId]/page.tsx
        [customerId]/edit/page.tsx
      redeem-codes/
        page.tsx
      reorder-notices/
        page.tsx
        [reorderNoticeId]/page.tsx
      profile/page.tsx
    api/
      auth/login/route.ts
      auth/register/route.ts
      auth/logout/route.ts
      auth/me/route.ts
      proxy/[...path]/route.ts
    layout.tsx
    globals.css
  components/
    layout/
    navigation/
    tables/
    forms/
    feedback/
    ui/
  features/
    auth/
    customers/
    products/
    orders/
    order-items/
    redeem-codes/
    reorder-notices/
  lib/
    api/
      generated/
      client.ts
      errors.ts
      normalizers.ts
      query-client.ts
    auth/
      session.ts
      guards.ts
      roles.ts
    format/
      currency.ts
      date.ts
  hooks/
  types/
  middleware.ts
```

## Role-Based UX Map

### Customer

- login / register
- dashboard
- browse products
- place order
- view own orders
- cancel own order if allowed
- redeem code
- view own profile and credit

### Supervisor

- dashboard
- product list + create
- order list + order detail
- order item list + mark delivered
- create redeem code

### Admin

- everything supervisor can do, plus:
- customer CRUD
- product update/delete
- order update/delete
- reorder notices

## Shared Types To Model First

```ts
type Role = "admin" | "supervisor" | "customer";
type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type DeliveryStatus = "pending" | "delivered";

type ApiSuccess<T> = {
  status: "success";
  data: T;
};

type ApiMessageSuccess = {
  status: "success";
  message: string;
};

type ApiError = {
  status?: "error";
  message: string;
  errors?: Record<string, string[]>;
};

type UserSummary = {
  id: number | string;
  name: string;
  email: string;
  role: Role;
};

type Customer = {
  customerId: number;
  firstName: string;
  middleName: string;
  lastName: string;
  address: {
    houseNo: string;
    streetName: string;
    city: string;
    zipCode: string;
  };
  phone: string;
  creditLimit: string | number;
  createdAt: string | null;
  updatedAt: string | null;
};

type Product = {
  productId: number;
  name: string;
  description: string;
  costPrice: string | number;
  sellPrice: string | number;
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  images: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

type OrderItem = {
  orderItemId: number;
  orderId: number;
  productId: number;
  quantity: number;
  itemTotalPrice: string | number;
  deliveryStatus: DeliveryStatus;
  createdAt: string | null;
  updatedAt: string | null;
  product?: Product;
};

type Order = {
  orderId: number;
  customerId: number;
  totalPrice: string | number;
  dueDate: string;
  orderStatus: OrderStatus;
  isPaid: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  customer?: Customer;
  items?: OrderItem[];
};

type ReorderNotice = {
  reorderNoticeId: number;
  productId: number;
  productName: string;
  reorderQuantity: number;
  currentQuantity: number;
  isResolved: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
```

## API Inventory

Base URL expected by frontend env:

```env
LARAVEL_API_URL=http://localhost:8000/api/v1
```

Also available from backend docs routes:

- `/docs/api`
- `/docs/api.json`

### Auth

#### `POST /auth/register`

- Public
- Controller returns `201`
- Request body:

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "firstName": "Ahmed",
  "middleName": "Ali",
  "lastName": "Hassan",
  "houseNo": "12",
  "streetName": "King Road",
  "city": "Riyadh",
  "zipCode": "11564",
  "phone": "0551234567"
}
```

- Success response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Customer Name",
      "email": "customer@example.com",
      "role": "customer"
    },
    "customer": {},
    "token": "..."
  }
}
```

- Frontend note:
  - use this response to create session immediately after register

#### `POST /auth/login`

- Public
- Request:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

- Success:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Customer Name",
      "email": "customer@example.com",
      "role": "customer"
    },
    "customer": {},
    "token": "..."
  }
}
```

- Error:

```json
{
  "status": "error",
  "message": "Invalid credentials."
}
```

#### `GET /auth/me`

- Protected
- Returns current authenticated user and optional linked customer profile

#### `POST /auth/logout`

- Protected
- Returns:

```json
{
  "status": "success",
  "data": null
}
```

### Customers

#### `GET /customers`

- Protected
- Role: `admin`
- Controller paginates `10`
- OpenAPI documents array, but runtime may be paginated Laravel resource payload
- Response item shape: `Customer`

#### `POST /customers`

- Protected
- Role: `admin`
- Request:

```json
{
  "firstName": "Ahmed",
  "middleName": "Ali",
  "lastName": "Hassan",
  "houseNo": "12",
  "streetName": "King Road",
  "city": "Riyadh",
  "zipCode": "11564",
  "phone": "0551234567",
  "creditLimit": 5000
}
```

#### `GET /customers/{customerId}`

- Protected
- Role: `admin`
- Response: `ApiSuccess<Customer>`

#### `PUT|PATCH /customers/{customerId}`

- Protected
- Role: `admin`
- Partial update allowed

#### `DELETE /customers/{customerId}`

- Protected
- Role: `admin`
- Controller returns HTTP `204` with a JSON body in code, which is unusual
- Frontend should treat delete as success on either:
  - `204` with no body
  - `204` with body
  - `200` if backend changes later

### Products

#### `GET /products`

- Protected
- Any authenticated user
- Controller paginates `10`
- Response item shape: `Product`

#### `GET /products/{productId}`

- Protected
- Any authenticated user

#### `POST /products`

- Protected
- Roles: `admin`, `supervisor`
- Request content type:
  - `multipart/form-data` when uploading images
  - images count: `3` to `4`
  - each image max: `2048 KB`
- Minimal body:

```json
{
  "name": "Samsung Galaxy A55",
  "description": "Smartphone with 5G, 128GB storage, and 8GB RAM",
  "costPrice": 950,
  "sellPrice": 1200,
  "currentQuantity": 50,
  "reorderLevel": 10,
  "reorderQuantity": 30
}
```

#### `PUT|PATCH /products/{productId}`

- Protected
- Role: `admin`
- Partial update allowed
- If `images[]` is sent, backend replaces existing images

#### `DELETE /products/{productId}`

- Protected
- Role: `admin`
- Success body:

```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```

### Orders

#### `GET /orders`

- Protected
- Any authenticated user
- Customer sees only their own orders
- Controller paginates `5`
- Includes related `customer` and `items.product`
- Response item shape: `Order`

#### `POST /orders`

- Protected
- Role: `customer`
- Request:

```json
{
  "customerId": 1,
  "dueDate": "2026-04-10",
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

- Frontend note:
  - customerId is forced from authenticated customer for customer users
  - frontend can still send it for contract compatibility
- Backend rules:
  - at least one item
  - quantity min `1`
  - enough stock required
  - total must not exceed customer credit limit
  - order total is calculated server-side

#### `GET /orders/{orderId}`

- Protected
- Customer can only access own order
- Includes `customer` and `items.product`

#### `PUT|PATCH /orders/{orderId}`

- Protected
- Route role middleware: `admin`, `supervisor`
- Request:

```json
{
  "dueDate": "2026-04-12",
  "isPaid": true
}
```

- Validation only supports:
  - `dueDate`
  - `isPaid`

#### `POST /orders/{orderId}/cancel`

- Protected
- Role: `customer`
- Can only cancel own order
- Cannot cancel if any order item is already delivered
- Restores customer credit

#### `DELETE /orders/{orderId}`

- Protected
- Role: `admin`
- Success:

```json
{
  "status": "success",
  "message": "Order deleted successfully"
}
```

### Order Items

#### `GET /order-items`

- Protected
- Roles: `admin`, `supervisor`
- Controller paginates `10`
- Includes related `order` and `product`

#### `GET /order-items/{orderItemId}`

- Protected
- Roles: `admin`, `supervisor`

#### `PUT|PATCH /order-items/{orderItemId}`

- Protected
- Roles: `admin`, `supervisor`
- Request:

```json
{
  "deliveryStatus": "delivered"
}
```

- Backend rules:
  - only transition allowed is `pending -> delivered`
  - cannot deliver items from cancelled orders
  - cannot deliver twice
  - stock must be available
  - if all items delivered, parent order becomes `completed`

### Redeem Codes

#### `POST /redeem-codes`

- Protected
- Roles: `admin`, `supervisor`
- Request:

```json
{
  "amount": 150
}
```

- Optional custom code:

```json
{
  "code": "SPRING2026X",
  "amount": 150
}
```

- Success:

```json
{
  "status": "success",
  "data": {
    "code": "SPRING2026X",
    "amount": "150.00"
  }
}
```

#### `POST /redeem-codes/redeem`

- Protected
- Role: `customer`
- Request:

```json
{
  "customerId": 1,
  "code": "PASTE_CODE_HERE"
}
```

- Frontend note:
  - backend overrides `customerId` from authenticated customer for customer users
- Success:

```json
{
  "status": "success",
  "data": {
    "code": "PASTE_CODE_HERE",
    "amount": "150.00",
    "usedAt": "2026-03-20T12:00:00Z",
    "usedByCustomerId": 1
  }
}
```

### Reorder Notices

#### `GET /reorder-notices`

- Protected
- Role: `admin`
- Controller paginates `10`
- Response item shape: `ReorderNotice`

#### `GET /reorder-notices/{reorderNoticeId}`

- Protected
- Role: `admin`

## Validation Rules That Affect Forms

### Register

- `name`: required, string, max 255
- `email`: required, unique
- `password`: required, min 8, confirmed
- `firstName`, `middleName`, `lastName`: required
- `houseNo`, `streetName`, `city`, `zipCode`, `phone`: required
- `phone`: unique

### Customer create/update

- all main fields required on create
- update is partial
- `creditLimit >= 0`
- `phone` unique

### Product create/update

- `name` unique on create
- `costPrice >= 0`
- `sellPrice >= costPrice` on create
- `currentQuantity >= 0`
- `reorderLevel >= 1`
- `reorderQuantity >= reorderLevel`
- optional images array with `3-4` images

### Order create

- `dueDate >= today`
- at least one item
- distinct product IDs
- quantity min `1`

### Order update

- only `dueDate` and `isPaid`
- `dueDate >= today`

### Order item update

- only `deliveryStatus`
- enum: `pending | delivered`
- service only allows submitting `delivered`

### Redeem code

- create amount min `1`
- redeem requires `customerId` and `code`

## Normalization Strategy

Create a tiny normalization layer in `src/lib/api/normalizers.ts`:

- `unwrapApiData`
  - unwrap `{ status, data }`
- `unwrapApiMessage`
  - unwrap `{ status, message }`
- `normalizePaginatedCollection`
  - support either:
    - `data: T[]`
    - `data: { data: T[]; links?: ...; meta?: ... }`
- `normalizeValidationError`
  - convert Laravel `422` response into UI-friendly field errors

This is important because the OpenAPI file and runtime pagination shape may not fully match.

## Page Plan By Phase

## Phase 1: Foundation

- Create Next.js app with App Router and TypeScript
- Initialize shadcn/ui
- Add Lucide, React Query, React Hook Form, Zod, Sonner, TanStack Table, Nuqs, Date-fns
- Add global app shell, theme tokens, sidebar, topbar, loading states, empty states
- Create API client layer
- Add Orval config pointing to `../Supply_company_System Backend/apiSchema.json`
- Add auth session handling with Next route handlers and secure cookie
- Add role constants and route guard helpers

Deliverables:

- working Next.js skeleton
- auth-safe API transport
- generated API types/client
- reusable UI primitives

## Phase 2: Authentication and Session

- Login page
- Register page
- logout action
- `/auth/me` bootstrap on app load
- middleware/layout guards
- role-based redirect after login:
  - customer -> `/`
  - supervisor -> `/products`
  - admin -> `/customers` or `/dashboard`

Deliverables:

- authenticated session lifecycle
- protected route handling
- unauthorized and forbidden screens

## Phase 3: Shared App Shell and Dashboard

- Main layout with sidebar + header
- Role-aware nav items
- Dashboard cards:
  - customer: credit, active orders, recent orders
  - supervisor: products count, pending deliveries, recent orders
  - admin: customers count, low stock notices, products, orders
- Add Lucide icon map for every nav/action/status

Deliverables:

- stable shell
- first real data screens
- reusable stat cards and tables

## Phase 4: Customer Flows

- Products listing and product detail
- Draft order builder page
- Create order flow
- Orders list
- Order detail page
- Cancel order action
- Redeem code page
- Profile page using `/auth/me`

Endpoints used:

- `GET /products`
- `GET /products/{productId}`
- `GET /orders`
- `POST /orders`
- `GET /orders/{orderId}`
- `POST /orders/{orderId}/cancel`
- `POST /redeem-codes/redeem`
- `GET /auth/me`

Deliverables:

- complete customer journey
- credit-aware order UX
- redemption UX

## Phase 5: Supervisor Flows

- Product create page
- Orders list/detail view
- Order items list/detail
- Mark item delivered action
- Create redeem code page

Endpoints used:

- `GET /products`
- `POST /products`
- `GET /orders`
- `GET /orders/{orderId}`
- `GET /order-items`
- `GET /order-items/{orderItemId}`
- `PATCH /order-items/{orderItemId}`
- `POST /redeem-codes`

Deliverables:

- supervisor operational console
- delivery workflow
- redeem code generation

## Phase 6: Admin Flows

- Customer list/detail/create/edit
- Product edit/delete
- Order update/delete
- Reorder notice list/detail

Endpoints used:

- `GET /customers`
- `POST /customers`
- `GET /customers/{customerId}`
- `PUT|PATCH /customers/{customerId}`
- `DELETE /customers/{customerId}`
- `PUT|PATCH /products/{productId}`
- `DELETE /products/{productId}`
- `PUT|PATCH /orders/{orderId}`
- `DELETE /orders/{orderId}`
- `GET /reorder-notices`
- `GET /reorder-notices/{reorderNoticeId}`

Deliverables:

- full admin management surface
- low stock monitoring

## Phase 7: Polish, Reliability, and QA

- Add optimistic refresh and query invalidation rules
- Add table filters with `nuqs`
- Add better empty states and error boundaries
- Add upload progress for product images
- Add form dirty-state prompts
- Add loading skeletons
- Add smoke tests for auth and key tables/forms
- Verify live payloads against backend for:
  - register field naming
  - pagination shape
  - delete response body behavior

Deliverables:

- production-ready UX
- fewer contract surprises
- documented edge cases

## shadcn/ui Components To Add Early

- `button`
- `card`
- `input`
- `textarea`
- `select`
- `dialog`
- `alert-dialog`
- `sheet`
- `sidebar`
- `table`
- `badge`
- `pagination`
- `skeleton`
- `tabs`
- `tooltip`
- `sonner`
- `dropdown-menu`
- `form` or field primitives used with RHF

## Lucide Icon Map

- `LayoutDashboard` for dashboard
- `Package` for products
- `ShoppingCart` for orders
- `Truck` for order items / delivery
- `Users` for customers
- `BadgeDollarSign` for redeem codes / credit
- `AlertTriangle` for reorder notices
- `UserCircle2` for profile
- `LogOut` for logout
- `Plus`, `Pencil`, `Trash2`, `Eye`, `Search`, `Filter`, `Loader2` for actions

## Backend Risks To Verify Early

1. Runtime pagination shape for all list endpoints.
2. `register` confirmation field name.
3. Whether product create/update accepts JSON without multipart in every deployment.
4. Whether `204` delete response from customers returns a body or not.
5. Exact image URL shape returned by `Storage::url()` in the deployment environment.
6. Exact base URL to use locally:
   - docs mention `http://localhost:8000/api/v1`
   - schema mentions `http://localhost/api/v1`

## Best Implementation Order

1. Bootstrap app, UI kit, auth proxy, API generation.
2. Finish login/register/logout/session restore.
3. Build app shell and role-based navigation.
4. Implement product listing first because every role uses it.
5. Implement customer order flow.
6. Implement supervisor delivery flow.
7. Implement admin customer/reorder management.
8. Add polish and contract verification.

## Research Sources

- Next.js App Router docs: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js data fetching docs: https://nextjs.org/docs/app/getting-started/fetching-data
- Lucide React docs: https://lucide.dev/guide/react
- shadcn/ui Next.js install docs: https://ui.shadcn.com/docs/installation/next
- shadcn/ui data table docs: https://ui.shadcn.com/docs/components/radix/data-table
- shadcn/ui React Hook Form docs: https://ui.shadcn.com/docs/forms/react-hook-form
- TanStack Query docs: https://tanstack.com/query/latest/docs/framework/react/overview
- Orval overview: https://orval.dev/overview
- Orval fetch guide: https://orval.dev/guides/fetch
- Orval React Query guide: https://orval.dev/guides/react-query
- Sonner docs: https://sonner.emilkowal.ski/getting-started
- Nuqs docs: https://nuqs.dev/docs/installation
- MSW docs: https://mswjs.io/docs
