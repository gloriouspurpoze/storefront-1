# Shared packages (`@profixer/*`)

Workspace libraries consumed by **fixer-admin** (web), **admin-mobile** (Expo), and eventually **storefront**.

## Current packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@profixer/types` | RBAC + domain types (incremental) | **Phase 1** — `rbac.types` |
| `@profixer/rbac` | `canAccessRoute`, role maps, `sanitizePermissions` | **Done** — web re-exports |
| `@profixer/constants` | SaaS env (`REACT_APP_*` + `EXPO_PUBLIC_*`) | **Done** |
| `@profixer/api-client` | Redux-free HTTP + domain services | **MVP** — auth, bookings, dashboard, chat, notifications, professionals, support, applications, disputes |
| `@profixer/utils` | `mapBackendUserToAppUser`, `extractTenantFromAuthPayload` | **Done** |

## Planned (docs/mobile/01)

- `@profixer/validation` — shared Zod schemas
- `@profixer/utils` — pure formatters
- `@profixer/store-core` — shared auth/tenant slices (phase 2)

## Vertical packs

`src/verticals/` remains in the admin app until extracted to `@profixer/verticals` (see prior README note). Mobile does not depend on verticals yet.

## Web consumption

CRA resolves packages via **craco aliases** (`craco.config.js`). Root scripts use `craco start|build` (not bare `react-scripts`).

## Mobile consumption

`apps/admin-mobile` — Expo 52, React Navigation 7, `mobileNav.config.ts` aligned with `docs/mobile/03`.

```bash
cd apps/admin-mobile && cp .env.example .env
pnpm install   # from repo root
pnpm mobile    # or: pnpm --filter @profixer/admin-mobile start
```
