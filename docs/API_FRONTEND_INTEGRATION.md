# API Reference – Frontend Integration (Admin + Full)

This document lists **fixer-backend** APIs used by **fixer-admin** (admin panel) and includes admin-only routes.  
**For client-side only (website/mobile app, no admin):** see **[API_CLIENT_SIDE.md](./API_CLIENT_SIDE.md)**.  
Backend codebase: `fixer-backend/src`.

---

## Base URL & Auth

| Item | Value |
|------|--------|
| **Base URL** | Set in admin: `REACT_APP_API_URL` (e.g. `http://localhost:5000/api`). No trailing slash. |
| **Mobile app** | `EXPO_PUBLIC_API_URL` (same value; use machine IP for device/emulator). |
| **Auth** | JWT in header: `Authorization: Bearer <token>`. |
| **Login** | `POST /api/auth/login` or `POST /api/auth/oauth/google`; use returned token for protected routes. |

---

## 1. Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register (traditional) |
| POST | `/auth/login` | No | Login (email/password) |
| POST | `/auth/refresh-token` | No | Refresh access token |
| POST | `/auth/oauth/google` | No | Google OAuth |
| POST | `/auth/register/admin` | Admin | Create admin user |
| POST | `/auth/logout` | Yes | Logout |
| GET | `/auth/profile` | Yes | Get current user profile |
| PUT | `/auth/profile` | Yes | Update profile |
| PUT | `/auth/change-password` | Yes | Change password |
| POST | `/auth/verify-email` | Yes | Verify email |

---

## 2. Sliders / Banners (client + admin)

**Base path:** `/api/sliders`

Used by: **Slider Management** (admin), **mobile app** (home carousel), and any **client website** hero/offers.

### Public (no auth)

| Method | Endpoint | Query | Description |
|--------|----------|--------|-------------|
| GET | `/sliders/active` | (optional) `placement`, `platform`, `category_id`, `category_slug` | Get active sliders. Use `category_id` or `category_slug` for category-specific sliders (e.g. AC, Electrician). |

**Example (frontend/mobile):**
```http
GET /api/sliders/active
GET /api/sliders/active?placement=mobile_app_home&platform=mobile
GET /api/sliders/active?category_slug=electrician
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

### Admin (Bearer token + admin role)

| Method | Endpoint | Body / Query | Description |
|--------|----------|--------------|-------------|
| GET | `/sliders` | Query: `page`, `limit`, `search`, `status`, `audience`, `placement`, `category_id` | List sliders with pagination |
| GET | `/sliders/stats` | — | Slider statistics |
| GET | `/sliders/:id` | — | Get one slider |
| POST | `/sliders` | CreateSliderRequest | Create slider |
| PUT | `/sliders/:id` | UpdateSliderRequest | Update slider |
| PATCH | `/sliders/:id/position` | `{ "position": number }` | Update order |
| PATCH | `/sliders/:id/status` | `{ "is_active": boolean }` | Toggle active |
| DELETE | `/sliders/:id` | — | Delete slider |

**Create/Update body (admin):**  
`title`, `subtitle`, `description`, `image_url`, `image_url_mobile`, `image_alt`, `button_text`, `button_url`, `position`, `is_active`, `placement`, `category_id`, `category_slug`, `start_date`, `end_date`, `target_audience`.

---

## 3. Upload (admin)

**Base path:** `/api/upload`  
**Auth:** Required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/upload/images?folder=...&limit=...` | List Cloudinary images |
| POST | `/upload/image` | Upload single image (multipart) |
| POST | `/upload/images` | Upload multiple images (multipart) |
| DELETE | `/upload/image?publicId=...` | Delete image by publicId |

---

## 4. CMS Admin (`/api/cms/admin`)

**Auth:** Bearer + Admin.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/cms/admin/homepage` | Homepage sections |
| PUT/DELETE | `/cms/admin/homepage/:id` | Update/delete section |
| GET/POST | `/cms/admin/banners` | Banners (CMS model; sliders use `/api/sliders`) |
| PUT | `/cms/admin/banners/:id` | Update banner |
| POST | `/cms/admin/banners/:id/track` | Track banner |
| DELETE | `/cms/admin/banners/:id` | Delete banner |
| GET/POST | `/cms/admin/promotions` | Promotions |
| PUT/DELETE | `/cms/admin/promotions/:id` | Update/delete promotion |
| GET/POST | `/cms/admin/testimonials` | Testimonials |
| PUT/DELETE | `/cms/admin/testimonials/:id` | Update/delete testimonial |
| GET/POST | `/cms/admin/faqs` | FAQs |
| GET | `/cms/admin/faqs/categories` | FAQ categories |
| PUT/DELETE | `/cms/admin/faqs/:id` | Update/delete FAQ |
| GET/POST | `/cms/admin/seo` | SEO meta |
| PUT/DELETE | `/cms/admin/seo/:id` | Update/delete SEO |
| GET/POST | `/cms/admin/menus` | Menus |
| GET | `/cms/admin/menus/location/:location` | Menu by location |
| GET | `/cms/admin/menus/:id` | Menu by ID |
| PUT/PATCH/DELETE | `/cms/admin/menus/:id` | Update/toggle/delete menu |
| POST | `/cms/admin/menus/:menuId/items` | Add menu item |
| PUT | `/cms/admin/menus/:menuId/items/:itemId` | Update menu item |
| DELETE | `/cms/admin/menus/:menuId/items/:itemId` | Delete menu item |
| PUT | `/cms/admin/menus/:menuId/items/reorder` | Reorder menu items |

---

## 5. CMS Extended Admin (`/api/cms/admin` – extended)

Same base path; additional routes from extended CMS module:

- **Blog:** GET/POST `/cms/admin/blogs`, GET/PUT/DELETE `/cms/admin/blogs/:id`, POST `/cms/admin/blogs/ai-generate`
- **Blog categories:** GET/POST `/cms/admin/blog-categories`, GET/PUT/DELETE `/cms/admin/blog-categories/:id`
- **Media:** GET `/cms/admin/media`, GET `/cms/admin/media/stats`, GET `/cms/admin/media/folders`, GET/POST/PUT/DELETE `/cms/admin/media/:id`
- **Pages:** GET/POST `/cms/admin/pages`, GET/PUT/DELETE `/cms/admin/pages/:id`, GET `/cms/admin/pages/hierarchy`
- **Menus (extended):** Same as above plus extended controller behaviour where mounted.

---

## 6. Users & Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/admin` | Admin | Admin dashboard |
| GET | `/dashboard/customer` | Customer | Customer dashboard |
| GET | `/dashboard/provider` | Provider | Provider dashboard |
| GET | `/dashboard/activity` | Yes | User activity |
| GET | `/dashboard/notifications-summary` | Yes | Notifications summary |
| GET | `/users/...` | Varies | User CRUD (see backend users routes) |

---

## 7. Settings (client controls)

**Base path:** `/api/client`  
**Auth:** Required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/client` | Get client/settings controls |
| PUT | `/client` | Update client controls |

---

## 8. Other Backend Modules (for reference)

All under `/api`:

- **Categories:** `/categories` (tree, all, slug, create, update, delete, sort)
- **Subcategories:** `/subcategories`
- **Catalog:** `/catalog`
- **Service requests:** `/service-requests`
- **Providers:** `/providers`
- **Professionals:** `/professionals`, `/professionals/dashboard`, `/professionals/availability`, etc.
- **Professional applications:** `/professional-applications`
- **Platform services:** `/platform-services`
- **Quotes:** `/quotes`
- **Bookings:** `/bookings`, `/bookings/my-bookings`, `/bookings/provider/my-bookings`, etc.
- **Orders:** `/orders`
- **Offers:** `/offers`
- **Payments:** `/payments`, `/payments/stats`, `/payments/my-payments`, etc.
- **Products:** `/products`
- **Notifications:** `/notifications`
- **Coupons:** `/coupons`
- **Referrals:** `/referrals`
- **Wallet:** `/wallet`
- **Subscriptions:** `/subscriptions`
- **Invoices:** `/invoices`
- **Reviews:** `/reviews`
- **Chat:** `/chat`
- **CMS public:** `/cms` (public read routes)
- **Addresses:** `/addresses`
- **Earnings:** `/earnings`
- **Cart:** `/cart`
- **Wishlist:** `/wishlist`
- **Rewards:** `/rewards`
- **Analytics:** `/analytics`
- **Search:** `/search`
- **Reports:** `/reports`
- **Feedback/support:** `/feedback-support`
- **Export/import:** `/export-import`
- **Bulk operations:** `/bulk-operations`
- **Audit logs:** `/audit-logs`
- **Data management:** `/data-management`

Exact paths and query/body shapes are defined in **fixer-backend** under:

- `src/routes/index.ts` (mounts)
- `src/modules/<module>/routes/*.ts`

---

## 9. CORS & Health

- **Health:** `GET /health` (no `/api` prefix) – returns status, timestamp, uptime.
- **CORS check:** `GET /api/cors-check` – returns origin/referer and whether allowed.

Ensure backend CORS allows the admin and (if used) mobile app origins (see `fixer-backend/src/app.ts` and `config.CORS.ORIGIN`).

---

## 10. Frontend Usage Summary

| App | Base URL env | Main APIs |
|-----|----------------|-----------|
| **fixer-admin** | `REACT_APP_API_URL` | Auth, Sliders (admin), Upload, CMS admin, Dashboard, Users, Bookings, Payments, etc. |
| **fixer-mobile** | `EXPO_PUBLIC_API_URL` | `GET /api/sliders/active` (and any other public or authenticated endpoints you add). |

Use the same backend base URL (with `/api` included); only the host may differ (e.g. machine IP for mobile on device).
