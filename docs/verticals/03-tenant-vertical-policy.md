# Tenant ↔ vertical policy — Decision record

**Status:** Draft — requires CEO sign-off before engineering Phase LOG-2 / multi-vertical hotels.  
**Related:** [`docs/saas/01-vertical-pack-architecture.md`](../saas/01-vertical-pack-architecture.md) §1.2, §13 Q4.

---

## 1. Definitions (do not conflate)

| Term | Definition | Example |
|------|------------|---------|
| **Tenant** | One paying organization; isolation boundary | `acme-brokers`, `swift-courier` |
| **Vertical (`verticalKey`)** | Industry pack: sidebar, statuses, KPIs, default modules | `real_estate`, `logistics` |
| **Plan (`planKey`)** | Commercial tier within a vertical | `re_growth`, `log_starter` |
| **Module (`featureModules`)** | API/UI entitlement | `crm`, `ecommerce`, `finance` |

**“Real estate tenant”** = a **tenant** whose `verticalKey` is `real_estate`.  
**Not:** a renter/resident end-user (that would be a **customer** record in CRM).

---

## 2. The decision

Choose **one** model for production SaaS:

### Model A — Strict one vertical per tenant (recommended default)

```text
Tenant.verticalKey = 'real_estate'   // immutable after create
Tenant.additionalVerticals = undefined
```

| Pros | Cons |
|------|------|
| Simple sidebar, billing, support | Hotel with restaurant + spa needs two tenants or modules hack |
| Matches current `getVerticalPack(tenant.verticalKey)` | Cannot upsell second vertical without migration |
| Clear marketing (`/for-real-estate`) | |

**Enforcement:**

- `verticalKey` set at org create; **PATCH blocked** except super-admin migration tool.
- UI never shows vertical switcher.
- Plans filtered by single `verticalKey`.

### Model B — Primary + additional verticals

```text
Tenant.verticalKey = 'restaurant'
Tenant.additionalVerticals = ['salon']
```

| Pros | Cons |
|------|------|
| One bill for multi-business campus | Sidebar needs vertical switcher or merged nav |
| Upsell second pack | Engagement `verticalKey` on each record; complex RBAC |
| | Billing: which plan applies? |

**Enforcement:**

- `visible(feature)` = union of packs’ features.
- User session may need `activeVertical` in Redux.
- Per-engagement `verticalKey` required on all operational records.

### Model C — Modules only (no new vertical keys)

Use `home_services` or `b2b_services` + enable `crm`, `ecommerce`, `finance` without new pack.

| Pros | Cons |
|------|------|
| Fastest pilot | Weak positioning; wrong KPIs on dashboard |
| No backend key change | Sales cannot say “logistics product” |

**Use for:** 2-week logistics pilot only — exit to Model A + `logistics` key when MVP validated.

---

## 3. Recommendation for real estate + logistics design partners

| Customer | Recommended model | `verticalKey` |
|----------|-------------------|---------------|
| Real estate brokerage | **A** | `real_estate` |
| Courier / 3PL (pilot) | **C** → migrate to **A** | `b2b_services` then `logistics` |
| Future hotel (restaurant + spa) | **B** or two tenants | Defer until first paying hotel |

**CEO action:** Sign Model **A** as platform default; approve Model **C** only for logistics week-1 pilot with written migration date.

---

## 4. Immutability rules

| Field | Mutable? | Who can change |
|-------|----------|----------------|
| `verticalKey` | **No** (normal ops) | Super-admin migration script only |
| `planKey` | Yes | Billing webhook + admin Manage |
| `featureModules` | Yes | Admin Manage (within plan limits) |
| `slug` | No after create | — |

**Why:** Changing `real_estate` → `home_services` leaves orphan engagements, wrong statuses, and broken reports.

---

## 5. Migration between verticals (exception path)

If a customer truly must switch:

1. Export data (CRM, finance, documents).  
2. Create **new tenant** with target `verticalKey`.  
3. Import via scripts; map engagement statuses manually.  
4. Deactivate old tenant (do not delete for audit).  

**Do not** flip `verticalKey` in place without migration runbook.

---

## 6. Multi-location vs multi-vertical

| Need | Solution under Model A |
|------|-------------------------|
| Brokerage with Mumbai + Delhi offices | One tenant; CRM filters by `branch` custom field |
| Courier with two hubs | One tenant; `origin_hub` on shipment |
| Restaurant chain + separate salon brand | **Two tenants** OR Model B (later) |

---

## 7. Billing interaction

```text
visible(module) =
    pack(verticalKey).defaultModules
  ∩ plan(planKey).includedModules
  ∩ tenant.featureModules (if allowlist set)
  ∩ user.permissions
```

Under Model B, extend to:

```text
visible(module) =
    ⋃ pack(v).modules for v in [verticalKey, ...additionalVerticals]
  ∩ ...
```

Document chosen formula in backend `requireTenantFeature` when Model B ships.

---

## 8. Storefront and custom domains

- One custom domain → one tenant → one primary `verticalKey`.  
- Storefront theme reads `verticalKey` for template (`storefront/lib/types.ts`).  
- Model B may need subdomain per vertical (`eat.hotel.com`, `spa.hotel.com`) — **out of v1 scope**.

---

## 9. Sign-off block

| Role | Model chosen | Date | Notes |
|------|--------------|------|-------|
| CEO | A / B / C | | |
| Eng lead | | | Backend impact |
| Ops | | | Onboarding SOP |

---

## 10. After sign-off

- Update [`04-onboarding-runbook-real-estate-logistics.md`](./04-onboarding-runbook-real-estate-logistics.md) with chosen keys.  
- Update [`05-implementation-checklist-engineering.md`](./05-implementation-checklist-engineering.md) if Model B requires Redux `activeVertical`.
