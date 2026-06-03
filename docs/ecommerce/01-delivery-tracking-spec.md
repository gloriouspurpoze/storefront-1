# E-commerce delivery tracking — Feature spec

**Type:** Small feature inside the existing **Store / Orders** module (`ecommerce`).  
**Not:** A new `logistics` vertical or standalone shipment product.  
**Audience:** Product, engineering, ops (retail / D2C tenants).

**Related code today:**

| Area | Path |
|------|------|
| Orders list | `src/pages/orders/orders.tsx` |
| Order detail + tracking | `src/pages/orders/OrderDetailDrawer.tsx` |
| Orders API client | `src/services/api/orders.service.ts` |
| Retail vertical | `src/verticals/retail/` |
| Route | `/orders` (`src/config/app-routes.ts`) |

---

## 1. Executive summary

**Yes — focus here first.** For tenants that **sell physical products** (e.g. `retail`, perfume/D2C, merch), delivery tracking belongs **on the order**, not in a separate logistics product.

You already have ~70% of v1:

- Fulfillment statuses: `pending` → `confirmed` → `processing` → `shipped` → `delivered`
- `trackingNumber`, `shippedAt`, `deliveredAt`, `estimatedDeliveryAt`
- Admin can save tracking and advance status in `OrderDetailDrawer`
- Orders list filters by fulfillment + payment; KPI cards for Shipped / Delivered

**The gap** is not “build shipment software” — it is **make delivery visible and operable at scale**: a delivery-focused view, carrier context, customer notification, and optional track link — all still on `Order`.

---

## 2. Who this is for

| Tenant profile | Vertical | Module |
|----------------|----------|--------|
| D2C brand (Noze Perfume, etc.) | `retail` | `ecommerce` |
| Restaurant selling packaged goods | `restaurant` | `ecommerce` (optional) |
| Home services selling parts/SKUs | `home_services` | `ecommerce` |

**Not for:** Courier companies shipping other people’s parcels → that stays in [`02-logistics-shipment-vertical-spec.md`](../verticals/02-logistics-shipment-vertical-spec.md) (deferred).

---

## 3. What exists today (inventory)

### 3.1 Order model (frontend)

From `orders.service.ts`:

```ts
trackingNumber?: string
shippedAt?: string
deliveredAt?: string
estimatedDeliveryAt?: string
status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
shippingAddress: Address
```

### 3.2 UI already shipped

| Capability | Where |
|------------|-------|
| Subtitle mentions “shipment steps” | `orders.tsx` PageHeader |
| Fulfillment filter + badges | Orders table |
| Shipped / Delivered KPIs | Stats row |
| Tracking number edit | OrderDetailDrawer → Operations |
| Status flow with notes | `ORDER_FLOW` in drawer |
| Ship / deliver timestamps display | Payment & logistics section |

### 3.3 Status flow (current)

```text
pending → confirmed → processing → shipped → delivered
         ↘ cancelled (before shipped)
shipped → delivered only
```

---

## 4. v1 scope — “Delivery tracking feature”

Goal: **Operators can run a delivery queue without opening every order drawer.**

### 4.1 In scope (v1)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Deliveries tab or filter preset** | One-click view: `processing` + `shipped` (orders awaiting ship / in transit) |
| 2 | **Tracking column on list** | Show AWB/tracking # in table (truncated + copy) |
| 3 | **Carrier + tracking URL** | Fields: `carrier` (enum), `trackingUrl` (optional auto-build from carrier template) |
| 4 | **Bulk mark shipped** | Select rows → enter tracking → status `shipped` |
| 5 | **Delivery timeline (read-only)** | Visual stepper on drawer: Placed → Confirmed → Processing → Shipped → Delivered |
| 6 | **Customer email/SMS on ship** | Trigger existing notification template with `{trackingNumber}`, `{trackingUrl}` |
| 7 | **CSV export includes tracking** | Add carrier + tracking columns to export |
| 8 | **Storefront order status (read-only)** | Customer sees “Shipped” + tracking link on my-orders (storefront) |

### 4.2 Out of scope (v1)

| Feature | Why defer |
|---------|-----------|
| Live GPS map | Logistics vertical / Phase 2 |
| Own fleet / driver assignment | Not e-commerce |
| Multi-parcel split shipments | v1.1 |
| Carrier API auto-sync (Delhivery, Shiprocket) | v1.2 integration |
| Returns / RTO workflow | Separate refund flow exists |
| New `/shipments` route | Duplicates orders; avoid until B2B courier use case |

---

## 5. Data model extensions (backend)

Extend **`Order`** document — do **not** create a separate `Shipment` collection for v1.

### 5.1 Proposed fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `carrier` | enum string | no | `manual`, `delhivery`, `bluedart`, `dtdc`, `indiapost`, `shiprocket`, `other` |
| `trackingUrl` | string | no | Full URL; if empty, UI may build from carrier + `trackingNumber` |
| `deliveryNotes` | string | no | Internal ops notes (distinct from customer `notes`) |
| `statusHistory` | array | no | `{ status, at, byUserId?, note? }[]` — append on each status PATCH |

Existing fields unchanged: `trackingNumber`, `shippedAt`, `deliveredAt`, `estimatedDeliveryAt`.

### 5.2 API changes

| Method | Path | Change |
|--------|------|--------|
| `PUT` | `/orders/:id` | Accept `carrier`, `trackingUrl`, `deliveryNotes` |
| `PATCH` | `/orders/:id/status` | Append `statusHistory`; set `shippedAt`/`deliveredAt` (likely already) |
| `GET` | `/orders` | Optional query `fulfillmentQueue=true` → status ∈ `{processing, shipped}` |
| `POST` | `/orders/bulk-ship` | `{ orderIds[], trackingNumber?, carrier?, trackingUrl? }` — v1.1 |

### 5.3 Carrier tracking URL templates (frontend helper)

| Carrier | URL pattern (example) |
|---------|------------------------|
| Delhivery | `https://www.delhivery.com/track/package/{awb}` |
| BlueDart | `https://www.bluedart.com/web/guest/trackdartresult?trackNo={awb}` |
| India Post | `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?{awb}` |
| Manual | User pastes full `trackingUrl` |

---

## 6. UI specification

### 6.1 Orders page (`orders.tsx`)

**Header:** Keep title **Orders**; add secondary tab or segmented control:

```text
[ All orders ] [ Delivery queue ] [ Delivered today ]
```

**Delivery queue** preset:

- `statusFilter`: processing OR shipped (backend filter or client OR)
- Default sort: oldest `processing` first

**Table — new columns (optional toggle):**

| Column | Source |
|--------|--------|
| Tracking | `order.trackingNumber` or “—” |
| Carrier | `order.carrier` badge |
| Est. delivery | `order.estimatedDeliveryAt` |

**Row quick action:** Truck icon → mini modal: tracking # + carrier → Save & mark shipped.

### 6.2 Order detail drawer

**Replace** flat “Payment & logistics” block with:

1. **Delivery stepper** (5 steps, current highlighted)
2. **Tracking card** — carrier select, tracking #, computed link “Open tracking ↗”
3. **Payment** — unchanged below separator

**Operations section:**

- When moving to `shipped`: require `trackingNumber` OR `trackingUrl` (tenant setting)
- Checkbox: “Email customer tracking info”

### 6.3 Dashboard (retail tenants)

Add optional KPI widgets to retail pack (`src/verticals/retail/dashboardWidgets.ts` when created):

- Orders awaiting shipment (`processing`)
- In transit (`shipped`)
- Delivered this week

---

## 7. Notifications

Use existing **Notification templates** (`NotificationTemplates.tsx`).

| Event | Template id (proposed) | Variables |
|-------|------------------------|-----------|
| Order shipped | `order_shipped` | `orderNumber`, `trackingNumber`, `trackingUrl`, `customerName` |
| Order delivered | `order_delivered` | `orderNumber`, `customerName` |

Trigger: backend on status PATCH to `shipped` / `delivered` if tenant flag `notifyCustomerOnShip === true`.

---

## 8. Storefront (customer-facing)

**Scope:** Minimal v1 — no map.

On **My orders** / order confirmation email:

- Status label (Shipped / Delivered)
- If `trackingUrl` or derivable link → **Track package** button

Storefront repo: extend order type in `storefront/lib/types.ts` when API returns new fields.

---

## 9. Permissions & modules

| Permission | Already exists? | Use |
|------------|-----------------|-----|
| `view_orders` | yes | See orders + delivery queue |
| `edit_orders` | yes | Update tracking, status |

Gate: tenant must have `ecommerce` in `featureModules`.

---

## 10. Phased delivery

### Phase DT-0 — Use what you have (zero code)

**Ops runbook for retail tenants today:**

1. Open **Orders** → filter Fulfillment = `processing`
2. Open order → enter **Tracking number** → **Next fulfillment step** = `shipped`
3. Export CSV for reconciliation

### Phase DT-1 — UX polish (3–5 days frontend + 2–3 days backend) — **SHIPPED**

- [x] Delivery queue tab (`fulfillmentQueue` API + UI tabs)
- [x] Tracking column + carrier select on drawer
- [x] `statusHistory` timeline in drawer
- [x] CSV export columns (carrier + tracking)
- [x] Backend fields: `carrier`, `trackingUrl`, `deliveryNotes`, `statusHistory`
- [x] Delivery stepper + carrier tracking URL helper (`src/lib/carrierTracking.ts`)

### Phase DT-2 — Notifications + storefront (3–5 days) — **SHIPPED**

- [x] Email/SMS templates on ship (`orderShipped`, `orderDelivered` HTML + EmailService)
- [x] Push notification includes AWB on shipped
- [x] `notifyCustomer` checkbox on admin status update (default on)
- [x] Require tracking before `shipped` (client + server; tenant `industrySettings.ecommerce.requireTrackingOnShip`)
- [x] Bulk ship API + admin UI (`POST /orders/bulk-ship`, BulkShipDialog)
- [x] Public track API `GET /public/storefront/orders/track`
- [x] Storefront `/orders/track` page + header link + checkout success CTA

### Phase DT-3 — Integrations (later)

- Shiprocket / Delhivery webhook
- Bulk ship CSV upload
- Split shipments

---

## 10. Acceptance criteria (DT-1)

- [ ] Delivery queue shows only `processing` + `shipped` orders
- [ ] Operator can set carrier + tracking without leaving drawer
- [ ] “Open tracking” opens correct URL for Delhivery/BlueDart when AWB set
- [ ] Status stepper reflects current `order.status`
- [ ] CSV export includes tracking + carrier
- [ ] Tenant isolation unchanged on all order APIs
- [ ] Works for `retail` tenant with `ecommerce` module only

---

## 11. Engineering checklist

### Frontend

| Task | File |
|------|------|
| Extend `Order` type | `orders.service.ts` |
| Delivery queue tabs | `orders.tsx` |
| Tracking column | `orders.tsx` |
| Carrier + URL fields | `OrderDetailDrawer.tsx` |
| Status stepper component | `src/components/orders/DeliveryStepper.tsx` (new) |
| Carrier URL helper | `src/lib/carrierTracking.ts` (new) |
| Retail dashboard KPIs | `src/verticals/retail/dashboardWidgets.ts` (optional) |

### Backend (fixer-backend)

| Task | Notes |
|------|-------|
| Order schema fields | `carrier`, `trackingUrl`, `statusHistory` |
| Validate on ship | Optional require tracking |
| `fulfillmentQueue` query | Filter processing + shipped |
| Notification hooks | On status change |

---

## 12. vs logistics vertical — decision tree

```text
Does the tenant SELL products on their own storefront?
  YES → E-commerce delivery tracking (this doc)
  NO  → Do they ship parcels for OTHER businesses?
          YES → Logistics vertical (deferred)
          NO  → CRM-only; no delivery feature
```

---

## 13. Example tenant: retail D2C

Reference: [`08-onboard-three-tenants-runbook.md`](../saas/08-onboard-three-tenants-runbook.md) — **Noze Perfume** (`retail`, `ecommerce` + `cms`).

After DT-1:

1. Customer places order on storefront  
2. Admin sees order in **Delivery queue**  
3. Admin packs box, enters Delhivery AWB, marks **shipped**  
4. Customer gets email with track link  
5. Admin marks **delivered** when courier confirms  

---

*Last updated: 2026-06-03 — current focus for “shipment dashboard” work.*
