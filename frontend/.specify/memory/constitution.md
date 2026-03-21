# Supply Company System Frontend Constitution

## Core Principles

### I. Backend Source of Truth
The Laravel backend is the source of truth for business rules, validation, roles, and response contracts. The frontend must adapt to backend behavior and response shapes instead of redefining domain behavior on the client.

### II. Auth Through the BFF Layer
Authentication must flow through a Next.js BFF or proxy layer. Laravel bearer tokens may only be stored in secure httpOnly cookies. The frontend must never persist raw auth tokens in `localStorage`, expose them to client components, or bypass the BFF for authenticated browser flows.

### III. Contract-Driven API Access
Frontend API access must be generated from the backend OpenAPI schema where practical. Because runtime responses may diverge from the bundled schema, the frontend must include a normalization layer for success payload unwrapping, paginated collections, and validation error handling.

### IV. Request and Response Compatibility
Frontend forms and API payloads must follow backend request classes. `camelCase` is the default request shape unless a verified backend exception exists. For registration, `password_confirmation` is the default safe field until runtime behavior proves otherwise.

### V. Server-Owned Business Logic
The frontend may guide input and provide lightweight validation, but business-critical calculations and state transitions remain server-owned. This includes credit handling, order cancellation effects, stock deduction timing, and reorder notice creation.

## Product Constraints

### Role-Aware Behavior
Role-based access must be enforced at route, layout, and navigation levels. The product must support exactly these roles unless the backend contract changes:
- `admin`
- `supervisor`
- `customer`

Each role may only see flows and actions allowed by backend authorization rules.

### Reusable Frontend Architecture
The application must use Next.js App Router with TypeScript. Shared concerns must be centralized into reusable layers for:
- API client
- auth and session management
- route guards
- table and list normalization
- feature-based UI organization

### UX Consistency
The UI must use shared primitives and patterns built on `shadcn/ui`. Forms must use consistent validation and error presentation. Lists, tables, loading states, empty states, and feedback toasts must follow reusable patterns rather than ad hoc implementations.

### Reliability Before Polish
Contract-risk areas must be verified early. The highest-priority verification targets are:
- pagination response shape
- register confirmation field naming
- delete response behavior
- image upload and request format
- local base URL differences

## Delivery Workflow

### Incremental Vertical Slices
Implementation must proceed in vertical slices instead of building every page up front. The delivery order is:
1. foundation
2. authentication and session
3. app shell and navigation
4. products listing
5. customer flows
6. supervisor flows
7. admin flows
8. polish and QA

### Review and Planning Expectations
Plans, specs, and implementation tasks must be checked against this constitution before work begins. Any feature that conflicts with the backend contract, bypasses the BFF auth model, duplicates server business logic, or introduces role leakage must be revised before implementation.

## Governance

This constitution governs frontend planning and implementation for the Supply Company System. When another document conflicts with this file, this constitution takes precedence unless the backend contract explicitly requires a change.

Amendments must update this file and any dependent planning artifacts in the same change. Every amendment must preserve the backend-as-source-of-truth rule, or clearly document why the backend contract itself changed.

Compliance review must confirm:
- BFF-only authenticated browser flows
- no client-side raw token storage
- backend-compatible request and response handling
- route, layout, and navigation enforcement for roles
- incremental delivery aligned with the mandated slice order

**Version**: 1.0.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
