# Vertical billing plans (Phase 5)

## Overview

Each vertical pack defines **SaaS plans** (`billingPlans` on `VerticalPackDefinition`). `Tenant.planKey` stores the active plan on fixer-backend.

Plans drive:

- **Platform Tenants UI** — plan picker on create/edit, “Apply plan modules” to sync `featureModules`
- **Admin nudge** — `TenantPlanNudge` when billing is `past_due` / `canceled` or modules exceed plan
- **Org indicator** — plan label next to vertical name in the sidebar

## Plan manifest

See `src/verticals/*/billingPlans.ts`. Each plan includes:

| Field | Purpose |
|--------|---------|
| `key` | Stored on `Tenant.planKey` |
| `label` / `description` | Admin UI copy |
| `priceMonthlyInr` | Display-only until checkout |
| `includedModules` | Suggested `Tenant.featureModules` allowlist |
| `limits` | Informational caps (enforcement = future API work) |
| `stripePriceIdEnv` | CRA env var name for Stripe Price id |

## Stripe env vars (optional)

Set in `.env` when wiring checkout:

```env
REACT_APP_STRIPE_PRICE_HS_STARTER=price_...
REACT_APP_STRIPE_PRICE_HS_GROWTH=price_...
REACT_APP_STRIPE_PRICE_REST_STARTER=price_...
REACT_APP_STRIPE_PRICE_SALON_STARTER=price_...
```

Resolve at runtime via `resolveStripePriceId(plan)` in `src/lib/verticalPlans.ts`.

## Backend

- `fixer-backend/src/core/tenant/verticalPlans.ts` — allowed plan keys per `verticalKey`
- `PlatformTenantService` validates `planKey` on create/update
- Auth `user.tenant` includes `planKey` and `billingStatus` when populated

Legacy tenants with free-text `planKey` values must be migrated to a known key or PATCH will fail validation.
