# Zomato Reference

A food delivery marketplace **reference implementation inspired by Zomato**. Built with Next.js 16 App Router, React 19, Tailwind 4, TypeScript, MongoDB/Mongoose, bcryptjs, jose (JWT in an HTTP-only cookie) and zod.

Customers discover restaurants, browse menus, build a single-restaurant cart, save addresses, place and track orders, and review delivered meals. Restaurant partners list restaurants, manage menus, process orders through a status workflow and see dashboards.

## Features

- Email/password auth with bcrypt hashing, signed JWT in an HTTP-only cookie, and protected route group.
- Partner-owned restaurants with cuisines, area, ETA, delivery fee, minimum order and aggregate rating.
- Menu management with veg/non-veg flags and availability toggles.
- Search by name/cuisine/area, area and cuisine filters, rating/ETA/newest sorting, capped pagination.
- Single-restaurant cart with server-enforced mixing guard, availability checks and minimum-order validation. Cart math is recomputed from the database at checkout — client prices are never trusted.
- Address CRUD, with deletion blocked while an address is used by an active order.
- Orders with snapshot items/address, status workflow (`placed → confirmed → preparing → out_for_delivery → delivered`, plus `cancelled`) and a tracking timeline. Only the correct actor may advance or cancel an order.
- Reviews only after delivery, one per order, with atomic aggregate-rating updates.
- Favorites, customer dashboard, partner dashboard, and partner restaurant/menu management pages.
- Responsive cards and pages with loading, empty and error states.

## Setup

Requirements: Node 20.9+, npm, MongoDB running locally.

```bash
npm install
cp .env.example .env.local   # adjust values if needed
npm run seed                 # creates the demo dataset in zomato_ref
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3208
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/zomato_ref` | Mongo connection; the seed script refuses any other database name |
| `JWT_SECRET` | development fallback | HMAC secret for session JWTs (set a long random value in production) |

## Seed data

`npm run seed` drops **only** the `zomato_ref` database, recreates indexes, and is safely re-runnable. It creates 5 users, 8 restaurants (including one closed and one unrated), 37 menu items (some unavailable), 5 addresses, 4 carts, 8 orders covering every status, 3 reviews and 4 favorites. All demo passwords are `password123`.

| Account | Role | Use it for |
| --- | --- | --- |
| `alex@example.com` | Customer | Cart with Spice Route items, an active order, favorites and delivered orders ready to review |
| `priya@example.com` | Customer + partner | Owns Spice Route, Green Bowl, Tandoor Express |
| `marcus@example.com` | Partner | Owns Nonna's Kitchen, Wok & Roll, closed Midnight Grill |
| `sofia@example.com` | Customer + partner | Owns Sunrise Diner and Burger Bunker; card with a below-minimum cart |
| `rahul@example.com` | Customer | Below-minimum cart, confirmed and cancelled orders |

## Pages

`/` · `/login` · `/register` · `/browse` · `/restaurants/[id]` · `/cart` · `/addresses` · `/orders` · `/orders/[id]` · `/favorites` · `/dashboard` · `/partner/restaurants/new` · `/partner/restaurants/[id]`

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Register (optional `roles`), sets session cookie |
| POST | `/api/auth/login` | public | Sign in |
| POST | `/api/auth/logout` | session | Clear session cookie |
| GET | `/api/auth/me` | public | Current user or `null` |
| GET/PATCH | `/api/users/me` | session | Profile; PATCH supports `becomePartner` |
| GET/POST | `/api/restaurants` | public / partner | Paginated discovery with `q`, `area`, `cuisine`, `sort` / create |
| GET/PATCH | `/api/restaurants/[id]` | public / owner | Detail / update (including `isActive`) |
| GET/POST | `/api/restaurants/[id]/menu` | public / owner | Paginated menu / add item |
| PATCH/DELETE | `/api/menu/[itemId]` | owner | Update / remove menu item |
| GET/POST | `/api/restaurants/[id]/reviews` | public / session | Reviews list / create after delivery |
| PATCH | `/api/reviews/[id]` | author | Edit rating/text |
| GET/DELETE | `/api/cart` | session | Cart view / clear |
| POST | `/api/cart/items` | session | Add item (single-restaurant guard) |
| PATCH/DELETE | `/api/cart/items/[itemId]` | session | Change quantity / remove item |
| GET/POST | `/api/addresses` | session | Address list / create |
| PATCH/DELETE | `/api/addresses/[id]` | session | Edit / delete (blocked for active orders) |
| GET/POST | `/api/orders` | session | Own orders (`scope=partner` when applicable) / checkout |
| GET | `/api/orders/[id]` | participant | Order detail with timeline |
| POST | `/api/orders/[id]/status` | participant | Guarded status transition |
| GET/POST | `/api/favorites` | session | Favorites list / add |
| DELETE | `/api/favorites/[restaurantId]` | session | Remove favorite |
| GET | `/api/dashboard/customer` | session | Customer stats |
| GET | `/api/dashboard/partner` | partner | Partner stats |

All list endpoints accept `page` and `limit` and cap `limit` at 50. Mutations are zod-validated and authorization is enforced server-side; password hashes are never serialized.

## Verification

`npm run lint`, `npm run typecheck`, `npm run build` and `npm run seed` pass cleanly. A 126-assertion curl matrix covers auth, discovery, CRUD, all edge cases (mixed-restaurant cart, below-minimum order, wrong-actor transitions, pre-delivery review, address in active order), engagement, dashboards and page statuses.

## Known limitations

- No payment gateway, real delivery-rider assignment, websocket live tracking or image uploads; cards use gradient placeholders.
- Ratings are stored as a rounded weighted average seeded with historical counts; individual historical reviews are not stored.
- Canceling a delivered order is not supported; status transitions are deliberately one-way.
- Search uses case-insensitive regex filters rather than a full-text score sort.
- No rate limiting, email verification, password reset or multi-tenancy; `JWT_SECRET` must be replaced in production.
- Restaurant deletion is intentionally not exposed because completed orders reference restaurants.
