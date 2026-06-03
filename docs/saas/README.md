# Multi-Vertical SaaS — Architecture Docs

Reference docs for evolving `fixer-admin` from a single-vertical (home services) SaaS into a **multi-vertical platform** (home services + restaurant + salon + clinic + …).

## Reading order

1. [`01-vertical-pack-architecture.md`](./01-vertical-pack-architecture.md) — Full design: why vertical ≠ tenant, the core/pack split, schema strategy, billing, and migration phases.
2. [`02-vertical-pack-typescript-contract.md`](./02-vertical-pack-typescript-contract.md) — The `VerticalPack` TypeScript contract + a starter `home_services` manifest extracted from the current sidebar.
3. [`03-sidebar-refactor-checklist.md`](./03-sidebar-refactor-checklist.md) — Every sidebar group/item today mapped to **core**, **home_services pack**, or **deprecated** — your concrete refactor checklist.

## Related docs

- [`docs/TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md`](../TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md) — current tenant + RBAC runbook (pre-vertical-pack).
- [`docs/PRODUCT_AND_SAAS_PLAYBOOK.md`](../PRODUCT_AND_SAAS_PLAYBOOK.md) — product narrative.
- [`docs/mobile/`](../mobile/) — mobile companion app plan (consumes the same pack system).
- **[`docs/verticals/`](../verticals/)** — **Real estate & logistics expansion** (CEO strategy, pack specs, onboarding runbook, engineering checklist).

## Implementation status (frontend)

### Phase 1 (done)

Phase 1 is implemented in this repo:

| Area | Location |
|------|----------|
| Vertical types & registry | `src/verticals/` |
| Core + home_services sidebar manifests | `src/verticals/core/sidebarManifest.ts`, `src/verticals/home_services/sidebarManifest.ts` |
| Sidebar builder + module filter | `src/lib/buildAdminSidebar.ts` |
| Sidebar integration | `src/components/layout/sidebar.tsx` |
| Tenant `verticalKey` + `featureModules` in Redux | `src/store/slices/tenantSlice.ts` |
| Org create / manage vertical picker | `src/pages/settings/PlatformTenantsPage.tsx` |

**Backend:** wired on `fixer-backend` — see [`04-backend-verticalKey.md`](./04-backend-verticalKey.md). `Tenant.verticalKey` is persisted, surfaced on `user.tenant` in auth responses, and carried in `TenantAccessContext`. Run `npm run backfill:tenant-vertical-key` once to backfill legacy docs. The frontend's `sessionStorage` cache is now just a UX accelerator; first paint after fresh login also gets the correct vertical from the auth payload.

### Phase 2 (done — frontend)

| Area | Location |
|------|----------|
| Engagement status definitions | `src/verticals/home_services/engagement.ts`, `src/verticals/restaurant/engagement.ts` |
| `useVerticalPack()` hook | `src/hooks/useVerticalPack.ts` |
| Status label helpers | `src/lib/verticalEngagement.ts` |
| Pack zod validation (dev) | `src/verticals/validatePack.ts` |
| Restaurant pack (MVP sidebar) | `src/verticals/restaurant/` |
| Tenant context session cache | `src/lib/tenantContextStorage.ts` |
| Tests | `src/verticals/__tests__/verticalPacks.test.ts` |
| Org indicator shows vertical | `SaasTenantIndicator.tsx` |

### Phase 3 (done — frontend booking UI)

| Area | Location |
|------|----------|
| `useEngagementStatus()` hook | `src/hooks/useEngagementStatus.ts` |
| Status UI + legacy API aliases | `src/lib/engagementStatusUi.ts`, `src/lib/engagementStatusAliases.ts` |
| Bookings list + status modal | `src/pages/bookings/bookings.tsx`, `UpdateBookingStatusModal.tsx` |
| Professional hub + details labels | `professional-admin-hub.tsx`, `booking-details.tsx` |
| Tests | `src/verticals/__tests__/verticalPacks.test.ts` |

### Phase 4 (done — dashboard & salon pack)

| Area | Location |
|------|----------|
| Dashboard layout contract | `src/verticals/core/dashboardWidgets.ts` |
| Per-vertical KPIs + sections | `home_services/`, `restaurant/`, `salon/` `dashboardWidgets.ts` |
| `useVerticalDashboard()` | `src/hooks/useVerticalDashboard.ts` |
| KPI row component | `src/components/dashboard/VerticalDashboardKpiRow.tsx` |
| Admin dashboard integration | `src/pages/dashboard/dashboard.tsx` |
| **Salon & spa** vertical pack | `src/verticals/salon/` (sidebar, engagement, dashboard) |
| Salon enabled in tenant picker | `PlatformTenantsPage.tsx` |
| Salon legacy API aliases | `src/lib/engagementStatusAliases.ts` |

### Phase 5 (done — vertical billing plans)

| Area | Location |
|------|----------|
| Plan types & registry | `src/verticals/core/billingPlans.ts`, `src/lib/verticalPlans.ts` |
| Per-vertical plans | `src/verticals/*/billingPlans.ts` |
| `useVerticalPlans()` | `src/hooks/useVerticalPlans.ts` |
| Tenant plan picker + apply modules | `PlatformTenantsPage.tsx` |
| Billing nudge banner | `src/components/billing/TenantPlanNudge.tsx` |
| `planKey` / `billingStatus` in Redux | `tenantSlice.ts`, `extractTenantFromAuth.ts` |
| Backend plan validation | `fixer-backend/src/core/tenant/verticalPlans.ts` |
| Docs | [`05-vertical-billing-plans.md`](./05-vertical-billing-plans.md) |

### QA

- [`07-human-test-plan.md`](./07-human-test-plan.md) — step-by-step manual test plan with role matrix, billing, plan-limits, marketing, and per-vertical scenarios.

### Runbooks

- [`08-onboard-three-tenants-runbook.md`](./08-onboard-three-tenants-runbook.md) — concrete super-admin runbook to onboard `profixer` (home services), `thebrownbutter` (restaurant), and `nozeperfume` (retail / e-commerce). CLI bootstrap: `cd fixer-backend && ALLOW_DESTRUCTIVE=1 npm run onboard:reference-tenants`. Data isolation gate: `npm run audit:tenant-isolation:strict`.
- [`09-storefront-architecture.md`](./09-storefront-architecture.md) — multi-tenant storefront RFC (Next.js app, subdomain routing, Vercel domains, theme phases).

### Phase 6 (done — roadmap closure)

| Area | Location |
|------|----------|
| Pack extras (catalog, workforce, tax, …) | `src/verticals/core/`, `*/packExtras.ts` |
| Stub verticals (clinic, fitness, …) | `src/verticals/stubs/` |
| Marketing + signup routes | `VerticalLandingPage`, `VerticalSignupWizard`, `App.tsx` |
| Billing upgrade | `BillingUpgradePage`, `billing.service.ts` |
| Monorepo placeholder | `packages/README.md` |
| Backend billing + reservations + limits | `fixer-backend` — see [`06-roadmap-completion.md`](./06-roadmap-completion.md) |

## Core mental model

```text
Platform
 ├── Vertical packs (home_services, restaurant, salon, clinic, …)
 │    └── Each pack: schema extensions + sidebar + state machines + KPIs + integrations
 │
 └── Tenants (one paying business each)
      ├── verticalKey      → picks one pack
      ├── featureModules   → entitlement allowlist within the pack
      └── planKey          → pricing tier / limits
```

**Vertical = product surface.** **Tenant = customer.** **Plan = billing.**
