# Phase 6 — Explicit roadmap completion

Items from [`01-vertical-pack-architecture.md`](./01-vertical-pack-architecture.md) that were still open after Phases 1–5.

## Done in this phase

| Item | Location |
|------|----------|
| Pack contract extensions (catalog, workforce, tax, compliance, integrations, reports) | `src/verticals/core/*.ts`, `*/packExtras.ts` |
| `marketingSlug` + stub vertical packs | `src/verticals/stubs/`, `registry.ts` |
| Pack validation for extras | `src/verticals/validatePack.ts` |
| Marketing landings | `/landing/:slug`, shortcuts `/for-*` → `/landing/*` |
| Vertical signup wizard | `/signup/:verticalKey` |
| Billing upgrade UI | `/settings/billing`, `billing.service.ts` |
| Monorepo placeholder | `packages/README.md` |
| Backend `ecommerce` feature key | `fixer-backend` `tenantFeatures.ts` |
| Plan limits middleware | `requireTenantPlanLimits.ts` on `register/admin` + platform tenant user attach |
| Plan key backfill script | `npm run backfill:tenant-plan-key` |
| Stripe checkout skeleton | `POST /api/billing/checkout-session` |
| Restaurant reservations API (Booking adapter) | `GET/PATCH /api/restaurant/reservations` |
| `Tenant.industrySettings` | Mongoose `Tenant` model |

## Still deferred (by design)

| Item | Notes |
|------|--------|
| Full monorepo + `@profixer/verticals` npm package | `packages/README.md` only |
| React Native app | See `docs/mobile/` |
| Production Stripe webhooks + Razorpay | Env + webhook handlers |
| Booking monthly limits | Needs `Booking.tenantId` on model + backfill |
| Dedicated `Reservation` collection | Current API filters `Booking` |
| Full productized packs for clinic, fitness, auto_repair, tutoring | Generic stubs inherit home_services nav |
| Lucide-only sidebar icon cleanup | Incremental |

## Ops commands (backend)

```bash
npm run backfill:tenant-vertical-key
npm run backfill:tenant-plan-key
```

Set `PLAN_LIMITS_STRICT=1` to return HTTP 402 when over `maxUsers` for the tenant plan.

## Public URLs (admin)

| URL | Purpose |
|-----|---------|
| `/for-home-services` | Redirect → landing |
| `/landing/for-restaurants` | Marketing page |
| `/signup/restaurant` | Signup wizard |
| `/settings/billing` | Plan upgrade (authenticated) |
