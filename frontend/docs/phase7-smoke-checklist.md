# Phase 7 Smoke Checklist

## Auth

- Login with valid customer account and verify redirect to dashboard.
- Login with supervisor/admin accounts and verify role-specific navigation.
- Logout and verify protected routes redirect to `/login`.

## Customers (Admin)

- Create customer from `/customers/new`.
- Edit customer from `/customers/[customerId]/edit`.
- Delete customer from `/customers` list and verify optimistic removal.
- Test customer list filters via query string (`?q=`).

## Reorder Notices (Admin)

- Open `/reorder-notices` and test query filters:
  - `?q=...`
  - `?status=open|resolved|all`
- Open detail page `/reorder-notices/[reorderNoticeId]`.

## Products

- Create product with images and confirm upload progress bar appears.
- Verify progress reaches 100% and success toast shows.
- Close create dialog with unsaved data and verify discard confirmation appears.

## Reliability Checks

- Trigger a runtime failure on any page and verify app-level error boundary renders.
- Navigate during long data loads and verify app loading skeleton page renders.
- Confirm all modified list/detail pages build in production (`npm run build`).

## Contract Verification (Backend Runtime)

- Validate register still accepts `password_confirmation`.
- Confirm list pagination response shape for:
  - `/customers`
  - `/products`
  - `/orders`
  - `/order-items`
  - `/reorder-notices`
- Confirm delete response behavior for 204/200 endpoints used by frontend mutations.
