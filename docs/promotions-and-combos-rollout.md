# Promotions, Combos, Cart Tiers & Founder Analytics — Rollout

Implementation reference for the five-phase promotion roadmap that was shipped
across **admin (`profixer-admin-frontend`)**, **backend (`fixer-backend`)** and
**customer site (`user-site-fixerwebapp`)**.

This is the single source of truth for what was built, where it lives, what the
APIs look like, and how to run/operate it.

---

## TL;DR

| Phase | What it does | Admin URL | API surface |
|-------|--------------|-----------|-------------|
| 1 | **Quantity combos** — coupon codes that require N items / specific services / categories | `/coupons` | `POST /coupons`, `POST /coupons/validate`, `POST /coupons/apply` |
| 2 | **Named bundle SKUs** — “AC Care Combo” tiles on customer catalog pages | `/marketing/service-combos` | `GET /service-combos/public`, admin CRUD `/service-combos` |
| 3 | **Cart spend-tier ladder** — auto-discount at ₹999 / ₹1999 / ₹2999 (configurable) | `/marketing/cart-tiers` | `GET/PUT /coupons/spend-tiers` |
| 4 | **Combo Performance analytics** — attach rate, incremental AOV, cannibalisation | `/finance/founder/combo-performance` | `GET /finance/founder/combo-performance` |
| 5 | **Server-side discount at booking create** — close client-trust gap | n/a | `POST /bookings` now resolves coupon + auto offer server-side |

All admin pages are also surfaced in the sidebar under
**Surfaces & promotions** → *Service bundles* / *Cart spend tiers*.

---

## Phase 1 — Quantity combos

### What changed

Coupons can now require multiple items, target specific services, and target
specific categories.

### Backend

- `src/models/Discount.ts`
  - `conditions.minItems`
  - `targetIds.services[]`, `targetIds.categories[]`
  - `calculateDiscount(amount, context?)` — takes a `DiscountContext` (items
    array) and enforces `minItems` + service/category targeting before
    returning a discount.
- `src/modules/coupons/services/CouponService.ts`
  - `validate({ code, subtotal, items, type })` — hydrates category ids from
    the service ids when not supplied.
  - `apply({ … })` carries items through to the booking apply path.
  - Returns specific combo-gate errors: `Add N more items to unlock this combo`, `Coupon does not apply to the services in your cart`, etc.
- `src/modules/coupons/repositories/CouponMongoRepository.ts` — persists
  `minItems` + `targetIds`.
- `src/types/coupon.types.ts` — `min_items`, `applicable_services`, `items[]`.

### Admin UI

- `src/pages/marketing/coupons.tsx`
  - New **Quantity combo** mode.
  - Quick presets (e.g. *2 AC services 15% off*, *Plumbing pack — buy any 3*).
  - Category + service targeting.
  - Service-level pinning is gated behind `manage_coupons`.

### Customer site

- Coupon input on checkout already exists. With Phase 5 below, codes are now
  resolved server-side, so the `min_items` / target rules are enforced by the
  API even if the client tries to bypass them.

---

## Phase 2 — Named bundle SKUs

### What changed

A new “bundle” concept — a fixed list of services with a single price (percent
off the catalog sum, flat ₹ off, or fixed bundle price). Bundles appear as
cards on the customer catalog page for the matching category. One tap adds
every service in the bundle to the cart.

### Backend

- `src/models/ServiceCombo.ts`
  - `items[]: { serviceId, variantId?, quantity, sortOrder }`
  - `pricingMode: 'percent_off_catalog' | 'fixed_price' | 'flat_off_catalog'`
  - `percentOff` / `fixedPrice` / `flatOff`
  - `categorySlug` (storefront placement)
  - `analytics: { views, clicks, bookings }`
- `src/modules/service-combos/`
  - `ServiceComboService.ts` — CRUD, `listPublic`, `enrichCombo` (attaches
    catalog price → derived `catalogSubtotal`, `bundlePrice`, `savings`).
  - `ServiceComboController.ts`, `routes/serviceCombos.ts`.
- Mounted in `src/routes/index.ts` as `router.use('/service-combos', …)`.

#### Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/service-combos/public?categorySlug=ac-repair&limit=12` | public | Storefront tiles |
| `POST` | `/service-combos/:id/click` | public | Analytics ping |
| `GET` | `/service-combos` | `view_coupons` | Admin list |
| `GET` | `/service-combos/:id` | `view_coupons` | Admin detail |
| `POST` | `/service-combos` | `manage_coupons` | Create |
| `PUT` | `/service-combos/:id` | `manage_coupons` | Update |
| `DELETE` | `/service-combos/:id` | `manage_coupons` | Delete |

### Admin UI

- `src/pages/marketing/service-combos.tsx`
  - Cards for every bundle: name, badge, bundle price, catalog savings, item
    count, category placement.
  - Create / edit form with pricing mode switch (% off / fixed / flat off),
    **catalog category dropdown** (service categories from the API — shows
    `Name (slug)` so placement matches `/services/{slug}` on profixer.in), optional
    custom slug for legacy keys, live “View on site” link, and a service picker
    filtered to the selected category.
- `src/services/api/service-combos.service.ts` — typed client.
- Sidebar: **Surfaces & promotions → Service bundles** (`/marketing/service-combos`).
- Linked from the **Coupons** page header.

### Customer site

- `src/shared/lib/api/service-combos.ts` — typed client.
- `src/components/features/service-catalog/ServiceComboBundles.tsx`
  - Loads bundles for the current category slug.
  - One-tap **Add bundle** → dispatches `addToCart` (or `addToGuestCart`) for
    every service line.
  - Fires `recordServiceComboClick` for the click analytics counter.
  - After adding, the button switches to **Added** (with a check icon and a
    small *Remove* affordance below it). The card itself gains a subtle ring
    to make the active state legible.
- `src/shared/lib/activeServiceBundles.ts`
  - Tiny `localStorage`-backed store + `useActiveServiceBundles` hook tracking
    which bundles are currently in the cart and how much each one saves.
  - `reconcileActiveBundlesWithCart(serviceIds)` auto-drops a bundle if the
    customer removed one of its services from the cart line items.
  - `clearActiveBundles()` is called from `app/checkout/page.tsx` on a
    successful checkout (both COD and pay-now paths).
- `src/app/services/catalog/[category]/ServiceDetails.tsx`
  - Renders `<ServiceComboBundles>` above the existing UC-style packages.
  - **The static UC package tiles only render when no API bundle exists for
    that category** (avoids a confusing duplicate list).
  - `onRemoveBundleLines` removes the matching cart lines when the user clicks
    *Remove* on an already-added bundle card.
- `src/app/checkout/page.tsx` + `src/components/features/checkout/OrderSummary.tsx`
  - Show a **Bundle savings** line inside the *Your savings* block, with the
    bundle name(s) shown in the tooltip.
  - `bundleSavings` is subtracted from `subtotal` for `finalTotal`,
    `orderTotalBeforeCredits`, and the pay-online 5% calculation.
  - The `POST /bookings` payload now carries `bundleIds: string[]` (first
    booking in a multi-category split), so server-side discount resolution can
    apply bundle savings authoritatively (see Phase 5).

---

## Phase 3 — Cart spend-tier ladder

### What changed

A single, always-on auto-discount that fires by **cart subtotal**, configured
as a ladder: spend ≥ ₹999 → save ₹100, ≥ ₹1999 → save ₹250, ≥ ₹2999 → save
₹500 (defaults, editable). The largest qualifying tier wins.

### Backend

- `src/models/Discount.ts`
  - `conditions.spendTiers[]: { minSpend, discountType: 'percentage' | 'fixed', discountValue }`
  - `calculateDiscount` picks the **highest** tier the cart qualifies for.
- `src/modules/coupons/services/CouponService.ts`
  - `getSpendTiers()` / `upsertSpendTiers()`.
  - Stored as a single discount document with `metadata.kind = 'cart_tier_ladder'`.
- Routes mounted **before** `/coupons/:id` so they don’t collide:

  | Method | Path | Auth |
  |--------|------|------|
  | `GET` | `/coupons/spend-tiers` | any authenticated user |
  | `PUT` | `/coupons/spend-tiers` | `manage_coupons` |

### Admin UI

- `src/pages/marketing/cart-tiers.tsx`
  - Active toggle.
  - Add / remove tiers with min-spend + discount type + amount.
  - “Save tiers” button.
- `src/services/api/coupons.service.ts` — `getSpendTiers` / `saveSpendTiers`.
- Sidebar: **Surfaces & promotions → Cart spend tiers** (`/marketing/cart-tiers`).
- Linked from the **Coupons** page header.

### Customer site

- No UI work needed — the tier is auto-applied by Phase 5 (booking create runs
  `DiscountService.calculateDiscounts`, which picks the best offer including
  the spend-tier ladder).

---

## Phase 4 — Combo Performance (Founder Finance)

### What changed

A new tab in **Founder Finance** that quantifies whether the promo / combo
spend is actually pulling extra rupees through the platform.

### Backend

- `src/modules/founder-finance/services/FounderFinanceService.ts`
  - `getComboPerformance({ from, to, tenantId })` — aggregates bookings:
    - `attachRatePercent = promoBookings / totalBookings`
    - `avgTicketWithPromo`, `avgTicketWithoutPromo`
    - `incrementalAov = withPromo − withoutPromo`
    - `totalDiscountGiven`
    - `estimatedCannibalisation = discount × cannibalisationAssumptionPercent` (default 35%)
    - `byPromoCode[] = { code, bookings, totalDiscount, avgTicket }`
- Route: `GET /finance/founder/combo-performance?from=…&to=…`
- Controller method added in `FounderFinanceController.ts`.

### Admin UI

- `src/pages/finance/founder/combo-performance.tsx`
  - Month picker (same shared component as the other Founder Finance tabs).
  - 4 KPI cards: Attach rate · Incremental AOV · Discount given · Est.
    cannibalisation.
  - “With promo” vs “without promo” ticket comparison card.
  - Sortable table of every promo code used in the period.
  - Help card explaining what the cannibalisation number means and a guard
    rail (“tune if it exceeds 40% of discount spend”).
- `src/types/founder-finance.types.ts` — `FounderComboPerformance`.
- `src/services/api/founder-finance.service.ts` — `getComboPerformance`.
- `src/pages/finance/founder/founder-finance-layout.tsx` — adds the tab.
- `src/App.tsx` — adds the route under `/finance/founder/combo-performance`.

---

## Phase 5 — Server-side discount at booking create

### What changed

The “Apply coupon **after** booking is created” flow on the customer site was
trust-broken: clients could send any `totalAmount` they wanted and only later
apply a coupon to a row that was already saved. We moved discount resolution
into `POST /bookings` itself.

### Backend

- `src/modules/bookings/services/BookingServiceMongo.ts`
  - After `resolvedServices` is built (line items with real catalog prices),
    `resolveWebCheckoutDiscounts()` calls
    `DiscountService.calculateDiscounts({ subtotal, items, couponCode, type: 'booking' })`.
  - `resolveBundleDiscounts()` (new) processes any `data.bundleIds[]`:
    - Looks up each `ServiceCombo` and verifies **every** required service is
      actually present in `resolvedServices` at the catalog quantities.
    - Computes `catalogSum` from server-side line prices, applies the bundle’s
      pricing mode (`percent_off_catalog` / `fixed_price` / `flat_off_catalog`)
      and adds `catalogSum − bundlePrice` to `manualDiscountAmount`.
    - Stores `appliedBundleIds` + `appliedBundleNames` on the booking and
      `$inc`s `usageCount` and `analytics.bookings` on every applied combo so
      Phase 4 (Founder → Combo Performance) gets real numbers.
    - A hand-crafted `bundleIds` array without the matching cart lines is
      silently dropped (no error, no discount) — server stays authoritative.
  - Persists on the booking:
    - `couponCode`, `couponId`, `couponDiscountAmount`
    - Auto-offer discount and bundle savings are added to `manualDiscountAmount`
    - `appliedBundleIds[]`, `appliedBundleNames[]`
  - Calls `Discount.incrementUsage` / `markOfferUsed` after the booking is
    created.
  - When the customer sends a coupon code that fails server-side validation
    we throw **`Coupon is not valid for this cart`** instead of silently
    accepting it.
- `src/models/Booking.ts`
  - New persisted fields `appliedBundleIds` (`ObjectId[]` → `ServiceCombo`) and
    `appliedBundleNames` (`string[]`) for auditability + Combo Performance.
- `src/modules/bookings/types.ts` + `src/core/middleware/validation.ts`
  - `CreateBookingRequest.bundleIds?: string[]` (Joi: max 10 hex ObjectIds).
  - The strict `totalAmount` equality check was intentionally relaxed — web
    checkout `totalAmount` includes member discounts, visit fee, tip, and
    wallet credits that the server doesn’t fully model in one pass, so a hard
    equality check would block legitimate checkouts. The fields the server
    *does* resolve (coupon + auto offer) are now authoritative.
  - POS path: `assertPosCheckoutPricing` now passes `items` into coupon
    validation so quantity-combo rules apply at the front desk too.
- `src/services/DiscountService.ts`
  - `buildDiscountContext` constructs `DiscountLineItem[]` (with quantities),
    so model-level `calculateDiscount(subtotal, context)` enforces target
    services / categories / min-items consistently for offers and coupons.

### Customer site

- `src/shared/state/slices/bookingsSlice.ts`
  - `createBooking` now forwards `couponCode` in the POST body (was being
    silently dropped before).
- `src/app/checkout/page.tsx`
  - Every `bookingPayload` passes `bookingCouponFields(appliedCoupon, couponCode)`.
  - After the booking comes back, we only fall back to the legacy
    `applyCoupon` thunk if `bookingHasServerPromo(booking)` is `false` (i.e.
    the server didn’t resolve a discount, e.g. older backend or product
    order). This avoids double counting.

---

## File map by repo

### `profixer-admin-frontend`

```
src/
  App.tsx                                       # routes for cart-tiers, service-combos, combo-performance
  components/layout/sidebar.tsx                 # nav entries for bundles + spend tiers
  lib/founderFinanceMath.ts                     # full unit-economics breakdown (visit fee, platform fee, etc.)
  pages/
    marketing/
      coupons.tsx                               # Quantity combo mode + links to bundles/tiers
      cart-tiers.tsx                            # NEW — spend tier ladder editor
      service-combos.tsx                        # NEW — bundle SKU CRUD
    finance/founder/
      combo-performance.tsx                     # NEW — Phase 4 tab
      founder-finance-layout.tsx                # adds Combo Performance tab
  services/api/
    coupons.service.ts                          # getSpendTiers / saveSpendTiers
    founder-finance.service.ts                  # getComboPerformance
    service-combos.service.ts                   # NEW — bundle client
  types/founder-finance.types.ts                # FounderComboPerformance
```

### `fixer-backend`

```
src/
  models/
    Discount.ts                                 # minItems, targetIds, spendTiers, calculateDiscount(amount, context)
    ServiceCombo.ts                             # NEW — bundle model
    TenantCommercialTerms.ts                    # adds visitingFeeFixed (industry-style unit economics)
  modules/
    coupons/                                    # validate/apply/getSpendTiers/upsertSpendTiers
    service-combos/                             # NEW — controller, routes, service
    founder-finance/                            # getComboPerformance + route + controller method
    bookings/services/BookingServiceMongo.ts    # resolveWebCheckoutDiscounts at create time
  services/DiscountService.ts                   # buildDiscountContext / calculateDiscounts
  routes/index.ts                               # registers /service-combos
```

### `user-site-fixerwebapp`

```
src/
  app/
    checkout/page.tsx                           # passes couponCode in bookingPayload; skips legacy apply when server applied
    services/catalog/[category]/ServiceDetails.tsx  # renders ServiceComboBundles; hides UC static cards when API bundles exist
  components/features/service-catalog/
    ServiceComboBundles.tsx                     # NEW — bundle cards
    index.ts
  shared/
    lib/api/service-combos.ts                   # NEW — public bundle client
    state/slices/bookingsSlice.ts               # forwards couponCode to POST /bookings
```

---

## Operating the system

### Recommended “first hour” setup

1. **Cart tier ladder** (one minute)
   - `Sidebar → Surfaces & promotions → Cart spend tiers`
   - Save the defaults (₹999/₹1999/₹2999) → toggle **Active**.
2. **One quantity combo** (two minutes)
   - `Sidebar → Surfaces & promotions → Coupons & promo codes`
   - Code `AC2OFF`, mode **Quantity combo**, target *AC Service* category,
     `min_items = 2`, 15% off.
3. **One named bundle** (three minutes)
   - `Sidebar → Surfaces & promotions → Service bundles → New bundle`
   - Name `AC Care Combo`, pricing **% off catalog sum**, percent 15.
   - Pick 2 AC services. Save → it instantly shows up on the AC catalog page.
4. **Watch it work**
   - After a day, open `Finance → Founder → Combo Performance` to see attach
     rate, incremental AOV and the by-code breakdown.

### Permissions cheat sheet

| Capability | Permission |
|------------|------------|
| View coupons / bundles / tiers | `view_coupons` |
| Create / edit / delete bundles, tiers, coupons | `manage_coupons` |
| Configure service-level coupon targeting | `manage_coupons` |
| Read combo performance | `view_finance` |

### What the customer sees

- **Catalog page** (e.g. `/services/ac-repair`): combo bundle cards rendered
  by `ServiceComboBundles`. **Add bundle** drops every line into the cart.
- **Static UC packages**: still rendered if (and only if) no API bundle is
  configured for that category — so old marketing copy never disappears
  unexpectedly.
- **Checkout**: coupon input works the same way, except the discount is now
  resolved on the booking-create call (you can see it on the returned
  booking record: `couponCode`, `couponDiscountAmount`, `manualDiscountAmount`).

---

## Smoke-test checklist

1. **Bundles**
   - Admin: create a bundle on slug `ac-repair`.
   - Customer: open `/services/ac-repair`, click **Add bundle** → cart has all
     services with the right quantities.
2. **Spend tier**
   - Add items totalling > ₹999 to the cart and check out **without** a
     coupon. The booking response should have a non-zero
     `manualDiscountAmount` from the auto-offer.
3. **Quantity combo**
   - Configure `AC2OFF` with `min_items = 2`. With one AC service in the
     cart, the code should be rejected; add a second → discount applies; the
     booking response has `couponCode = 'AC2OFF'` and a `couponDiscountAmount`.
4. **Combo Performance**
   - After at least one promo booking exists, open
     `Finance → Founder → Combo Performance` for the current month — attach
     rate and the by-code row should both be populated.
5. **Trust gap**
   - Try to submit a booking with a forged low `totalAmount` and a coupon
     code — the API still applies the *real* server-computed coupon discount
     (not the client one), so the saved booking always reflects the true
     promo math.

---

## Known follow-ups (not in scope here)

- Storefront does not yet render the live spend-tier ladder on the cart
  preview (it would require a new
  `POST /coupons/preview-discount?subtotal=…` endpoint or a cart-discount
  preview). For now the discount only materialises on the booking record.
- `service-combos` analytics (`views`, `clicks`, `bookings`) only currently
  count clicks. Wire `views` from `listPublic` and `bookings` from
  `BookingService` if you want richer reporting.
- The cannibalisation assumption (default 35%) is a constant. Once enough
  historical data exists, replace with a real counterfactual estimate.

---

## Why this matters

The “Urban Company” promo playbook isn’t just discount codes — it’s **three
overlapping levers** working together:

- **Quantity combos** turn one-off visits into multi-service baskets.
- **Named bundles** are merchandised on the catalog page, so customers see
  the offer *before* they have to enter a code.
- **Spend tiers** lift average order value silently — the customer doesn’t
  even have to know about them.
- **Combo Performance** turns those three knobs into measurable ROI.
- **Server-side at booking create** keeps the platform honest — the booking
  record is the truth, not the client total.

Together they’re the difference between “we run promos when we feel like it”
and “we operate promotions like an industrial business unit”.
