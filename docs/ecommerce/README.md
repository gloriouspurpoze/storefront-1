# E-commerce — Documentation index

Specs for **Store / Orders / Products** inside fixer-admin (module: `ecommerce`).

---

## Current focus

**Delivery tracking on orders** — extend the existing Orders module; do **not** build a separate logistics vertical for D2C/retail.

| Doc | Description |
|-----|-------------|
| **[`01-delivery-tracking-spec.md`](./01-delivery-tracking-spec.md)** | Full feature spec: what exists, v1 scope, data model, UI, phases, acceptance criteria |
| **[`02-storefront-transactional-email.md`](./02-storefront-transactional-email.md)** | Branded order confirmation + status emails (SMTP + React Email, two-tier sending) |

---

## Related docs elsewhere

| Doc | Link |
|-----|------|
| Retail tenant onboarding | [`docs/saas/08-onboard-three-tenants-runbook.md`](../saas/08-onboard-three-tenants-runbook.md) § Noze Perfume |
| Retail billing plans | `src/verticals/retail/billingPlans.ts` |
| Logistics vertical (deferred) | [`docs/verticals/02-logistics-shipment-vertical-spec.md`](../verticals/02-logistics-shipment-vertical-spec.md) |
| Real estate expansion (separate track) | [`docs/verticals/01-real-estate-vertical-pack-spec.md`](../verticals/01-real-estate-vertical-pack-spec.md) |

---

## Code map

| Feature | Path |
|---------|------|
| Orders list | `src/pages/orders/orders.tsx` |
| Order detail drawer | `src/pages/orders/OrderDetailDrawer.tsx` |
| Orders API | `src/services/api/orders.service.ts` |
| Products / inventory | `src/pages/products/` |
| Route | `/orders` |

---

## Quick ops guide (today, no new code)

1. **Settings → Organizations** — tenant has `ecommerce` module (e.g. `retail` vertical).
2. **Orders** → filter **Fulfillment** = `processing` or use **Delivery queue** tab.
3. Open order → set **Carrier** + **AWB** → **Save delivery details** → **Apply status** → `shipped` (enable **Notify customer**).
4. **Bulk ship:** select processing orders → **Bulk ship** → enter AWBs → confirm.
5. Customers track at **`/orders/track`** on the storefront (order number + email).
6. **Export CSV** for carrier reconciliation.

Optional tenant setting (Mongo `Tenant.industrySettings`):

```json
{ "ecommerce": { "requireTrackingOnShip": true } }
```
