# Logistics & shipment — Product spec (feature vs vertical)

**Purpose:** Define what “shipment dashboard” means in ProFixer, how to onboard a **logistics / courier design partner** without building a full TMS, and when to add a new `logistics` vertical key.

---

## 1. Two meanings of “shipment dashboard”

| Interpretation | Buyer | What they need | ProFixer fit |
|----------------|-------|----------------|--------------|
| **A. Feature** | Retail / D2C tenant already on `retail` | Track order fulfillment, carrier AWB, delivery steps | Extend **Orders** (`src/pages/orders/`) — already has “shipment steps” copy |
| **B. Vertical** | Courier, 3PL, last-mile operator | Shipment-as-core-object, dispatch, POD, fleet | New pack + engagements — **partial fit in v1** |

**CEO rule:** Design partner in **courier/logistics** → treat as **B**, but **ship v1 as thin B** (status dashboard), not Delhivery.

---

## 2. v1 scope (thin logistics — “Pilot”)

### 2.1 In scope

| Capability | Description |
|------------|-------------|
| **Shipment list** | Searchable table: id, customer, origin, destination, status, dates |
| **Status workflow** | Manual + bulk update: `created` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered` / `failed` / `returned` |
| **Shipment detail** | Timeline, notes, attachments (POD photo upload) |
| **CRM** | Shipper accounts, B2B contracts |
| **Finance** | Invoice per shipment or consolidated billing |
| **Notifications** | Email/SMS templates on status change (existing notification stack) |
| **Reports** | Shipments per day, SLA %, failed delivery reasons |

### 2.2 Explicitly out of scope (Phase 2 — separate SOW)

| Capability | Why deferred |
|------------|--------------|
| Live GPS / map tracking | Requires maps SDK, device stream, cost |
| Route optimization | OR-Tools / third-party — new service |
| Driver mobile app | `apps/admin-mobile` is admin-focused; driver app is new product |
| Telematics / OBD hardware | Ops + support burden |
| Carrier API hub (Delhivery, BlueDart) | Integration project per carrier |
| Weight / volumetric rating engine | Pricing product |
| Customs / cross-border | Regulatory |

**Contract language:** *“Phase 1 provides operational visibility and billing; live tracking is Phase 2.”*

---

## 3. Vertical key strategy

### Option L1 — New `logistics` vertical (recommended at scale)

| Pros | Cons |
|------|------|
| Clear sales story `/for-logistics` | Requires backend `TENANT_VERTICAL_KEYS` + frontend `VerticalKey` |
| Dedicated sidebar & KPIs | Engineering to register pack |

### Option L2 — `b2b_services` or `retail` + module gate (fastest pilot)

| Pros | Cons |
|------|------|
| Onboard **today** without backend migration | Wrong industry label in UI |
| Reuse **Orders** UI patterns | Courier may perceive as “e-commerce admin” |

**Recommendation:**

- **Week 1 pilot:** Option L2 if logistics key not ready — tenant on `b2b_services`, modules: `crm`, `finance`, `ecommerce` (orders pattern).
- **Week 3+:** Option L1 when shipment screens stable.

---

## 4. Engagement model (logistics)

### 4.1 Primary type: `shipment`

| Status | Label | Terminal |
|--------|-------|----------|
| `created` | Created | no |
| `picked_up` | Picked up | no |
| `in_transit` | In transit | no |
| `out_for_delivery` | Out for delivery | no |
| `delivered` | Delivered | yes |
| `failed` | Failed | yes |
| `returned` | Returned to sender | yes |
| `cancelled` | Cancelled | yes |

```text
created → picked_up → in_transit → out_for_delivery → delivered
                              ↘ failed / returned / cancelled
```

### 4.2 Custom fields

| Field key | Label | Type |
|-----------|-------|------|
| `awb` | AWB / tracking number | string |
| `carrier` | Carrier | enum |
| `weight_kg` | Weight (kg) | number |
| `cod_amount` | COD amount (₹) | number |
| `pod_url` | Proof of delivery | file/url |
| `failure_reason` | Failure reason | enum |
| `customer_phone` | Receiver phone | string |
| `origin_pincode` | Origin PIN | string |
| `dest_pincode` | Destination PIN | string |

### 4.3 Optional child: `pickup_request`

For B2B shippers scheduling pickup — can be CRM activity in v1.

---

## 5. Shipment dashboard UX

### 5.1 List view columns (default)

- Shipment ID / AWB  
- Customer / consignee  
- Status (color from pack)  
- Origin → Destination (city or PIN)  
- Created at  
- Promised delivery  
- COD (₹)  
- Assigned driver (text field v1; workforce link v2)

### 5.2 Detail drawer sections

1. **Summary** — status, AWB, carrier  
2. **Parties** — shipper, consignee, addresses  
3. **Timeline** — status history (audit log)  
4. **Packages** — line items / weight  
5. **Payment** — COD collected, invoice link  
6. **POD** — image upload  
7. **Notes** — internal only  

### 5.3 Bulk actions

- Mark `in_transit`  
- Mark `delivered`  
- Export CSV for reconciliation  

---

## 6. Reuse from existing codebase

| Existing area | Logistics reuse |
|---------------|-----------------|
| `src/pages/orders/orders.tsx` | List/filter patterns, status updates |
| `OrderDetailDrawer.tsx` | “Payment & logistics” section pattern |
| CRM companies | Shipper accounts |
| Finance invoices | Per-shipment or monthly |
| Notifications | Status change templates |
| Reports shell | New report defs in pack |

**Reuse score:** ~45–55% for v1 thin product; ~20% if Phase 2 GPS included.

---

## 7. Sidebar (target `logistics` pack)

| Group | Items |
|-------|-------|
| Overview | Dashboard, Analytics |
| Operations | **Shipments**, Pickups (optional), Exceptions |
| Customers | CRM contacts & companies |
| Finance | Invoices, COD reconciliation, Expenses |
| Team | Dispatch board (v2), Chat |
| Settings | Carriers config (v2), Integrations |

---

## 8. Dashboard KPIs

| Widget | Label |
|--------|-------|
| `log_shipments_today` | Shipments created today |
| `log_delivered_today` | Delivered today |
| `log_sla_met_pct` | SLA met % |
| `log_failed_today` | Failed / returned today |
| `log_cod_pending` | COD pending collection (₹) |
| `log_avg_transit_hours` | Avg transit time |

---

## 9. Integrations roadmap

| Integration | Phase | Notes |
|-------------|-------|-------|
| CSV import | 1 | Daily shipment upload |
| Webhook outbound | 1 | Customer’s WMS receives status |
| WhatsApp status | 1.5 | Template messages |
| Delhivery / BlueDart API | 2 | Per-carrier |
| Google Maps embed | 2 | Last known location manual pin v1.5 |
| GPS device (Teltonika, etc.) | 3 | Enterprise |

---

## 10. Billing plans (proposed)

| Plan key | Name | Limits |
|----------|------|--------|
| `log_starter` | Dispatch Starter | 1,000 shipments/mo |
| `log_growth` | Dispatch Growth | 10,000 shipments/mo, webhooks |
| `log_scale` | Dispatch Scale | Custom, SLA |

Meter: **shipments created per month** (align with `Engagement` count in billing enforcement).

---

## 11. Relationship to retail “shipment steps”

Retail orders (`orders.tsx`) already support fulfillment language. **Do not duplicate** for retail tenants.

| Tenant vertical | Shipment UI |
|-----------------|-------------|
| `retail` | Order fulfillment tab (existing) |
| `logistics` | Standalone **Shipments** hub |
| `real_estate` | N/A |

If a retail customer asks for AWB tracking only → extend Order model, **not** new vertical.

---

## 12. Phased delivery

### Phase LOG-0 — Pilot (no new key)

- Tenant: `b2b_services` or `retail`  
- Manual process: orders or spreadsheet import  
- CRM + finance live  

### Phase LOG-1 — Shipment MVP (2–3 weeks)

- [ ] `ShipmentsListPage` + `ShipmentDetailDrawer`  
- [ ] Status API: `POST /api/shipments`, `PATCH .../status`  
- [ ] Pack engagement types OR vertical-agnostic `Engagement` with `type: shipment`  
- [ ] Dashboard widgets (logistics stub or dedicated pack)  

### Phase LOG-2 — Vertical key + pack

- [ ] Add `logistics` to `VerticalKey` + backend keys  
- [ ] `src/verticals/logistics/*`  
- [ ] `/for-logistics` marketing + signup  

### Phase LOG-3 — Paid Phase 2

- GPS, driver app, carrier APIs per SOW  

---

## 13. Acceptance criteria (LOG-1)

1. Operator can create shipment and walk full status path to `delivered`.  
2. POD image attaches and appears on detail.  
3. Failed shipment requires `failure_reason`.  
4. List exports CSV with AWB and status.  
5. Tenant isolation: shipment queries always scoped by `tenantId`.  
6. No home-services sidebar items visible when on logistics pack.

---

## 14. Risk: building too much

**Symptoms:** Engineering estimates > 6 weeks for v1; discussions about map tiles and driver GPS in week 1.

**Response:** Freeze scope to §2.1; move any map/GPS ask to Phase 2 quote.

---

## 15. Open questions

1. New `logistics` key vs extend `b2b_services` for 12 months?  
2. Shipments stored in new collection vs `orders` with `type: shipment`?  
3. Multi-hub courier — branches as locations in one tenant?

Record decisions in [`03-tenant-vertical-policy.md`](./03-tenant-vertical-policy.md) and [`05-implementation-checklist-engineering.md`](./05-implementation-checklist-engineering.md).
