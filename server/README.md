# Тим-Тим API

Node.js 20+ / Express / PostgreSQL API for persistent orders.

## Endpoints

- `GET /health` — process health
- `GET /ready` — database readiness
- `POST /api/orders` — create an order; prices are recalculated from PostgreSQL, not trusted from the browser
- `GET /api/orders/:id` — read one order using its private tracking token (`x-order-token` header or `token` query)
- `GET /api/admin/orders` — operator order list; requires `Authorization: Bearer <ADMIN_API_KEY>`
- `PATCH /api/admin/orders/:id/status` — change status; same operator authentication

## Database

Apply `server/schema.sql` once to the PostgreSQL database. It creates the initial demo catalogue as well as the orders tables. Replace the sample shops, products and prices with confirmed partner data before accepting real orders.

## Required environment

- `DATABASE_URL`: Render internal PostgreSQL URL when API and database share a region/workspace
- `ADMIN_API_KEY`: unique secret, at least 32 random characters
- `CORS_ORIGINS`: comma-separated trusted frontend origins
- `PGSSL`: normally false for Render internal networking; true only when required by the chosen database endpoint

## Important before public launch

The API is a technical MVP foundation, not permission to accept real orders yet. Confirm the seller/agent legal model, privacy notice and retention period, partner contracts, actual delivery pricing, catalogue and stock. Do not put the admin key in frontend code. Do not enable online payments until the legal, fiscal and acquiring flow is approved.
