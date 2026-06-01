# Backend: `verticalKey` on Tenant

> **Status:** Implemented on `fixer-backend` as of Phase 2. Persistence, auth payload, and `TenantAccessContext` are wired end-to-end. See `fixer-backend/docs/TENANT_PLATFORM_API.md` § "Industry vertical".

Frontend Phase 1–2 sends and reads `verticalKey` on organization (tenant) records. Without backend persistence the value lives only in Redux + `sessionStorage` and resets on device change / hard logout.

## MongoDB `Tenant` document

```js
{
  // existing fields…
  verticalKey: {
    type: String,
    enum: [
      'home_services',
      'restaurant',
      'salon',
      'clinic',
      'fitness',
      'auto_repair',
      'tutoring',
      'custom',
    ],
    default: 'home_services',
    index: true,
  },
  packVersion: { type: String, default: '1.0.0' }, // optional — pin pack migrations
}
```

## API

| Method | Path | Body |
|--------|------|------|
| `POST` | `/api/platform/tenants` | `{ name, slug, planKey?, ownerEmail?, verticalKey? }` |
| `PATCH` | `/api/platform/tenants/:id` | `{ verticalKey?, featureModules?, … }` |
| `GET` | `/api/platform/tenants/:id` | Response includes `verticalKey` |

## Auth / JWT

Include on tenant-scoped login payload:

```json
{
  "tenant": {
    "id": "…",
    "name": "…",
    "slug": "…",
    "verticalKey": "home_services",
    "featureModules": ["crm", "finance", "cms"]
  }
}
```

Frontend reads this via `extractTenantFromAuth.ts` (`verticalKey`, `vertical_key`, `featureModules`).

## Backfill migration

Run on `fixer-backend` after deploying the schema change:

```bash
npm run backfill:tenant-vertical-key
```

(Equivalent to `db.tenants.updateMany({ verticalKey: { $exists: false } }, { $set: { verticalKey: 'home_services' } })` but goes through `assertDestructiveAllowedOrExit`.)

## Allowed values

The backend enum (`fixer-backend/src/core/tenant/verticalKeys.ts`) must stay in lock-step with `fixer-admin/src/verticals/core/types.ts`. Current keys:

`home_services`, `restaurant`, `salon`, `fitness`, `real_estate`, `b2b_services`, `retail`, `healthcare`, `education`.

## Module keys

Frontend also uses `ecommerce` in `featureModules` allowlist (products/orders/inventory). Add to backend `TENANT_FEATURE_KEYS` when gating those routes.
