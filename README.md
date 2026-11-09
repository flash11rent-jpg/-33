# Тим-Тим — MVP доставки по Тимашевску

Frontend: Vite + React PWA. API: Node.js + Express. Database: PostgreSQL.

## Frontend

```bash
npm install
npm run dev
npm run build
```

## API

The API starts with `npm start` and requires `DATABASE_URL` and `ADMIN_API_KEY`. Apply `server/schema.sql` to PostgreSQL before starting it. Full endpoint and deployment notes are in [server/README.md](server/README.md).

## Current scope

- Existing mobile-first storefront, demo shop catalogue, product selection and cart.
- Server-side order API with database-backed product price checks.
- Private order tracking token; operator endpoints protected by a server-side secret.
- PostgreSQL schema for shops, products and orders.
- Health/readiness endpoints, request validation, rate limiting and security headers.

## Not yet production-ready

The frontend still contains demo catalogue data and local-only order UI; it must be connected to the API before real customers can place orders. A PostgreSQL instance and API web service must be provisioned and configured in Render. Real shop partners, prices, stock, delivery fee, legal seller/agent model, privacy terms and fiscal receipt workflow must be confirmed. Online payment is intentionally not included. Never commit secrets or expose `ADMIN_API_KEY` to browser code.
