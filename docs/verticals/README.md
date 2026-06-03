# Vertical expansion — Real estate & logistics

**Purpose:** Detailed product, engineering, and operations documentation for onboarding **real estate** and **logistics / shipment** customers on the ProFixer multi-vertical SaaS platform.

**Audience:** Founder / CEO, product, engineering, implementation / super-admin operators.

**Prerequisites:** Read these first if you are new to the platform model:

| Doc | Why |
|-----|-----|
| [`docs/saas/01-vertical-pack-architecture.md`](../saas/01-vertical-pack-architecture.md) | Vertical vs tenant vs plan; three enforcement layers |
| [`docs/PRODUCT_AND_SAAS_PLAYBOOK.md`](../PRODUCT_AND_SAAS_PLAYBOOK.md) | Business model, ICP, what not to build |
| [`docs/saas/08-onboard-three-tenants-runbook.md`](../saas/08-onboard-three-tenants-runbook.md) | Super-admin tenant creation pattern |
| [`docs/PARTNER_ONBOARDING_SOP.md`](../PARTNER_ONBOARDING_SOP.md) | Commercial + legal + staff onboarding |

---

## Reading order (this folder)

| # | Document | Contents |
|---|----------|----------|
| 0 | [`00-CEO-strategy-expansion.md`](./00-CEO-strategy-expansion.md) | Go/no-go, sequencing, pricing, risks — executive summary |
| 1 | [`01-real-estate-vertical-pack-spec.md`](./01-real-estate-vertical-pack-spec.md) | Domain model, screens, reuse map, phased build |
| 2 | [`02-logistics-shipment-vertical-spec.md`](./02-logistics-shipment-vertical-spec.md) | Shipment dashboard vs logistics vertical; phase 1 / 2 scope |
| 3 | [`03-tenant-vertical-policy.md`](./03-tenant-vertical-policy.md) | One vertical per tenant vs multi-vertical; decision record |
| 4 | [`04-onboarding-runbook-real-estate-logistics.md`](./04-onboarding-runbook-real-estate-logistics.md) | Step-by-step super-admin runbook for both design partners |
| 5 | [`05-implementation-checklist-engineering.md`](./05-implementation-checklist-engineering.md) | Frontend + backend tasks, file locations, acceptance criteria |

---

## Current codebase status (snapshot)

| Vertical key | UI pack status | Backend | Notes |
|--------------|----------------|---------|-------|
| `real_estate` | **Stub** — inherits home-services sidebar & dashboard | Accepted on create/update | See `src/verticals/registry.ts` |
| `logistics` | **Not in `VerticalKey` yet** | Not registered | Proposed in doc `02`; requires backend key + registry entry |

**Stub pack** = valid tenant today; navigation and KPIs look like home services until a dedicated manifest ships. See [`docs/saas/08-onboard-three-tenants-runbook.md`](../saas/08-onboard-three-tenants-runbook.md) § industry table.

**Fully productized packs today:** `home_services`, `restaurant`, `salon` (+ `retail` has dedicated billing plans on stub sidebar).

---

## Recommended execution order

```text
NOW      E-commerce delivery tracking on Orders (see docs/ecommerce/) — retail/D2C tenants
Week 1–2 Real estate design partner → onboard on stub → ship real_estate pack v1 (doc 01, 04)
Week 3+  Logistics vertical ONLY if courier customer needs more than order tracking (doc 02)
```

**Current focus:** [`docs/ecommerce/01-delivery-tracking-spec.md`](../ecommerce/01-delivery-tracking-spec.md) — shipment tracking as a feature inside **Orders**, not a new vertical.

---

## Glossary

| Term | Meaning in ProFixer |
|------|-------------------|
| **Vertical** | Industry pack (`verticalKey`) — sidebar, engagement statuses, KPIs, default modules |
| **Tenant** | One paying organization (`Tenant` document, slug, `X-Tenant-Id`) |
| **Plan** | Billing tier within a vertical (`planKey`, e.g. `hs_growth`, `rest_starter`) |
| **Engagement** | Abstract unit of customer value (booking, viewing, shipment, lease) |
| **Catalog item** | Anything listed/sold (property, service, SKU, menu item) |
| **Module** | API entitlement gate: `cms`, `crm`, `finance`, `ecommerce`, `bazaar`, etc. |

---

## Related code locations

| Area | Path |
|------|------|
| Vertical registry | `src/verticals/registry.ts` |
| Vertical types | `src/verticals/core/types.ts` |
| Stub pack builder | `src/verticals/stubs/genericVerticalPack.ts` |
| Org create UI | `src/pages/settings/PlatformTenantsPage.tsx` |
| Orders / fulfillment (retail pattern) | `src/pages/orders/orders.tsx` |
| Storefront vertical themes | `storefront/lib/types.ts`, `storefront/themes/coming-soon/` |

---

*Last updated: 2026-06-03 — aligns with `VerticalKey` in `src/verticals/core/types.ts`.*
