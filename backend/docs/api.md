# Supply Company System API

Base URL:
```
http://localhost:8000/api/v1
```

Docker (via Nginx):
```
http://localhost:8080/api/v1
```

## Authentication

Use Sanctum Bearer tokens for all protected endpoints.

Public endpoints:
- `POST /auth/register`
- `POST /auth/login`

Send tokens on protected routes:
```
Authorization: Bearer <token>
```

Register/login responses include `data.token`.

### Register
`POST /auth/register`

Body (JSON):
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "password123",
  "passwordConfirmation": "password123",
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

### Login
`POST /auth/login`

Body (JSON):
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

### Profile
`GET /auth/me`

### Logout
`POST /auth/logout`

All successful responses follow this shape:
```json
{
  "status": "success",
  "data": {}
}
```

Validation errors return HTTP `422` with details.

Request/response naming convention:
- Send request fields in `camelCase`.
- Response payload fields are `camelCase`.
- Some endpoints also accept compatibility aliases (example: `password_confirmation` for customer creation).

## Status Values

OrderStatus:
- `pending`
- `processing`
- `completed`
- `cancelled`

DeliveryStatus:
- `pending`
- `partial`
- `delivered`

## Customers

> Requires role: admin

### List customers
`GET /customers`

Note:
- Returns only customers linked to a login account (`user_id` is not null).

### Create customer
`POST /customers`

Body (JSON):
```json
{
  "name": "Ahmed Ali Hassan",
  "email": "ahmed.customer@example.com",
  "password": "password123",
  "passwordConfirmation": "password123",
  "firstName": "Ahmed",
  "middleName": "Ali",
  "lastName": "Hassan",
  "houseNo": "12",
  "streetName": "King Road",
  "city": "Riyadh",
  "zipCode": "11564",
  "phone": "0551234567",
  "creditLimit": 5000.00
}
```

Notes:
- Creates a linked login user in `users` with role `customer` and a profile in `customers`.
- `passwordConfirmation` is required (also accepts `password_confirmation` as compatibility input).

### Show customer
`GET /customers/{customerId}`

### Update customer
`PUT /customers/{customerId}`

Body (JSON, partial allowed):
```json
{
  "phone": "0559998888",
  "creditLimit": 7500.00
}
```

### Delete customer
`DELETE /customers/{customerId}`

## Products

> Requires auth. Create: supervisor/admin. Update/Delete: admin only.

### List products
`GET /products`

### Create product
`POST /products`

You can send JSON without images:
```json
{
  "name": "Samsung Galaxy A55",
  "description": "Smartphone with 5G, 128GB storage, and 8GB RAM",
  "costPrice": 950.00,
  "sellPrice": 1200.00,
  "currentQuantity": 50,
  "reorderLevel": 10,
  "reorderQuantity": 30
}
```

Or send multipart with 3–4 images:
```
name=Samsung Galaxy A55
description=Smartphone with 5G, 128GB storage, and 8GB RAM
costPrice=950.00
sellPrice=1200.00
currentQuantity=50
reorderLevel=10
reorderQuantity=30
images[]=@/path/to/image1.jpg
images[]=@/path/to/image2.jpg
images[]=@/path/to/image3.jpg
```

### Show product
`GET /products/{productId}`

### Update product
`PUT /products/{productId}` (or `PATCH`)

If you send `images[]`, existing images are replaced.

### Delete product
`DELETE /products/{productId}`

## Orders

> Requires auth. Customers can create/cancel their own orders. Staff can update orders.

Notes:
- Customers see only their own orders in list/show.
- Create/cancel requires role: customer.
- Update requires role: admin/supervisor.
- Delete requires role: admin.

### List orders
`GET /orders`

### Create order
`POST /orders`

Body (JSON):
```json
{
  "customerId": 1,
  "dueDate": "2026-02-10",
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

Notes:
- For authenticated customers, `customerId` is automatically bound to the logged-in customer profile.
- `totalPrice` is calculated server-side.
- Customer credit is decreased by the order total.

### Show order
`GET /orders/{orderId}`

### Update order
`PATCH /orders/{orderId}`

Body (JSON, partial allowed):
```json
{
  "dueDate": "2026-02-12"
}
```

### Mark order as paid
`POST /orders/{orderId}/mark-paid`

Body (JSON):
```json
{
  "isPaid": true
}
```

Rules:
- `isPaid` must be `true`.
- Cancelled orders cannot be marked as paid.

### Cancel order
`POST /orders/{orderId}/cancel`

Rules:
- Cancellation allowed only if no items are delivered.
- Credit is restored.
- Inventory is not changed (stock is reduced only on delivery).

### Delete order
`DELETE /orders/{orderId}`

## Order Items

> Requires role: supervisor/admin

### List order items
`GET /order-items`

### Show order item
`GET /order-items/{orderItemId}`

### Deliver order item
`PATCH /order-items/{orderItemId}`

Body (JSON):
```json
{
  "deliveredQuantity": 2
}
```

Notes:
- `deliveredQuantity` is cumulative and cannot decrease.
- `deliveredQuantity` cannot exceed ordered quantity.
- Stock is deducted only by the new delivered delta (e.g., from 1 -> 3 deducts 2).
- Delivery update is blocked for cancelled orders.
- Item `deliveryStatus` is resolved automatically:
  - `pending` when delivered quantity is `0`
  - `partial` when delivered quantity is between `1` and ordered quantity - 1
  - `delivered` when delivered quantity equals ordered quantity
- Order status is synchronized automatically from all item deliveries:
  - `pending` when total delivered quantity is `0`
  - `processing` when partially delivered
  - `completed` when fully delivered

## Redeem Codes

> Create requires role: supervisor/admin. Redeem is for customer only.

### Create redeem code
`POST /redeem-codes`

Body (JSON):
```json
{
  "amount": 150.00
}
```

You can optionally pass a custom `code`.

### Redeem code
`POST /redeem-codes/redeem`

Body (JSON):
```json
{
  "customerId": 1,
  "code": "PASTE_CODE_HERE"
}
```

Notes:
- Codes are single-use.
- `customerId` is resolved from the authenticated customer.
- Reusing a code returns a validation error.

## Reorder Notices

> Requires role: admin

### List reorder notices
`GET /reorder-notices`

### Show reorder notice
`GET /reorder-notices/{reorderNoticeId}`

## Reports

> Requires role: admin/supervisor

### Orders fulfillment report
`GET /reports/fulfillment`

Query params (optional):
- `fromDate` (YYYY-MM-DD)
- `toDate` (YYYY-MM-DD)

Defaults:
- if omitted, both default to today.

Response includes:
- report metadata (name, generatedAt, dateRange)
- summary totals (orders by status, total items, delivered quantity)
- item-level rows for printing/export.
