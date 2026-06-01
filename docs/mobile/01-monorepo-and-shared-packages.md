# Fixer Admin Mobile — Monorepo & Shared Packages

> Target layout for sharing logic between `fixer-admin` (web) and `fixer-admin-mobile` (React Native).

## Recommended monorepo layout

```text
profixer/
├── package.json                 # workspaces root (pnpm recommended)
├── pnpm-workspace.yaml
├── tsconfig.base.json
│
├── apps/
│   ├── admin-web/               # ← move current profixer-admin-frontend here
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json         # name: @profixer/admin-web
│   │
│   └── admin-mobile/            # ← new React Native app
│       ├── android/
│       ├── ios/
│       ├── src/
│       └── package.json         # name: @profixer/admin-mobile
│
└── packages/
    ├── types/                   # @profixer/types
    ├── validation/              # @profixer/validation (zod)
    ├── rbac/                    # @profixer/rbac
    ├── api-client/              # @profixer/api-client
    ├── constants/               # @profixer/constants
    ├── utils/                   # @profixer/utils
    └── store-core/              # @profixer/store-core (optional phase 2)
```

## Workspace tooling

| Tool | Why |
|------|-----|
| **pnpm workspaces** | Fast installs, strict deps |
| **TypeScript project references** | Shared `tsconfig.base.json` |
| **ESLint** | Per-app overrides + shared `packages/eslint-config` (optional) |

Root `package.json` scripts (example):

```json
{
  "scripts": {
    "web": "pnpm --filter @profixer/admin-web start",
    "mobile": "pnpm --filter @profixer/admin-mobile start",
    "typecheck": "pnpm -r typecheck"
  }
}
```

---

## Package: `@profixer/types`

**Purpose:** Domain types used by API responses, Redux, and screens.

### Move from web repo

| Current path | Notes |
|--------------|-------|
| `src/types/rbac.types.ts` | Permission, UserRole, RoutePermission |
| `src/types/professional.types.ts` | Workforce / pro entities |
| `src/types/crm.types.ts` | CRM module |
| `src/types/amc.types.ts` | AMC |
| `src/types/finance.types.ts` | Finance |
| `src/types/founder-finance.types.ts` | Founder finance (mobile: view-only later) |
| `src/types/teamWork.types.ts` | Team work |
| `src/types/cms.types.ts` | CMS (low mobile priority) |
| `src/types/company-documents.types.ts` | Docs |
| `src/types/operating-commercial.types.ts` | Commercial terms |
| `src/types/provider-assets.types.ts` | Provider assets |
| `src/types/professional-conduct.types.ts` | Conduct |
| `src/types/marketingWorkspace.types.ts` | Marketing workspace |
| `src/types/categoryMarketing.ts` | Category marketing |
| `src/types/pricingCategoryMeta.ts` | Pricing meta |
| `src/types/publicSiteTheme.types.ts` | Theme |
| `src/types/storeCategoryPlp.ts` | E-commerce PLP |

### Split / trim `src/types/index.ts`

- **Do not** move the entire 1000+ line `index.ts` as one blob.
- Extract **mobile-relevant** types into focused files (`booking.types.ts`, `user.types.ts`, etc.).
- Web-only CMS/menu types can stay in `admin-web` until needed on mobile.

### Export surface

```ts
// packages/types/src/index.ts
export * from './rbac.types'
export * from './professional.types'
// … incremental exports
```

---

## Package: `@profixer/rbac`

**Purpose:** Single source of truth for permission checks (web guards + mobile navigators).

### Move from web repo

| Current path | Action |
|--------------|--------|
| `src/config/rbac.config.ts` | Move `rolePermissionsMap`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `canAccessRoute`, `routePermissions` |
| `src/lib/rbacRegistry.ts` | Move if used for access explorer / tooling |
| `src/lib/sanitizePermissions.ts` | Move (used by `usePermissions`) |

### Keep platform-specific (do NOT move)

| Path | Reason |
|------|--------|
| `src/hooks/usePermissions.ts` | Uses Redux `useAppSelector` — split into: |
| | • `@profixer/rbac` → pure functions |
| | • `apps/admin-web/src/hooks/usePermissions.ts` → thin wrapper |
| | • `apps/admin-mobile/src/hooks/usePermissions.ts` → thin wrapper |
| `src/components/auth/RoleBasedRoute.tsx` | Web-only |
| `src/components/auth/ProtectedRoute.tsx` | Web-only |

### New shared API (example)

```ts
// packages/rbac/src/check.ts
export function resolveUserPermissions(
  rbacRole: UserRole,
  customPermissions: Permission[],
  opts: { explicitOnly: boolean },
): Permission[]

export { hasPermission, hasAnyPermission, canAccessRoute } from './rbac.config'
```

---

## Package: `@profixer/validation`

**Purpose:** Zod schemas shared by forms on web and mobile.

### Move (incrementally)

- Schemas colocated with features today — grep for `z.object` in:
  - `src/pages/bookings/`
  - `src/pages/auth/`
  - `src/pages/providers/`, `src/pages/professionals/`
  - `src/components/forms/`
- Start with **auth login**, **booking status update**, **refund approve** — highest mobile value.

### Do not move yet

- CMS blog/editor schemas
- Complex drag-and-drop board schemas
- Founder finance simulator schemas

---

## Package: `@profixer/api-client`

**Purpose:** HTTP layer without Redux/toast side effects.

### Refactor required (important)

Today you have **two** clients with Redux coupling:

- `src/services/api/base.ts` — `ApiBase` class, loading toasts, `store.dispatch`
- `src/services/apiClient.ts` — `ApiClient` class, same pattern

**Target architecture:**

```text
packages/api-client/
├── src/
│   ├── createClient.ts      # axios/fetch factory — NO Redux
│   ├── interceptors/
│   │   ├── auth.ts          # inject Bearer from callback
│   │   ├── tenant.ts        # TENANT_HEADER from callback
│   │   └── errors.ts        # normalize ApiError
│   ├── types.ts             # ApiResponse<T>, ApiError
│   └── services/            # one file per domain (move from web)
```

### Move service files (MVP mobile subset first)

**Phase 1 — mobile MVP:**

| Current path |
|--------------|
| `src/services/api/auth.service.ts` |
| `src/services/api/bookings.service.ts` |
| `src/services/api/dashboard.service.ts` |
| `src/services/api/notifications.service.ts` |
| `src/services/api/chat.service.ts` |
| `src/services/api/professionals.service.ts` |
| `src/services/api/professionalApplications.service.ts` |
| `src/services/api/providers.service.ts` |
| `src/services/api/supportTickets.service.ts` |
| `src/services/api/disputeCases.service.ts` |
| `src/services/api/payments.service.ts` |
| `src/services/api/error-handler.ts` |

**Phase 2 — ops expansion:**

| Current path |
|--------------|
| `src/services/api/orders.service.ts` |
| `src/services/api/quotes.service.ts` |
| `src/services/api/service-requests.service.ts` |
| `src/services/api/pos.service.ts` |
| `src/services/api/users.service.ts` |
| `src/services/api/analytics.service.ts` |

**Stay web-only (for now):**

| Current path | Reason |
|--------------|--------|
| `boards.service.ts` | tldraw / canvas |
| `blog.service.ts`, `homepage.service.ts`, `cms.service.ts` | Rich CMS |
| `marketingWorkspace.api.ts` | Desktop workflows |
| `founder-finance.service.ts` | Complex charts |
| `menu.service.ts`, `sliders.service.ts` | Web CMS |

### Move supporting libs

| Current path | Package |
|--------------|---------|
| `src/lib/saasEnv.ts` (`TENANT_HEADER`, `SAAS_MODE`) | `@profixer/constants` |
| `src/lib/apiMediaOrigin.ts` | `@profixer/utils` |

### Web adapter (keep in admin-web)

```ts
// apps/admin-web/src/services/api/createWebClient.ts
import { createApiClient } from '@profixer/api-client'
import { store } from '../../store'
import { setLoading, addToast } from '../../store/slices/uiSlice'

export const api = createApiClient({
  baseURL: process.env.REACT_APP_API_URL,
  getToken: () => store.getState().auth.token,
  getTenantId: () => store.getState().tenant.tenantId,
  onLoading: (v, msg) => store.dispatch(setLoading({ isLoading: v, message: msg })),
  onToast: (t) => store.dispatch(addToast(t)),
})
```

### Mobile adapter

```ts
// apps/admin-mobile/src/services/createMobileClient.ts
import { createApiClient } from '@profixer/api-client'
import { getSecureToken, getTenantId } from '../auth/storage'

export const api = createApiClient({
  baseURL: Config.API_URL,
  getToken: getSecureToken,
  getTenantId,
  // no global loading — use RTK Query / screen-level spinners
})
```

---

## Package: `@profixer/constants`

| Source | Content |
|--------|---------|
| `src/lib/saasEnv.ts` | Env flags, header names |
| Booking status enums, role names | Extract from types or API |
| Deep link path prefixes | New |

---

## Package: `@profixer/utils`

| Source | Content |
|--------|---------|
| `src/lib/utils.ts` | `cn()` stays **web-only** (Tailwind) |
| Pure formatters | `formatCurrency`, `formatDate` — grep `date-fns` usage |
| `src/lib/sidebarRecent.ts` | Web-only (localStorage) — mobile uses AsyncStorage in app |

---

## Package: `@profixer/store-core` (optional, phase 2)

Share Redux slices that are platform-agnostic:

| Current path | Share? |
|--------------|--------|
| `src/store/slices/authSlice.ts` | Yes — adapt persist storage per platform |
| `src/store/slices/tenantSlice.ts` | Yes (if SaaS mobile needs tenant switch) |
| `src/store/slices/chatInboxSlice.ts` | Yes |
| `src/store/slices/uiSlice.ts` | **No** — web loading/toast vs mobile differs |
| `src/store/slices/dataSlice.ts` | Evaluate — may be web-specific cache |

Use **redux-persist** with:

- Web: `localStorage`
- Mobile: `@react-native-async-storage/async-storage`

---

## Migration order (minimize breakage)

1. Create monorepo root + move `admin-web` unchanged (paths still work).
2. Extract `@profixer/types` + `@profixer/rbac` — fix web imports.
3. Extract `@profixer/api-client` with **auth + bookings** only; refactor `base.ts` to use it.
4. Bootstrap `admin-mobile` consuming those packages.
5. Migrate remaining services incrementally.

## What never gets shared

| Area | Web | Mobile |
|------|-----|--------|
| UI | Radix, shadcn, Tailwind | RN primitives, NativeWind/Tamagui |
| Routing | react-router-dom | React Navigation |
| Rich editors | Quill, tldraw | Skip or read-only HTML |
| Charts | recharts | victory-native / gifted-charts |
| DnD | dnd-kit | draggable-flatlist (limited) |
| PDF | jspdf | Share API / WebView later |
