# API Reference – Client Side Only

APIs for the **client-facing app** (website or mobile): customer auth, public content, and logged-in customer actions. **No admin endpoints.**  
Backend: `fixer-backend/src`.

---

## Base URL & Auth

| Item | Value |
|------|--------|
| **Base URL** | e.g. `https://your-api.com/api` (no trailing slash). Set in client app env. |
| **Auth** | JWT: `Authorization: Bearer <token>`. |
| **Login** | `POST /api/auth/login` or `POST /api/auth/oauth/google`; use returned token for protected routes. |

---

## 1. Auth (`/api/auth`)

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (customer) |
| POST | `/auth/login` | Login (email/password) |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/oauth/google` | Google OAuth |

### Logged-in user (Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Logout |
| GET | `/auth/profile` | Get current user profile |
| PUT | `/auth/profile` | Update profile |
| PUT | `/auth/change-password` | Change password |
| POST | `/auth/verify-email` | Verify email |

---

## 2. Sliders / Banners (public)

**Base path:** `/api/sliders`

For hero carousels, offers strip, etc. on the client website or mobile app.

| Method | Endpoint | Query | Auth | Description |
|--------|----------|--------|------|-------------|
| GET | `/sliders/active` | `placement`, `platform` (optional) | No | Get active sliders |

**Examples:**
```http
GET /api/sliders/active
GET /api/sliders/active?placement=home_page_hero
GET /api/sliders/active?placement=mobile_app_home&platform=mobile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sliders": [
      {
        "id": "...",
        "title": "Summer Sale",
        "subtitle": "Up to 50% off",
        "description": "...",
        "image_url": "https://...",
        "image_url_mobile": "https://...",
        "image_alt": "...",
        "button_text": "Shop Now",
        "button_url": "/offers",
        "position": 1,
        "is_active": true,
        "placement": "home_page_hero",
        "start_date": "2025-01-01T00:00:00.000Z",
        "end_date": "2025-12-31T23:59:59.999Z",
        "target_audience": "all",
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
}
```

---

## 3. Categories (public)

**Base path:** `/api/categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories/tree` | No | Category tree |
| GET | `/categories/all` | No | All categories |
| GET | `/categories/slug/:slug` | No | Category by slug |
| GET | `/categories/slug/:slug/subcategories` | No | Subcategories by category slug |
| GET | `/categories/slug/:slug/services` | No | Services by category slug |
| GET | `/categories/:id` | No | Category by ID |
| GET | `/categories/:id/subcategories` | No | Subcategories by category ID |
| GET | `/categories/:id/services` | No | Services by category ID |

---

## 4. Catalog (public)

**Base path:** `/api/catalog`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/catalog/:categorySlug` | No | Catalog by category slug |

---

## 5. Platform services (public)

**Base path:** `/api/platform-services`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/platform-services/public` | No | All public services |
| GET | `/platform-services/public/featured` | No | Featured services |
| GET | `/platform-services/public/popular` | No | Popular services |
| GET | `/platform-services/public/trending` | No | Trending services |
| GET | `/platform-services/public/nearby` | No | Nearby services |
| GET | `/platform-services/public/slug/:slug` | No | Service by slug |
| GET | `/platform-services/public/category/:category` | No | Services by category |
| GET | `/platform-services/public/:id` | No | Service by ID |
| GET | `/platform-services/public/:id/similar` | No | Similar services |

---

## 6. CMS – public content (`/api/cms`)

No auth unless noted.

### Homepage & banners

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms/homepage` | Active homepage content |
| GET | `/cms/banners` | Active banners |
| POST | `/cms/banners/:id/track` | Track banner (e.g. impression/click) |

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms/promotions` | Active promotions |
| GET | `/cms/promotions/featured` | Featured promotions |
| POST | `/cms/promotions/validate` | Validate promo code |

### Testimonials, FAQs, SEO

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms/testimonials` | Featured testimonials |
| GET | `/cms/faqs` | FAQs |
| GET | `/cms/faqs/categories` | FAQ categories |
| POST | `/cms/faqs/:id/feedback` | FAQ feedback |
| GET | `/cms/seo/:pagePath` | SEO meta for page path |

### Blog (extended CMS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms/blogs` | Blog posts (list) |
| GET | `/cms/blogs/slug/:slug` | Post by slug |
| GET | `/cms/blogs/:id` | Post by ID |
| GET | `/cms/blogs/:id/related` | Related posts |
| GET | `/cms/blog-categories` | Blog categories |

### Pages & menus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms/pages` | Pages list |
| GET | `/cms/pages/slug/:slug` | Page by slug |
| GET | `/cms/pages/hierarchy` | Page hierarchy |
| GET | `/cms/menus` | Menus |
| GET | `/cms/menus/location/:location` | Menu by location (e.g. header, footer) |

---

## 7. Customer dashboard (Bearer token)

**Base path:** `/api/dashboard`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/customer` | Customer dashboard |
| GET | `/dashboard/activity` | User activity |
| GET | `/dashboard/notifications-summary` | Notifications summary |

---

## 8. Bookings – customer (Bearer token)

**Base path:** `/api/bookings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings/my-bookings` | My bookings (query: `page`, `limit`, `status`) |
| GET | `/bookings/history` | Booking history |
| POST | `/bookings` | Create booking |
| GET | `/bookings/:id` | Booking details |
| PATCH | `/bookings/:id/cancel` | Cancel booking |
| POST | `/bookings/:id/reschedule` | Reschedule booking |
| GET | `/bookings/:id/timeline` | Booking timeline |
| GET | `/bookings/:id/updates` | Booking updates |

---

## 9. Payments – customer (Bearer token)

**Base path:** `/api/payments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments/my-payments` | My payments (query: `page`, `limit`) |
| GET | `/payments/my-stats` | My payment stats |
| GET | `/payments/:id` | Payment details |
| POST | `/payments/process` | Process payment |
| POST | `/payments/create-intent` | Create payment intent |
| POST | `/payments/create-order` | Create order (e.g. Razorpay) |
| POST | `/payments/verify` | Verify payment |
| POST | `/payments/confirm` | Confirm payment |

---

## 10. Client settings (Bearer token)

**Base path:** `/api/client`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/client` | Get client/settings (e.g. feature flags, config) |
| PUT | `/client` | Update (if backend allows client updates) |

---

## 11. Notifications (Bearer token)

**Base path:** `/api/notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/vapid-key` | VAPID key for push (may be public) |
| POST | `/notifications/register-device` | Register device for push |
| DELETE | `/notifications/unregister-device` | Unregister device |
| GET | `/notifications/preferences` | Notification preferences |
| PUT | `/notifications/preferences` | Update preferences |
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete notification |

---

## 12. Other client-relevant modules

All under `/api`. Use only **public** or **customer** endpoints (no admin).

| Path | Client use |
|------|-------------|
| `/quotes` | Request/get quotes (per backend routes) |
| `/orders` | Customer orders |
| `/offers` | Active offers |
| `/addresses` | Customer addresses (auth) |
| `/cart` | Cart (auth) |
| `/wishlist` | Wishlist (auth) |
| `/reviews` | Submit/list reviews (auth where required) |
| `/search` | Search (public or auth per backend) |
| `/data-management` | Export my data, delete account (auth) |

Exact methods and query/body are in **fixer-backend** `src/modules/<module>/routes/*.ts`.

---

## 13. Health & CORS

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check (no `/api` prefix) |
| GET | `/api/cors-check` | No | CORS debug |

---

## Summary

- **Public (no token):** Auth (register/login/refresh/OAuth), sliders/active, categories, catalog, platform-services/public, CMS (homepage, banners, promotions, testimonials, FAQs, SEO, blog, pages, menus).
- **Logged-in customer (Bearer):** Auth (profile, logout, etc.), dashboard/customer, my-bookings, my-payments, client settings, notifications, addresses, cart, wishlist, data-management (own data).
- **Admin-only routes** (e.g. `/cms/admin`, `/sliders` create/update/delete, `/upload`, `/dashboard/admin`) are **not** for the client app; use the admin panel instead.
