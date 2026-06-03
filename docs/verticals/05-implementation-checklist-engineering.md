# Engineering checklist — Real estate & logistics packs

**Audience:** Frontend + backend engineers.  
**Tracks:** RE (real estate), LOG (logistics).  
**Sync rule:** Every new `VerticalKey` must match `fixer-backend/src/core/tenant/verticalKeys.ts`.

---

## 0 · Shared prerequisites

| Task | Repo | Done |
|------|------|------|
| Confirm `real_estate` in backend `TENANT_VERTICAL_KEYS` | fixer-backend | ☐ |
| Add `logistics` to backend keys (LOG-2 only) | fixer-backend | ☐ |
| Add `logistics` to `src/verticals/core/types.ts` `VerticalKey` | fixer-admin | ☐ |
| Update `ALL_VERTICAL_KEYS` array | fixer-admin | ☐ |
| Register pack in `src/verticals/registry.ts` | fixer-admin | ☐ |
| Add `VERTICAL_PACK_OPTIONS` ordering | fixer-admin | ☐ |
| Storefront `VerticalKey` union if used | storefront | ☐ |
| Pack validation tests | `src/verticals/__tests__/` | ☐ |
| Human test scenarios | `docs/saas/07-human-test-plan.md` | ☐ |

---

## 1 · Real estate (RE-1)

### 1.1 Frontend — new files

```
src/verticals/real_estate/
├── sidebarManifest.ts      # Replace HS sidebar
├── dashboardWidgets.ts     # 6 KPIs from spec 01
├── engagement.ts           # viewing status machine
├── billingPlans.ts         # re_starter / re_growth / re_scale
└── packExtras.ts           # optional: compliance, reports
```

### 1.2 Frontend — modify

| File | Change |
|------|--------|
| `src/verticals/registry.ts` | `import { realEstatePack }` — remove `buildGenericVerticalPack` for RE |
| `src/lib/engagementStatusAliases.ts` | Viewing API status aliases if backend uses legacy booking codes |
| `src/pages/settings/PlatformTenantsPage.tsx` | Plans from `re_*` when vertical = real_estate |
| `src/hooks/useVerticalPlans.ts` | No change if pack exports `billingPlans` |
| `src/App.tsx` | Routes for `/viewings` if new page (optional RE-1.1) |

### 1.3 Frontend — optional pages (RE-1.1)

| Page | Route | Purpose |
|------|-------|---------|
| Viewings list | `/operations/viewings` | Engagement list |
| Properties | `/catalog/properties` | Listing CRUD |

### 1.4 Backend

| Task | Notes |
|------|-------|
| `Tenant.verticalKey = real_estate` validation | Already if key listed |
| Viewing endpoints | `POST/GET/PATCH /api/viewings` or extend bookings with `type: viewing` |
| Filter bookings/engagements by `verticalKey` | Prevent HS statuses on RE tenant |
| Seed script | Sample listings + deals for demo tenant |
| Plans `re_*` in `verticalPlans.ts` | Mirror frontend `billingPlans.ts` |

### 1.5 Acceptance (RE-1)

- [ ] Sidebar has no AMC, providers, platform-services for `real_estate` tenant.
- [ ] Dashboard KPI row uses RE widgets only.
- [ ] Viewing status transitions validated server-side.
- [ ] `verticalPacks.test.ts` includes `real_estate` manifest validation.
- [ ] Signup wizard sets `verticalKey: real_estate` from `/for-real-estate`.

---

## 2 · Logistics (LOG-1 thin MVP)

### 2.1 Decision gate

| Question | Decision | Date |
|----------|----------|------|
| New `logistics` key in pilot? | Y/N | |
| Store shipments in `orders` vs `shipments` collection? | | |

### 2.2 Frontend — new files (LOG-1)

```
src/pages/shipments/
├── shipments.tsx              # List + filters
├── ShipmentDetailDrawer.tsx   # Timeline, POD
└── UpdateShipmentStatusModal.tsx

src/verticals/logistics/       # LOG-2 — or stub until then
├── sidebarManifest.ts
├── dashboardWidgets.ts
├── engagement.ts              # shipment statuses
└── billingPlans.ts
```

### 2.3 Frontend — modify

| File | Change |
|------|--------|
| `src/config/app-routes.ts` | Register `/operations/shipments` |
| `src/lib/buildAdminSidebar.ts` | Map pack item to route |
| `src/services/api/*` | `shipments.service.ts` |
| `src/verticals/registry.ts` | logistics pack when LOG-2 |

### 2.4 Backend

| Task | Notes |
|------|-------|
| `Shipment` schema | `tenantId`, `awb`, `status`, addresses, `cod_amount`, `pod_url`, `timeline[]` |
| Status PATCH | Validate state machine from spec 02 |
| List + pagination | Tenant-scoped index `(tenantId, status, createdAt)` |
| CSV export | `GET /api/shipments/export` |
| Audit log | Append on each status change |

### 2.5 Acceptance (LOG-1)

- [ ] Full status path to `delivered` works.
- [ ] `failed` requires `failure_reason`.
- [ ] POD upload stored and URL on detail.
- [ ] 402 / limit hook if monthly shipment cap exceeded (when plans exist).
- [ ] Tenant isolation audit passes.

---

## 3 · Logistics (LOG-2 vertical key)

| Task | Done |
|------|------|
| `logistics` in `VerticalKey` + backend | ☐ |
| Full `src/verticals/logistics/` pack | ☐ |
| Marketing `VerticalLandingPage` slug `for-logistics` | ☐ |
| `storefront` coming-soon theme line | ☐ |
| Remove pilot tenant from `b2b_services` migration script | ☐ |

---

## 4 · Phase 2 (do not implement in RE-1 / LOG-1)

| Feature | Track |
|---------|-------|
| GPS map + live location | LOG-3 |
| Driver React Native app | LOG-3 |
| Route optimization service | LOG-3 |
| Delhivery / BlueDart APIs | LOG-3 |
| RERA automated compliance | RE-3 |
| Commission automation | RE-2 |

---

## 5 · Testing matrix

| Scenario | Role | Vertical |
|----------|------|----------|
| Create viewing, complete | Org admin | real_estate |
| CRM deal won | Sales | real_estate |
| Create shipment → deliver | Dispatcher | b2b_services / logistics |
| COD invoice | Finance | logistics |
| Module gate hides ecommerce | Org admin | real_estate |
| Plan nudge at shipment limit | Org admin | logistics |

---

## 6 · Deployment order

```text
1. Backend: viewing OR shipment APIs (feature flag)
2. Frontend: RE-1 pack (no broken sidebar for existing RE stubs)
3. Ops: migrate acme-properties training
4. Backend: shipment APIs
5. Frontend: shipments pages
6. Frontend: LOG-2 logistics pack + marketing
```

---

## 7 · Documentation updates after ship

| Doc | Update |
|-----|--------|
| `docs/saas/README.md` | Implementation status table |
| `docs/saas/08-onboard-three-tenants-runbook.md` | Add RE + logistics rows |
| `docs/verticals/README.md` | Status snapshot |
| `packages/README.md` | If extracting packs to monorepo package |

---

## 8 · Estimate (indicative)

| Track | Engineering days (1 full-stack) |
|-------|--------------------------------|
| RE-1 pack (sidebar + dashboard + engagement types) | 5–8 |
| RE-1.1 viewings page + API | 5–7 |
| LOG-1 shipments (UI + API) | 8–12 |
| LOG-2 vertical key + marketing | 2–3 |

**Total sequential:** ~4–6 weeks one engineer. Parallel RE + LOG: add 30% coordination overhead.

---

*Cross-reference specs: [`01-real-estate-vertical-pack-spec.md`](./01-real-estate-vertical-pack-spec.md), [`02-logistics-shipment-vertical-spec.md`](./02-logistics-shipment-vertical-spec.md).*
