# Phase 1-6 — Human Test Plan (role-based)

Step-by-step QA script for the multi-vertical SaaS work. Walks through verticals, role-based RBAC, billing, marketing, and plan limits.

> Use a fresh browser profile per role to avoid cached tokens. All paths assume the admin app is at `http://localhost:3000` and the backend at `http://localhost:8000`.

---

## 0. One-time setup

### 0.1 Environment

| Where | Variable | Notes |
|-------|----------|-------|
| backend `.env` | `PLAN_LIMITS_STRICT` | Set `=1` to return HTTP 402 instead of soft header when over plan |
| backend `.env` | `STRIPE_SECRET_KEY` | Optional — real Stripe checkout. Without it the API returns a `mock: true` JSON |
| backend `.env` | `STRIPE_PRICE_HS_STARTER`, `…HS_GROWTH`, `…HS_SCALE`, `…REST_STARTER`, `…REST_PRO`, `…REST_ENTERPRISE`, `…SALON_STARTER`, `…SALON_GROWTH`, `…SALON_SCALE` | Stripe price IDs per plan |
| backend `.env` | `ADMIN_APP_URL` | Used for Stripe `success_url` / `cancel_url`. Default `http://localhost:3000` |

### 0.2 Backfill legacy tenants

Run **once** against each environment that has tenants created before Phase 1/5:

```bash
cd fixer-backend
npm run backfill:tenant-vertical-key
npm run backfill:tenant-plan-key
```

Expected output: per-tenant lines like `tenant <id> verticalKey=home_services planKey=hs_starter`.

### 0.3 Start services

```bash
# backend
cd fixer-backend && npm run dev
# admin frontend
cd profixer-admin-frontend && npm start
```

---

## 1. Test accounts and tenants

Create (or reuse) the following. Use `POST /api/auth/register/admin` after logging in as a super_admin, or seed via your usual scripts.

| Persona | userType | dashboard role | tenant | Purpose |
|---------|----------|----------------|--------|---------|
| `platform@fixer.local` | `super_admin` | `super_admin` (template) | `tenantId = null` | **Platform operator**: creates tenants, picks verticals & plans |
| `hs.admin@acme.local` | `admin` | `admin` | Tenant A — vertical `home_services`, plan `hs_starter` | Home services tenant owner |
| `hs.manager@acme.local` | `admin` | `manager` | Tenant A | Limited permissions inside Tenant A |
| `hs.staff@acme.local` | `admin` | `staff` | Tenant A | View-mostly user |
| `rest.admin@bistro.local` | `admin` | `admin` | Tenant B — vertical `restaurant`, plan `rest_starter` | Restaurant tenant owner |
| `salon.admin@glow.local` | `admin` | `admin` | Tenant C — vertical `salon`, plan `salon_starter` | Salon tenant owner |
| `clinic.admin@care.local` | `admin` | `admin` | Tenant D — vertical `clinic` (stub), plan `hs_starter` | Stub pack tenant |

Tenants A/B/C/D are created through the Platform Tenants UI in §3.

---

## 2. Sanity build / contract checks (before going manual)

| # | Command | Expected |
|---|---------|----------|
| 2.1 | `npm run build` in `profixer-admin-frontend` | exit 0 |
| 2.2 | `node scripts/run-tsc.cjs` in `fixer-backend` | exit 0 |
| 2.3 | `npm test -- --testPathPattern=verticalPacks` | all green; covers home_services, restaurant, salon, clinic, marketing slugs |
| 2.4 | `curl http://localhost:8000/api/health` | `200 OK` |
| 2.5 | `curl http://localhost:8000/api/billing/plans/restaurant -H "Authorization: Bearer <platform-jwt>"` | `200` + 3 plans (`rest_starter`, `rest_pro`, `rest_enterprise`) |

---

## 3. Platform operator (super_admin) — tenant + vertical provisioning

Sign in as `platform@fixer.local`.

### 3.1 Verify the platform-only sidebar

1. Open `/dashboard`.
2. The **Settings** group should show `SaaS platform`, `Platform tenants`. These items are hidden from tenant-scoped admins.
3. Navigate to `Settings → Platform tenants` (`/settings/tenants`).

### 3.2 Create Tenant A (home_services)

1. Click **Create tenant**.
2. Name: `Acme Home Services`. **Vertical: Home services**. Plan: `hs_starter`. Click **Apply plan modules**.
3. Confirm the modal lists `defaultModules` from the home_services pack (cms, crm, finance, marketing_workspace, team_work, bazaar, ecommerce).
4. Save.

Repeat 3.2 for B (`restaurant` / `rest_starter`), C (`salon` / `salon_starter`), D (`clinic` / `hs_starter`).

### 3.3 Attach users to each tenant

For each tenant, **Tenants → row → Add user** → pick the matching account from §1.

Expected: each row’s **Users** count increments, and the attached user now sees the tenant after re-login.

### 3.4 Plan-limit middleware sanity (super_admin still adding users)

While `PLAN_LIMITS_STRICT=1`:

1. Edit Tenant A’s plan to `hs_starter` (lowest `maxUsers`).
2. Add users one at a time via **Tenants → Add user** until you hit the limit.
3. On the next attempt the API returns:

```json
{ "success": false, "code": "PLAN_LIMIT_USERS", "message": "User limit reached (...) for plan hs_starter" }
```

4. Upgrade to `hs_growth` and confirm the next add succeeds.

### 3.5 SaaS tenant indicator

The header chip should show **Platform** when no tenant is selected, and switch to `Acme Home Services • home_services` after picking a tenant.

---

## 4. Home services tenant — Tenant A

Sign in as `hs.admin@acme.local`.

### 4.1 Sidebar contract (admin role)

Visible groups: `Operations`, `Catalog`, `Finance`, `Workspace`, `Settings`, etc.
**Bookings** is the engagement label. Group id `hs_operations` is present (verified by tests 2.3).

### 4.2 Dashboard

- `/dashboard` shows home_services KPI row (Bookings today, Active professionals, Revenue, etc.)
- `category_performance` section is visible.

### 4.3 Bookings engagement

1. `/bookings` shows status filter with `pending → accepted → in_progress → completed`.
2. Open a booking → **Update status** modal → status options match the home_services state machine.
3. After saving, the booking row’s status badge changes accordingly.

### 4.4 Manager role (`hs.manager@acme.local`)

- Cannot see Settings → Platform tenants or SaaS platform (no `manage_system_settings`).
- Can still update booking status (`manage_bookings`).
- Settings → Roles/Permissions is read-only or hidden depending on dashboard role.

### 4.5 Staff role (`hs.staff@acme.local`)

- Sidebar shows only view-style entries (Dashboard, Bookings list).
- Trying to deep-link `/settings/tenants` → redirected to `/unauthorized`.
- Trying to deep-link `/settings/billing` → redirected to `/unauthorized` (requires `view_settings`).

---

## 5. Restaurant tenant — Tenant B

Sign in as `rest.admin@bistro.local`.

### 5.1 Sidebar contract

- Group `hs_operations` is **gone**.
- New group `restaurant_ops` shows **Reservations** (not Bookings).

### 5.2 Dashboard

- KPI row contains a Reservations metric.
- `category_performance` section is **omitted** (tested in 2.3).

### 5.3 Reservation engagement statuses

1. `/bookings` (rendered with restaurant pack) shows labels `Booked → Confirmed → Seated → Ordering → Bill → Closed`.
2. Open the **Update status** modal → pick `Seated`. Modal sends `accepted` to the API (mapping via `toApiBookingStatus`).
3. Page refresh → status badge reads **Seated** again.

### 5.4 Reservations API (read-only smoke)

```bash
curl http://localhost:8000/api/restaurant/reservations \
  -H "Authorization: Bearer <rest.admin token>"
```

Expected: 200 + list of bookings adapted for the restaurant view.

```bash
curl -X PATCH http://localhost:8000/api/restaurant/reservations/<id>/status \
  -H "Authorization: Bearer <rest.admin token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "seated" }'
```

Expected: 200 + booking with mapped status.

---

## 6. Salon tenant — Tenant C

Sign in as `salon.admin@glow.local`.

1. Sidebar shows **Appointments** in the `salon_ops` group (no Bookings, no Reservations).
2. Dashboard shows salon KPIs (e.g. utilization).
3. Booking status modal exposes `Booked → Confirmed → In service → Completed → No-show`. The legacy `in_progress` API value renders as **In service** (tested in 2.3).

---

## 7. Stub vertical — Tenant D (clinic)

Sign in as `clinic.admin@care.local`.

- Pack is the **generic stub** so the sidebar inherits home_services but the header shows `Clinic` vertical.
- Dashboard, billing, and bookings all work; this confirms unknown verticals do not break the app.

---

## 8. Marketing + signup (unauthenticated)

Open a private/incognito window.

| Step | URL | Expected |
|------|-----|----------|
| 8.1 | `http://localhost:3000/for-restaurants` | Redirect to `/landing/for-restaurants` |
| 8.2 | `/landing/for-restaurants` | Hero shows **Restaurant** pack label, description, and 3 plan cards (`rest_starter`, `rest_pro`, `rest_enterprise`) with INR price chips |
| 8.3 | Click **Start free trial** | Goes to `/signup/restaurant` |
| 8.4 | `/signup/restaurant` step 1 | Recommended plan shows `Pro` (or whatever pack marks `recommended: true`) |
| 8.5 | Step 2 | Form fields render; submit currently CTAs back to platform tenant flow (provisioning happens in §3) |
| 8.6 | `/landing/for-home-services` and `/landing/for-salons` | Equivalent pages render |

---

## 9. Billing upgrade (authenticated)

Sign in as `hs.admin@acme.local`.

### 9.1 No Stripe configured (default dev)

1. Navigate to `/settings/billing`.
2. Plan cards for **home_services** plans render with INR pricing.
3. Click **Upgrade** on `hs_growth`.
4. Toast: *“Stripe not configured — contact platform operator”*; nothing redirects.

### 9.2 Stripe configured

1. Set `STRIPE_SECRET_KEY` + at least one `STRIPE_PRICE_HS_*` env, restart backend.
2. Click **Upgrade** on `hs_growth`.
3. Browser redirects to a real Stripe Checkout page.
4. Cancel → returns to `/settings/billing?canceled=1` and shows the canceled banner.
5. Pay (test card `4242 4242 4242 4242`) → returns to `/settings/billing?success=1`. The plan won’t actually flip until you wire a webhook; that’s a known follow-up.

### 9.3 Tenant plan nudge

If `Tenant.billingStatus` is set to `trialing` or `past_due`, the `TenantPlanNudge` banner appears on the dashboard. Toggle via Platform tenants → `Update billing status`.

---

## 10. Plan-limit edge cases (per role)

| Scenario | Acting role | Expected |
|----------|-------------|----------|
| `POST /auth/register/admin` while at `maxUsers` and `PLAN_LIMITS_STRICT=1` | hs.admin | 402 with `code: PLAN_LIMIT_USERS` |
| Same with `PLAN_LIMITS_STRICT` unset | hs.admin | 201 + response header `X-Plan-Limit: maxUsers:<n>` |
| Add user via `POST /platform-tenants/:id/users` over the cap | platform | Same enforcement |
| Tenant with `planKey` not in catalog | any | Allowed (legacy) but warning logged on backend |

---

## 11. Cross-cutting RBAC smoke

For every persona, attempt the same restricted action and confirm result:

| Action | super_admin | tenant admin | manager | staff |
|--------|-------------|--------------|---------|-------|
| `GET /settings/tenants` | ✅ | 403/redirect | 403/redirect | 403/redirect |
| `GET /settings/saas` | ✅ | 403/redirect | 403/redirect | 403/redirect |
| `GET /settings/billing` | ✅ | ✅ | depends on `view_settings` | ❌ |
| Update booking status | ✅ | ✅ | ✅ | ❌ |
| Create user (`/auth/register/admin`) | ✅ (subject to plan) | ✅ (subject to plan) | ❌ (no USER_CREATE) | ❌ |
| List billing plans (`/api/billing/plans/:vk`) | ✅ | ❌ (requires platform operator) | ❌ | ❌ |

---

## 12. Regression: legacy tenants

1. Pick a tenant in the DB created before Phase 1.
2. Confirm Mongo doc has `verticalKey: 'home_services'` and `planKey` set after backfills.
3. Log in as that tenant → admin home_services sidebar, no migration prompts.

---

## 13. Pass/fail summary

Track results in this form. Anything red → file a ticket and link the section number above.

```
[ ] §2 Sanity
[ ] §3 Platform tenant CRUD
[ ] §4 Home services tenant (admin / manager / staff)
[ ] §5 Restaurant tenant + reservations API
[ ] §6 Salon tenant
[ ] §7 Stub vertical (clinic)
[ ] §8 Marketing + signup
[ ] §9 Billing upgrade (Stripe off + on)
[ ] §10 Plan limit middleware
[ ] §11 RBAC matrix
[ ] §12 Legacy tenant backfill
```

---

## Appendix A — Quick role cheat sheet

- **super_admin**: full sidebar; only role that sees Platform tenants and SaaS platform.
- **tenant admin** (`admin` template): everything inside their tenant + billing upgrade, no platform pages.
- **manager**: operational + workspace, no system settings.
- **staff**: read-only/operational subset; can’t see billing.

## Appendix B — Direct API curl snippets

```bash
# Login (returns accessToken)
curl -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"hs.admin@acme.local","password":"<pw>"}'

# Restaurant reservations
curl $API/api/restaurant/reservations -H "Authorization: Bearer $TOK"

# Billing plans (platform operator only)
curl $API/api/billing/plans/restaurant -H "Authorization: Bearer $PLATFORM_TOK"

# Create checkout session
curl -X POST $API/api/billing/checkout-session \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"planKey":"hs_growth","verticalKey":"home_services"}'
```
