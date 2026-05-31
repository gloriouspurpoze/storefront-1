# Admin-controlled checkout knobs (online pay + visit fee)

This page covers two related admin controls on **Operations → Commercial → Terms**:

1. **Online payment master switch (Razorpay)** — section below.
2. **Visit / delivery fee + free-tier threshold** — see "Visit / delivery fee policy" at the end.

---

# Online payment master switch (Razorpay) — admin-controlled

Where it lives in admin: **Operations → Commercial → Terms** → top card "Customer payment methods".

A single toggle (`onlinePaymentEnabled`) and an optional short reason field control whether
the customer web app's "Online pay" tile (Razorpay — UPI, cards, net banking, wallets) is
offered at checkout. Flip it off whenever you need to route every booking to
pay-after-service: gateway outage, settlement holiday, KYC re-verification, etc.

## What "off" does end-to-end

1. **Admin → backend**: `PATCH /api/operations-commercial/terms` with
   `{ onlinePaymentEnabled: false, onlinePaymentDisabledReason?: string }`.
   Persisted on the `TenantCommercialTerms` row (per-tenant or global when no tenant header).
2. **Customer site**: `GET /api/public/commerce/checkout-terms` now returns
   `onlinePaymentEnabled` + `onlinePaymentDisabledReason` alongside fee fields.
   The checkout page polls this and:
   - hides the Razorpay tile in `CheckoutPaymentMethodModal` (rendered as a locked card
     with the admin-set reason shown next to it),
   - flips any pre-selected `pay_now` state to `pay_later`,
   - removes the 5% online-pay discount preview (`payNowDiscount` becomes 0 when
     `paymentMethod !== 'pay_now'`),
   - blocks the Razorpay flow on `handlePlaceOrder` with a toast using the admin reason.
3. **Backend defense in depth**: `BookingServiceMongo.createBooking` re-reads the same
   `TenantCommercialTerms` row and rejects `paymentMethod === 'pay_now'` web-checkout
   bookings when the flag is off (the toast text reuses the admin reason). POS / staff
   bookings are not gated since reception may still take a UPI / card payment in person.

## Files touched (jump links)

Backend (`homeservice_monolotic/fixer-backend`)

- `src/models/TenantCommercialTerms.ts` — new fields `onlinePaymentEnabled` (boolean, default true) and `onlinePaymentDisabledReason` (≤200 chars).
- `src/modules/operations-commercial/services/OperationsCommercialService.ts` — `defaultsTerms()` / `toTermsDto()` / `patchTerms()` now read & write the new fields.
- `src/routes/commerce-public.ts` — `GET /public/commerce/checkout-terms` exposes the flag publicly.
- `src/modules/bookings/services/BookingServiceMongo.ts` — refuses `pay_now` web-checkout bookings when flag is off.

Admin (`profixer-admin-frontend`)

- `src/types/operating-commercial.types.ts` — DTO additions.
- `src/pages/operations/operations-commercial-terms.tsx` — new top card with a `Switch` + reason `Input`.

Customer (`user-site-fixerwebapp`)

- `src/shared/lib/api/commerce.ts` — terms type extended; default-true on unknown response shapes.
- `src/components/features/checkout/CheckoutPaymentMethodModal.tsx` — locked "Online pay" tile + reason hint.
- `src/app/checkout/page.tsx` — always fetches terms (even on product-only carts), auto-flips `paymentMethod` to `pay_later`, blocks the Razorpay path on `handlePlaceOrder`.

## Operating playbook

- **Reason copy**: keep it short and reassuring; it lands on the disabled checkout tile.
  Good: "Online pay paused while we upgrade the gateway. UPI / cards return in a few hours."
  Avoid: long apologies, error codes.
- **Toggling back on**: the customer site refetches terms on every checkout page mount
  and whenever the after-hours / subtotal inputs change, so no cache flush is needed —
  customers see the tile reappear on their next page load.
- **POS impact**: staff-driven bookings (`data.posPricing` present) are NOT gated. Only
  the public web-checkout flow is locked when the switch is off.
- **Existing pay-now retry links**: invoice retry links that already created a pending
  Razorpay order continue to work since the gating is at booking-create. To kill those
  too, also disable the gateway in Razorpay's dashboard.

## Permissions

- View: `view_operating_terms`
- Edit / save: `manage_operating_terms`

Same RBAC as the rest of the commercial-terms page.

---

# Visit / delivery fee policy — admin-controlled

Two fields on the same Operations → Commercial → Terms page now drive the customer
storefront's visit-fee math (previously hardcoded to ₹56 / free at ₹500):

- **Visit / delivery fee — flat (₹)** → `visitingFeeFixed`
- **Free visit / delivery threshold (₹)** → `freeVisitThresholdRupees`

The customer site reads both from the same public endpoint as the online-pay
flag (`GET /api/public/commerce/checkout-terms`). Empty / 0 on either field
makes the storefront fall back to its built-in defaults (₹56 / ₹500) so an
older backend never breaks the cart.

## What the storefront does with these

`useVisitFeeConfig()` is a tiny hook (`shared/lib/useVisitFeeConfig.ts`) that
fetches the public terms once per minute (module-level promise cache) and
returns `{ visitingFeeFixed, freeVisitThresholdRupees }`. Four surfaces
consume it via `getVisitFee(kind, subtotal, config)`:

- `CartSidebar` — the booking-cart rail on every catalog page.
- `/cart` — the full cart page.
- `/checkout` — the checkout summary (services + product / mixed branches).
- `CartPaymentSummary` — the cart-page payment breakdown card.

All four surfaces share `getVisitFee`'s output (`fee`, `fullFee`, `threshold`,
`amountToFreeTier`, `progressPercent`, `label`) so the "Add ₹X more for free
visit" nudge and the "You unlocked FREE visit — saved ₹Y" badge stay aligned
no matter where the user is in the funnel.

## Why a `fullFee` field exists

When the cart unlocks the free tier, `fee` drops to 0 — but the UI still wants
to say "saved ₹56". `VisitFeeResult.fullFee` carries the pre-waiver amount so
that copy renders correctly with admin-driven numbers (e.g. "saved ₹75" if
admin set the fee to ₹75).

## Files touched

Backend (`homeservice_monolotic/fixer-backend`)

- `src/models/TenantCommercialTerms.ts` — added `freeVisitThresholdRupees` (visitingFeeFixed already existed).
- `src/modules/operations-commercial/services/OperationsCommercialService.ts` — DTO + PATCH wiring for the new threshold field.
- `src/routes/commerce-public.ts` — `publicTermsPayload` now exposes both `visitingFeeFixed` and `freeVisitThresholdRupees`.

Admin (`profixer-admin-frontend`)

- `src/types/operating-commercial.types.ts` — type extended.
- `src/pages/operations/operations-commercial-terms.tsx` — renamed "Visiting / inspection fee" → "Visit / delivery fee — flat"; sharpened FieldHint so ops understands this is now the live customer number; new threshold input directly beneath it.

Customer (`user-site-fixerwebapp`)

- `src/shared/lib/api/commerce.ts` — added `visitingFeeFixed` and `freeVisitThresholdRupees` to `CheckoutCommercialTerms` with safe default-on-missing parsing.
- `src/shared/lib/visitFee.ts` — refactored to accept an optional `config` arg, exposes `fullFee` in the result, renamed legacy constants to `DEFAULT_*` (legacy names kept as aliases).
- `src/shared/lib/useVisitFeeConfig.ts` — new module-level cached hook (60s TTL).
- `src/app/checkout/page.tsx`, `src/app/cart/page.tsx`, `src/components/features/service-catalog/CartSidebar.tsx`, `src/components/features/cart/CartPaymentSummary.tsx` — all four surfaces now read live admin values.

## Operating playbook

- **Match the cart-tier ladder**: keep `freeVisitThresholdRupees` ≥ the lowest
  cart-tier discount step so the customer doesn't see a tier discount + free
  visit kicking in at totally different subtotals — that pattern reads as
  inconsistent and harms trust.
- **Going free permanently**: set `visitingFeeFixed = 0`. The row disappears
  entirely on the storefront (`getVisitFee` returns `applies: true` but
  `fee: 0` — UI hides the nudge).
- **Going free for all carts**: set `freeVisitThresholdRupees = 1`. Any cart
  ≥ ₹1 is over the threshold → `fee = 0`. (₹0 is treated as "fallback to
  default", not "never waive".)
- **Cache TTL**: customer site refetches at most once per 60s; live changes
  reach customers within that window across all four surfaces.

