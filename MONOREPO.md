# Monorepo layout

This repository now ships two apps from a single workspace:

```
profixer-admin-frontend/
├── src/                 ← admin app (CRA, fixer-admin) — root package.json
├── storefront/          ← Next.js 15 multi-tenant storefront (Phase 0+)
├── docs/saas/           ← architecture docs
├── apps/
│   └── admin-mobile/    ← Bare React Native CLI admin companion (docs/mobile)
├── packages/            ← @profixer/types, rbac, constants, api-client (see packages/README.md)
├── pnpm-workspace.yaml  ← workspace manifest
└── turbo.json           ← turborepo task graph
```

## Day-to-day commands

Today (zero migration required, keep using `npm`):

```bash
# Admin (CRA, port 3000)
npm install                # at the root — same as before
npm start                  # admin only

# Storefront (Next.js 15, port 3001)
cd storefront
npm install
npm run dev

# Admin mobile (bare React Native CLI 0.76)
# First time only — see apps/admin-mobile/README.md for native scaffold steps
npm run mobile:install
npm run mobile:start              # Metro
npm run mobile:android            # build + run Android
npm run mobile:ios                # build + run iOS
```

Each app installs its own deps. **Existing developer flow is unchanged.**

## Tomorrow — opt-in turborepo / pnpm

Once everyone has `pnpm` (`corepack enable`) and you want unified install + parallel dev:

```bash
# One install for both apps + shared packages
pnpm install

# Run admin and storefront together
pnpm dev          # turbo runs every workspace's `dev` task in parallel

# Build everything for prod
pnpm build

# Typecheck the whole graph
pnpm typecheck
```

The Turbo task graph is defined in `turbo.json`. The `build` task respects each
app's outputs (`.next/**` for storefront, `build/**` for admin) and pins the
env vars that affect output so the cache stays correct.

## Why not move the admin into `apps/admin/` today?

The admin is a CRA project with hardcoded `craco.config.js`, `tsconfig.json`,
deploy scripts, and IDE paths that all point at the repo root. Moving it adds
several hours of risk for zero functional gain in this PR.

When we do move (recommended: just before Phase 4 ships to customers), the
target layout is:

```
profixer/
├── apps/
│   ├── admin/        ← move ./src + craco.config.js etc here
│   └── storefront/   ← move ./storefront/* here
├── packages/
│   ├── ui/           ← shared shadcn primitives
│   ├── themes/       ← vertical themes (home-services, restaurant, retail, …)
│   └── api-client/   ← typed fixer-backend client (generated from OpenAPI)
├── pnpm-workspace.yaml
└── turbo.json
```

See [`docs/saas/09-storefront-architecture.md`](./docs/saas/09-storefront-architecture.md) §2.1.
