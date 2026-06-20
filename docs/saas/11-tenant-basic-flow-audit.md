# Tenant Basic Flow — Implementation Audit

> **Purpose:** Confirm what a tenant admin can do today for the minimum viable restaurant / e-commerce onboarding path, and what still needs to be built.
>
> **Audience:** Product, engineering, QA  
> **Last updated:** 2026-06-12  
> **Related:** [`08-onboard-three-tenants-runbook.md`](./08-onboard-three-tenants-runbook.md), [`07-human-test-plan.md`](./07-human-test-plan.md), [`STOREFRONT_TEMPLATES.md`](../../../STOREFRONT_TEMPLATES.md)

---

## The six-step flow

This is the smallest path a tenant should be able to complete after being provisioned:

| # | Step | Goal |
|---|------|------|
| 1 | **Login as Admin** | Tenant owner signs in and lands in their scoped dashboard |
| 2 | **Select template** | Pick a storefront look & feel (theme) |
| 3 | **Add products / menu items** | Populate the catalog customers will see |
| 4 | **Manage product availability** | Turn items on/off or out-of-stock without a full edit |
| 5 | **Manage store open/close & slots** | Control when orders are accepted and delivery/pickup times |
| 6 | **Send confirmation** | Acknowledge incoming orders and notify the customer |

**Apps in scope**

| App | Role |
|-----|------|
| `profixer-admin-frontend` | Tenant admin dashboard (`/auth`, `/products`, `/orders`, `/settings/storefront`) |
| `fixer-backend` | Multi-tenant API |
| `profixer-admin-frontend/storefront` | Public tenant storefront (Next.js) |
| `apps/admin-mobile` | Mobile ops (bookings confirm exists; orders partial) |

**Out of scope for this flow:** `user-site-fixerwebapp` is the ProFixer home-services consumer marketplace, not the SaaS tenant admin or multi-tenant storefront.

---

## Summary at a glance

| Step | Status | Can a tenant do it end-to-end today? |
|------|--------|--------------------------------------|
| 1. Login as Admin | ✅ **Done** | Yes — email/password at `/auth` |
| 2. Select template | 🟡 **Partial** | Yes — theme picker under Settings → Storefront; not a guided onboarding step |
| 3. Add products / menu items | ✅ **Done** | Yes — `/products` CRUD; restaurant menu = products |
| 4. Manage product availability | 🟡 **Partial** | Yes via edit form + inventory page; no quick list toggle |
| 5. Store open/close & slots | ❌ **Not started** | No — storefront hours are hardcoded; no admin UI |
| 6. Send confirmation | 🟡 **Partial** | Partial — status workflow + auto email on create; no dedicated “Send confirmation” button on web |

**Overall:** Steps 1, 3 are production-ready. Steps 2, 4, 6 work but need UX polish. Step 5 is the largest gap.

---

## Step 1 — Login as Admin

### Status: ✅ Done

### What exists

**Frontend**

| File | Purpose |
|------|---------|
| `src/pages/auth/auth.tsx` | Login page at `/auth` |
| `src/components/auth/LoginForm.tsx` | Email + password form |
| `src/store/slices/authSlice.ts` | JWT persistence, `loginUser` thunk |
| `src/services/api/auth.service.ts` | `POST /auth/login` |
| `src/components/auth/ProtectedRoute.tsx` | Auth gate |
| `src/components/auth/RoleBasedRoute.tsx` | Permission-based routes |
| `src/pages/auth/accept-team-invite.tsx` | Set password from invite (`/auth/accept-invite`) |
| `src/lib/extractTenantFromAuth.ts` | Maps JWT `tenantId` into Redux |

**Backend**

| File | Purpose |
|------|---------|
| `src/modules/auth/routes/auth.ts` | `POST /login`, `POST /register/admin` |
| `src/modules/auth/services/AuthServiceMongo.ts` | Login, tenant binding, suspended-org block |
| `src/core/middleware/auth.ts` | `authenticateToken`, `requireAdmin` |
| `src/core/middleware/requireOrgTenantScope.ts` | Org admins must have JWT `tenantId` |
| `src/models/User.ts` | Dashboard members require `tenantId` (except `super_admin`) |

**Provisioning (platform operator → tenant admin)**

| File | Purpose |
|------|---------|
| `src/pages/settings/PlatformTenantsPage.tsx` | Invite admin via `POST /auth/register/admin` |
| `src/services/EmailService.ts` | Team invite email with temp password |

### How to verify

1. Platform operator creates org in **Settings → Platform tenants** (see runbook §3).
2. Invitee opens `/auth/accept-invite`, sets password.
3. Signs in at `/auth` → lands on `/dashboard` with tenant name in header.
4. JWT includes `tenantId`, `verticalKey`, `featureModules`, `planKey`.

### Gaps

| Gap | Notes |
|-----|-------|
| No self-serve signup | `VerticalSignupWizard` collects org info then redirects to `/auth`; org creation is operator-driven |
| Google OAuth on backend only | `/auth/oauth/google` exists; admin UI is email/password only |
| Route naming | Login is `/auth`, not `/login` — some docs reference `/login` |

### How to close gaps (optional, lower priority)

- Add OAuth buttons to `LoginForm.tsx` wired to existing backend routes.
- Self-serve tenant signup would need org + admin + plan in one transactional API (separate epic).

---

## Step 2 — Select template

### Status: 🟡 Partial

In this codebase, “template” = **storefront theme** (`themeKey`), not CMS page templates.

### What exists

**Frontend**

| File | Purpose |
|------|---------|
| `src/pages/settings/StorefrontSettingsPage.tsx` | `/settings/storefront` |
| `src/components/storefront/StorefrontStudioPanel.tsx` | Branding, SEO, sections, **Themes** tab |
| `src/components/storefront/studio/StorefrontThemeMarketplace.tsx` | Theme picker UI |
| `src/services/api/storefrontStudio.service.ts` | `GET/PATCH /storefront-studio/config` |
| `storefront/lib/theme-classes.ts` | Maps `themeKey` → CSS classes |
| `storefront/components/HomePageSections.tsx` | Vertical-specific layout branches |

**Backend**

| File | Purpose |
|------|---------|
| `src/modules/storefront-studio/routes/storefrontStudio.ts` | `/api/storefront-studio` |
| `src/modules/storefront-studio/controllers/TenantStorefrontConfigController.ts` | GET/PATCH config + theme catalog |
| `src/modules/storefront-studio/catalog/storefrontThemes.ts` | Theme catalog (`classic`, `saffron`, `warm-bistro`, `luxury-retail`, …) |
| `src/models/TenantStorefrontConfig.ts` | `themeKey`, `sections`, `featureFlags`, branding |

**Available themes (examples by vertical)**

| Vertical | Themes |
|----------|--------|
| Restaurant | `classic`, `minimal`, `warm-bistro`, **`saffron`** (full menu UX) |
| Retail | `classic`, `minimal`, `luxury-retail` (Pro — contact platform) |
| Home services | `classic`, `minimal`, `trade-pro` (Pro) |

### How to verify

1. Sign in as restaurant tenant admin (e.g. `thebrownbutter`).
2. Go to **Settings → Storefront → Themes**.
3. Click a theme (e.g. `saffron`) → saves via `PATCH { themeKey }`.
4. Open public storefront → theme CSS and component tree update.

### Gaps

| Gap | Impact |
|-----|--------|
| Not a first-run wizard | Tenant must discover Settings → Storefront; no “pick your template” onboarding step |
| `themeKey` ≠ full template swap | Mostly CSS + some component branches; full React template registry incomplete (see `STOREFRONT_TEMPLATES.md`) |
| Pro themes locked | `trade-pro`, `luxury-retail` show “contact platform” for tenant admins |
| Vertical set at org creation | Platform operator picks `verticalKey`; tenant cannot change vertical in UI |
| CMS “templates” confusion | `pageTemplates.ts` / CMS pages are **site page layouts**, not storefront themes |

### How to build

1. **P3 — Onboarding wizard:** After first login, guide: theme → branding → first product → preview link.
2. **P4 — Template registry:** Implement per-theme component bundles as described in `STOREFRONT_TEMPLATES.md`.
3. **P2 — In-app theme preview:** Side-by-side preview before save (Storefront Studio already has structure for this).

---

## Step 3 — Add products / menu items

### Status: ✅ Done

Restaurant **menu items** are stored as **Products**. There is no separate MenuItem entity for food.

### What exists

**Frontend**

| File | Purpose |
|------|---------|
| `src/pages/products/products.tsx` | Product list `/products` |
| `src/pages/products/add-product.tsx` | Create/edit `/products/add`, `/products/edit/:id` |
| `src/components/products/ProductTable.tsx` | Table view |
| `src/services/api/products.service.ts` | Product API client |
| `src/verticals/restaurant/sidebarManifest.ts` | Sidebar label **Menu items** → `/products` |

**Backend**

| File | Purpose |
|------|---------|
| `src/modules/products/routes/products.ts` | `GET/POST/PUT/PATCH/DELETE /api/products` |
| `src/modules/products/controllers/ProductController.ts` | CRUD handlers |
| `src/modules/products/services/ProductServiceMongo.ts` | Tenant-scoped logic |
| `src/models/Product.ts` | name, price, SKU, images, variants, categories, stock |
| `src/modules/products/routes/publicCatalog.ts` | `GET /api/public/storefront/menu` — groups products by category |

**Public storefront**

| File | Purpose |
|------|---------|
| `storefront/themes/restaurant/MenuSection.tsx` | Menu display |
| `storefront/themes/restaurant/saffron/SaffronMenuPage.tsx` | Inline order-online UX |

**Terminology note:** CMS **Menus** (`/cms/menus`) are **navigation link trees** (header/footer), not food catalog.

### How to verify

1. **Products → Add product** — fill name, price, category, image, set status **Published**, `isActive` on.
2. Ensure storefront has `featureFlags.showMenu` enabled (Storefront Studio → Sections).
3. Open public menu URL → item appears under its category.

### Gaps

| Gap | Notes |
|-----|-------|
| No restaurant-specific fields UI | Modifiers, spice level, etc. limited to variants/generic fields |
| Home-services catalog is separate | `/services` + `PlatformService` is a different model |
| Category taxonomy shared | Uses generic `Category` model |

### How to build (optional enhancements)

- Restaurant modifier groups (size, add-ons) as product variant UI improvements.
- Bulk CSV import for large menus.

---

## Step 4 — Manage product availability

### Status: 🟡 Partial

### What exists

**Mechanisms today**

| Mechanism | Where | Effect |
|-----------|-------|--------|
| `isActive` + `status` | Product edit form | Controls lifecycle (`draft` / `published` / `archived` / `out_of_stock`) |
| `stockQuantity` | Product form + Inventory | Drives `isInStock`; auto `out_of_stock` when depleted |
| Active/inactive filter | `/products` list | Filter only — no inline toggle |
| Inventory adjustments | `/inventory` | Adjust stock, low-stock threshold |
| Section flags | Storefront Studio | Hide entire Products/Menu sections (`showProducts`, `showMenu`) |

**Key files**

- `src/pages/products/add-product.tsx` — `isActive`, `stockQuantity`, `allowBackorder`
- `src/pages/inventory/InventoryManagement.tsx`
- `src/lib/productFormPayload.ts` — maps `isActive` → `is_active`
- `src/models/Product.ts` — `isActive`, `isInStock`, variant `isAvailable`
- `PATCH /api/products/:id/stock`

### How to verify

1. Edit product → toggle **Active** off → item disappears from public menu.
2. Set stock to 0 → status becomes `out_of_stock` (unless backorder allowed).
3. **Inventory** page → adjust quantity → stock restored.

### Gaps

| Gap | Impact |
|-----|--------|
| **No quick “86” toggle** on product list | Must open full edit form or inventory dialog |
| No “unavailable today” concept | Same as deactivate or zero stock |
| No scheduled availability | Lunch-only items, day-of-week menus not supported |
| Variant availability UI weak | Model supports `variant.isAvailable`; admin UI not prominent |

### How to build

**P1 — Quick availability toggle (small, high value)**

```
Frontend: ProductTable.tsx
  → Add Switch per row for is_active
  → PATCH /api/products/:id { is_active: boolean }

Optional: "Mark out of stock" action → PATCH /api/products/:id/stock { quantity: 0 }
```

**P2 — “Unavailable today” (restaurant ops)**

- Add `availabilityOverride?: { until: Date; reason?: string }` on Product or a daily ops table.
- Public catalog filters items with active override.
- Admin list shows badge + one-click “86 until tomorrow”.

**P3 — Scheduled menu**

- `availabilitySchedule: { dayOfWeek, startTime, endTime }[]` on Product or Category.
- Public menu API filters by tenant timezone + current time.

---

## Step 5 — Manage store open/close & slots

### Status: ❌ Not started

This is the **largest gap** in the basic tenant flow.

### What exists (related but not tenant store ops)

| Item | Location | Actual purpose |
|------|----------|----------------|
| `serviceSlotPolicy.ts` | backend + user-site | Fixed home-service booking slots (8 AM–6 PM) — **not tenant-configurable** |
| `PlatformService.timeSlots` | backend model | Home-services platform catalog |
| `ServiceProvider.businessHours` | backend model | Individual provider hours |
| `openingHoursSummary` | CMS category marketing | **SEO text only** |
| Saffron header | `storefront/themes/restaurant/saffron/SaffronHeader.tsx` | **`isOpen = true` hardcoded**, text `"Open · Closes 11 PM"` |
| Delivery/pickup toggle | `SaffronMenuPage.tsx` | Mode switch only — **no time slots** |
| `availabilityHours` | `settings.tsx` + backend settings | Mock/local client-controls data — **not persisted as store schedule** |
| `TenantStorefrontConfig` | backend model | **No** `operatingHours`, `isStoreOpen`, or slot fields |

### How to verify (current behavior)

1. There is **no admin screen** for store hours.
2. Saffron storefront always shows green “Open · Closes 11 PM”.
3. Checkout does **not** block orders when the store would logically be closed.
4. Pausing orders is only possible by hiding menu/products sections in Storefront Studio.

### How to build

**P0 — Store operations (recommended schema)**

Add to `TenantStorefrontConfig` or `Tenant.industrySettings.restaurant`:

```typescript
operatingHours: {
  timezone: string;           // e.g. "Asia/Kolkata"
  weekly: Record<'mon'|'tue'|..., { open: string; close: string; closed?: boolean }>;
  exceptions?: { date: string; closed?: boolean; open?: string; close?: string; note?: string }[];
};
orderSettings: {
  acceptOrders: boolean;      // manual "pause orders" kill switch
  modes: ('delivery' | 'pickup')[];
  leadTimeMinutes: number;  // min prep time
  slotIntervalMinutes: number;  // e.g. 30
  maxOrdersPerSlot?: number;
};
```

**Backend tasks**

1. Extend `TenantStorefrontConfig` schema + migration/default for existing tenants.
2. `GET/PATCH /api/storefront-studio/config` — include `operatingHours`, `orderSettings`.
3. `GET /api/public/storefront/config` — expose computed `isOpenNow`, `nextOpenAt`, available slots.
4. Public order/create endpoint — reject when `!isOpenNow || !acceptOrders`.
5. Slot reservation (optional v2): hold slot capacity per time window.

**Frontend tasks (admin)**

1. New panel in **Settings → Storefront** (or **Restaurant → Store hours**):
   - Weekly hours editor (open/close per day)
   - “Pause orders now” toggle
   - Delivery vs pickup enablement
   - Slot interval + lead time
2. Dashboard widget: “Store is OPEN / CLOSED” with quick pause.

**Storefront tasks**

1. Replace hardcoded `isOpen` in `SaffronHeader.tsx` with public config.
2. Checkout: slot picker (today + N days, filtered by lead time).
3. Show “We’re closed — opens at …” when applicable.

**Effort estimate:** ~1–2 sprints for MVP (hours + pause + header); +1 sprint for slot picker + checkout enforcement.

---

## Step 6 — Send confirmation

### Status: 🟡 Partial

“Send confirmation” here means: **tenant admin acknowledges an incoming order/reservation and the customer gets notified**.

### What exists

**Orders (e-commerce / restaurant online orders)**

| File | Behavior |
|------|----------|
| `src/pages/orders/orders.tsx` | Order queue |
| `src/pages/orders/OrderDetailDrawer.tsx` | Status flow: `pending → confirmed → processing → shipped → delivered` |
| `OrderServiceMongo.ts` | Auto `sendOrderConfirmationToCustomer` on **order create** |
| `EmailService.ts` | Order confirmation, shipped, delivered templates |

**Order admin UX today**

- Select next status (e.g. `confirmed`) → click **Apply status**.
- Checkbox: **“Notify customer by email (shipped / delivered)”** — wording implies notify is mainly for shipment stages, not confirmation.
- No button labeled “Send confirmation” or “Confirm order & notify”.

**Bookings / reservations**

| File | Behavior |
|------|----------|
| `src/components/bookings/UpdateBookingStatusModal.tsx` | Update status + “Notify customer about status change” |
| `src/pages/bookings/booking-details.tsx` | Accept/confirm with `notifyCustomer: true` |
| `apps/admin-mobile/src/lib/bookingWorkflow.ts` | Quick action **“Confirm booking”** (`pending → confirmed`) |
| `NotificationService.ts` | `sendBookingConfirmation` |
| `SMSService.ts` | Booking confirmation SMS |

**Consumer-side (automatic, not admin action)**

- Storefront checkout shows post-payment confirmation.
- `user-site-fixerwebapp` checkout has “Confirm booking” for ProFixer marketplace (different product).

### How to verify

**Orders**

1. Customer places order on storefront → customer receives automatic order confirmation email.
2. Admin opens **Orders** → pending order → drawer → set status to `confirmed` → Apply status.
3. Email notify checkbox may not clearly fire for `confirmed` (label says shipped/delivered).

**Bookings**

1. Admin opens booking → Update status → `confirmed` + notify checked → customer notified (email/push/SMS depending on config).

### Gaps

| Gap | Impact |
|-----|--------|
| No **“Confirm order & notify customer”** button on web | Generic status dropdown; easy to miss |
| Notify checkbox scoped to shipped/delivered | Misleading for restaurant “confirm order” use case |
| No **resend confirmation** without status change | Cannot re-send if customer didn’t get email |
| Restaurant-specific ops UX | Same fulfillment UI as retail shipping |
| SMS/push depends on provider config | OneSignal, SMTP, SMS gateway must be configured |

### How to build

**P2 — Explicit confirm action (web orders)**

```
OrderDetailDrawer.tsx — when status === 'pending':
  → Primary button: "Confirm order & notify customer"
  → Calls PATCH status=confirmed, notifyCustomer=true
  → Update checkbox label: "Notify customer by email"

Optional: "Resend confirmation" secondary action (no status change)
  → POST /api/orders/:id/resend-confirmation
```

**Backend**

- Ensure `OrderServiceMongo.updateStatus` sends confirmation-style email when `confirmed` + `notifyCustomer`.
- Add `resendConfirmation(orderId)` that re-queues `sendOrderConfirmationToCustomer`.

**P2 — Parity with mobile**

- Port `bookingWorkflow.ts` pattern to orders on admin-mobile: **Confirm order** quick action.

**P3 — Restaurant order board**

- Dedicated `/orders/kitchen` or `/orders/live` view: incoming → confirm → preparing → ready.

---

## End-to-end test script (restaurant tenant)

Use after platform operator provisions tenant per [`08-onboard-three-tenants-runbook.md`](./08-onboard-three-tenants-runbook.md).

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Accept invite, sign in at `/auth` | Dashboard loads, tenant scoped | ✅ |
| 2 | Settings → Storefront → Themes → pick `saffron` | Theme saves, storefront updates | ✅ |
| 3 | Products → Add product (published, active) | Appears on public menu | ✅ |
| 4 | Toggle product inactive via edit form | Disappears from menu | ✅ |
| 5 | Set store hours / pause orders | — | ❌ Not available |
| 6 | Place test order on storefront | Customer gets auto confirmation email | ✅ |
| 7 | Orders → pending → confirm | Status updates; notify UX unclear | 🟡 |

---

## Recommended build priority

| Priority | Item | Effort | Unblocks |
|----------|------|--------|----------|
| **P0** | Store hours + open/close + pause orders + storefront enforcement | Large | Step 5, realistic restaurant ops |
| **P1** | Quick product availability toggle on `/products` | Small | Step 4 daily ops |
| **P2** | “Confirm order & notify customer” + fix notify checkbox copy | Small | Step 6 clarity |
| **P2** | Slot picker at checkout (after P0 schema) | Medium | Step 5 delivery times |
| **P3** | First-run onboarding wizard (login → theme → product → hours) | Medium | Steps 2–5 discoverability |
| **P4** | Full theme component registry | Large | Step 2 polish |

---

## Terminology cheat sheet

| Term in UI/docs | Means |
|-----------------|-------|
| **Storefront theme** (`themeKey`) | Visual template for public site (`saffron`, `classic`, …) |
| **CMS template** | Layout for a CMS page (`pageTemplates.ts`) |
| **CMS Menu** (`/cms/menus`) | Header/footer navigation links |
| **Menu items** (restaurant sidebar) | Products in `/products` |
| **Public menu API** | `GET /api/public/storefront/menu` |
| **Confirmation** | Order/booking status → `confirmed` + customer notification |

---

## File index (quick reference)

```
profixer-admin-frontend/
  src/pages/auth/                    # Step 1
  src/pages/settings/StorefrontSettingsPage.tsx   # Step 2
  src/pages/products/                # Steps 3–4
  src/pages/inventory/               # Step 4
  src/pages/orders/                  # Step 6
  storefront/themes/restaurant/saffron/   # Step 5 gap (hardcoded hours)

fixer-backend/
  src/modules/auth/                  # Step 1
  src/modules/storefront-studio/     # Step 2
  src/modules/products/              # Steps 3–4
  src/modules/orders/                # Step 6
  src/models/TenantStorefrontConfig.ts   # Step 5 schema extension point
```
