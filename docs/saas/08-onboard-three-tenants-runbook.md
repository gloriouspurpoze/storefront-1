# Runbook — Onboarding three tenants

> Goal: stand up **three production-ready customer organizations** on the platform.
>
> | Tenant | Vertical | Plan | Modules |
> | --- | --- | --- | --- |
> | `profixer` (Profixer) | Home services | `hs_growth` | CRM, CMS, Finance, Marketing, Team work |
> | `thebrownbutter` (The Brown Butter) | Restaurant | `rest_starter` | CRM, CMS, E-commerce |
> | `nozeperfume` (Noze Perfume) | **Retail / e-commerce** | `retail_growth` | CMS, E-commerce, CRM, Marketing |
>
> Author: Platform / SRE  ·  Audience: Super-admin operators  ·  Runtime: ~15 minutes per tenant.
>
> **Industry verticals now available** (`fixer-admin` + `fixer-backend` keep these in sync — UI dropdown shows the same list as the backend allows):
>
> | Key | Label | Pack status | Default plans |
> | --- | --- | --- | --- |
> | `home_services` | Home services | Full pack (sidebar + dashboard) | `hs_starter / hs_growth / hs_scale` |
> | `restaurant` | Restaurant | Full pack | `rest_starter / rest_pro / rest_enterprise` |
> | `salon` | Salon & spa | Full pack | `salon_starter / salon_growth / salon_scale` |
> | `retail` | **Retail / e-commerce** | Stub pack + dedicated retail plans | `retail_starter / retail_growth / retail_scale` |
> | `fitness` | Fitness & gyms | Stub pack | HS plans (until productized) |
> | `healthcare` | Healthcare | Stub pack | HS plans |
> | `education` | Education & tutoring | Stub pack | HS plans |
> | `real_estate` | Real estate | Stub pack | HS plans |
> | `b2b_services` | B2B services | Stub pack | HS plans |
>
> **Stub packs** reuse the home-services sidebar/dashboard for now but are valid tenants on the backend — you can onboard a customer today and the navigation will be refined later without re-creating the org. The `retail` pack additionally ships its own e-commerce-first billing plans.
>
> **If none of these fit**, choose the closest vertical and use **Manage → App modules** to restrict access to the modules the customer actually needs. The seven API modules (`cms`, `crm`, `finance`, `marketing_workspace`, `team_work`, `bazaar`, `ecommerce`) compose any business shape without forking a new pack.
>
> **Real estate & logistics design partners:** see **[`docs/verticals/`](../verticals/README.md)** for CEO strategy, pack specs, and dedicated onboarding runbook.

---

## 0 · Preconditions (do once)

Verify the following before you create the first tenant. None of this is per-tenant work.

- [ ] You are signed in as a **super-admin** (no `tenantId` on your user) with `manage_system_settings`.
- [ ] Backend `/api/platform/tenants` responds: open **Settings → Organizations** in the admin UI and the table loads without error.
- [ ] Frontend env (`.env`) has `REACT_APP_SAAS_MODE=true` so the tenant indicator surfaces in the header.
- [ ] (Optional, billing) Backend env has `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Frontend env has `REACT_APP_BILLING_PORTAL_URL`.
- [ ] (Optional, telemetry) Backend has `SENTRY_DSN` set.

> Each organization is a Mongo `Tenant` document. Slugs are unique, lower-case, hyphen-only (`^[a-z0-9][a-z0-9-]{1,62}$`). The values below honour that constraint — **do not change slug casing**.

---

## 1 · Tenant: **Profixer** (home services)

**Identity**

| Field | Value |
| --- | --- |
| Display name | `Profixer` |
| Slug | `profixer` |
| Industry vertical | **Home services** (`home_services`) |
| SaaS plan | **Growth** (`hs_growth`) — ₹7,999/mo |
| Owner email | _(optional)_ the founder/admin email |

**Step-by-step**

1. **Settings → Organizations → Add organization**.
2. Fill the form:
   - Display name: `Profixer`
   - Slug: `profixer`
   - Owner email: leave blank if the owner does not yet have a user; otherwise enter their email.
   - SaaS plan: `Growth — ₹7,999/mo`
   - Industry vertical: `Home services`
   - Leave **After create, open Launch readiness…** checked.
3. Click **Create**. You will be redirected to **Launch readiness**, scoped to Profixer.
4. Return to Organizations. Confirm the new row shows **Vertical: Home services**, **Plan: Growth**, **App modules: All 7 modules** (the plan's included modules are seeded but the allowlist is left null = full access).
5. Open **Manage** on the Profixer row and:
   - Confirm **Industry vertical** = Home services and **SaaS plan** = Growth.
   - Click **Apply plan modules** to align the API allowlist exactly with the plan (`crm, cms, finance, marketing_workspace, team_work`).
   - **Invite admin…** (new user) or **Attach existing user** (already has an account) under **Admins for this organization**.
6. (Optional) Add the custom domain under **Custom hostname (storefront routing)**, e.g. `app.profixer.com`. Then mark it verified in your DNS workflow.
7. **Launch readiness** → go through the six steps, tick each off as you verify it for `profixer`.

---

## 2 · Tenant: **The Brown Butter** (restaurant)

**Identity**

| Field | Value |
| --- | --- |
| Display name | `The Brown Butter` |
| Slug | `thebrownbutter` |
| Industry vertical | **Restaurant** (`restaurant`) |
| SaaS plan | **Starter** (`rest_starter`) — ₹4,999/mo |
| Owner email | _(optional)_ the restaurateur email |

**Step-by-step**

1. **Settings → Organizations → Add organization**.
2. Fill the form:
   - Display name: `The Brown Butter`
   - Slug: `thebrownbutter`
   - Owner email: optional
   - SaaS plan: `Starter — ₹4,999/mo` (recommended)
   - Industry vertical: `Restaurant`
3. Click **Create**. You're taken to **Launch readiness** scoped to The Brown Butter.
4. Open **Manage** on the row and click **Apply plan modules**. The allowlist becomes `crm, cms, ecommerce` (matches `rest_starter`'s `includedModules`). This means the team will get **Reservations + Online ordering** but not Finance or Marketing — exactly what Starter promises.
5. (Optional, recommended) Set the storefront hostname (e.g. `order.thebrownbutter.com`).
6. **Manage → Invite admin…** for the restaurant manager (see §3.5).
7. Run the **Launch readiness** checklist for `thebrownbutter`.

> **Upgrade path:** when the customer outgrows Starter, change the plan to **Pro** (`rest_pro`) or **Enterprise** (`rest_enterprise`) and hit **Apply plan modules** again. The allowlist will widen automatically.

---

## 3 · Tenant: **Noze Perfume** (retail / e-commerce)

**Identity**

| Field | Value |
| --- | --- |
| Display name | `Noze Perfume` |
| Slug | `nozeperfume` |
| Industry vertical | **Retail / e-commerce** (`retail`) |
| SaaS plan | **Growth** (`retail_growth`) — ₹8,999/mo |
| Owner email | _(optional)_ shop owner email |

**Step-by-step**

1. **Settings → Organizations → Add organization**.
2. Fill the form:
   - Display name: `Noze Perfume`
   - Slug: `nozeperfume`
   - Owner email: optional
   - Industry vertical: `Retail / e-commerce`
   - SaaS plan: `Growth — ₹8,999/mo` (the plan ships `cms, ecommerce, crm, marketing_workspace` — exactly what a D2C brand needs).
3. Click **Create**.
4. Open **Manage** on the Noze Perfume row → **Apply plan modules** so the API allowlist exactly matches Growth (`cms, ecommerce, crm, marketing_workspace`). Finance and Team work stay off until they upgrade.
5. (Optional) Add the storefront hostname, e.g. `shop.nozeperfume.com`.
6. (Optional) Attach the owner's email under **Attach dashboard user**.
7. Run the **Launch readiness** checklist for `nozeperfume`.

> **Why retail is its own vertical now:** verticals control sidebar + dashboard layout. The `retail` pack uses the home-services sidebar today (stub pack) but has dedicated retail billing plans where every tier ships `ecommerce` + `cms` by default. As we productize a storefront-shaped sidebar, the same tenant will pick up the upgrade automatically — no migration needed.
>
> **Need pure storefront-only access?** Open **Manage → App modules**, toggle on **Limit which modules this org can use**, and keep only `cms` + `ecommerce`. The Growth plan still applies for billing; the allowlist enforces the smaller surface.

---

## 3.5 · Invite admins and how they get access (all tenants)

After you click **Create** and land on **Launch readiness**, the organization exists on the server but **no one can log in as that customer yet** until you add at least one dashboard admin.

### What happens under the hood

```text
You (super-admin)
  → Organizations → Manage → Invite admin
  → POST /api/auth/register/admin  { tenant_id, invite_team_member: true }
  → User row: tenantId = org, isDashboardMember = true, rbacRole = admin|manager|staff
  → Email: temporary password + set-password link (if SMTP is configured)

Invited person
  → Opens admin URL (e.g. admin.profixer.in/login)
  → Signs in with email + temp password (or sets password from link)
  → JWT includes tenant: { id, slug, verticalKey, featureModules, planKey }
  → Sidebar + API calls are scoped to that org only
```

**Launch readiness** does not send invites — it only tracks your go-live checklist in the browser. Use **Manage → Admins for this organization** to invite people.

### Path A — Invite a **new** admin (recommended)

Use this when the person does **not** already have a platform login.

1. **Settings → Organizations** → click **Manage** on the row (e.g. The Brown Butter / `test1`).
2. Scroll to **Admins for this organization**.
3. Click **Invite admin…**
4. Enter:
   - **Work email** — e.g. `ops@thebrownbutter.com`
   - **First / last name**
   - **Role** — `Admin` (full access), `Manager`, or `Staff`
5. Click **Send invite**.
6. They receive an onboarding email with a **temporary password** and setup link (requires backend SMTP). If email fails, the UI still creates the account — share credentials manually from your mail logs.
7. They open your admin site, sign in, and immediately see **only that organization's** data (modules respect the org's allowlist).

### Path B — Attach an **existing** user

Use this when someone already has an account (e.g. they signed up earlier as another org's admin).

1. **Manage** → **Attach existing user** → paste their email → **Attach**.
2. Backend sets `User.tenantId` to this org and promotes them to dashboard admin if needed.
3. **They must sign out and sign in again** — old JWTs do not pick up the new `tenantId`.
4. On next login, they are scoped to this organization.

### Path C — Owner email at **create** time (optional)

When creating the org, you can fill **Owner email**. If that email **already exists** as a `User` in MongoDB, the backend auto-attaches them as owner on create. If the email does not exist yet, creation still succeeds but **no user is attached** — use Path A afterward.

### What the invited user sees

| Check | Expected |
| --- | --- |
| Header / tenant indicator | Shows org name (e.g. The Brown Butter) |
| Sidebar | Modules allowed for that org (e.g. CRM, CMS, E-commerce for `rest_starter`) |
| API | `X-Tenant-Id` sent on requests; backend enforces isolation |
| Suspended org | Login blocked if you clicked **Suspend** on the row |

### Current orgs in Mongo (after isolation backfill)

| Org | Role | Next step for access |
| --- | --- | --- |
| **profixer** | Production home-services tenant (legacy data lives here) | Manage → **Invite admin…** if no owner yet |
| **test** | Empty sandbox — use for 2-tenant isolation smoke tests | Invite a test admin; create one booking and confirm profixer cannot see it |
| **thebrownbutter** | Restaurant reference tenant | Create via UI or `npm run onboard:reference-tenants` in fixer-backend |
| **nozeperfume** | Retail reference tenant | Same as above |

After each invite, open **Manage** again and confirm **Isolation summary → Users: 1** (or more). Business rows (bookings, CRM, etc.) should be **0** on a brand-new org until that org creates data.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| Invite fails with user limit | Plan `maxUsers` reached — upgrade plan or remove unused members on **Users** page |
| No email received | Check backend SMTP env; user may still exist — try **Attach** or reset password flow |
| User logs in but sees wrong org | They need sign-out/sign-in; or you attached the wrong email |
| User sees modules they shouldn't | **Manage → App modules** — tighten allowlist and save |
| Super-admin testing as customer | Use **Launch** on the row first (sets browser org context), then invite, or sign in as the invited user in a private window |

---

## 3.6 · SaaS plan & billing — Razorpay

Razorpay is the **primary** payment processor for SaaS plans (INR-first; the same Razorpay key the storefront uses also powers SaaS upgrades). Stripe is kept as a fallback for international cards.

### What's wired

| Surface | Where | Who pays |
| --- | --- | --- |
| **Organizations → Manage → SaaS plan & billing → _Charge with Razorpay_** | `PlatformTenantsPage` | Super-admin (on behalf of tenant) |
| **Settings → Billing & plans → _Pay with Razorpay_** | `BillingUpgradePage` | Tenant admin (self-serve) |

Backend endpoints (require `Authorization: Bearer <jwt>`):

```text
POST /api/billing/razorpay/create-order   # body: { planKey, verticalKey?, tenantId? }
POST /api/billing/razorpay/verify         # body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, tenantId? }
```

- For a **tenant admin** the JWT carries `tenantId`; `tenantId` in the body is rejected if it doesn't match.
- For a **super-admin** (no JWT tenant), pass the target `tenantId` in the body — that's exactly what the Manage panel does.

### Flow (one monthly charge)

```text
admin selects plan ──► POST /create-order ──► server creates Razorpay Order (₹ × 100 paise)
                                                          │
                                                          ▼
                                             Razorpay Checkout modal opens
                                                          │
                                              user enters UPI / card / netbanking
                                                          │
                                                          ▼
                                  POST /verify { order_id, payment_id, signature }
                                                          │
                                                          ▼
              server HMAC-SHA256(order|payment, KEY_SECRET) → must equal signature
                                                          │
                                                          ▼
                  tenant.planKey, billingStatus=active, razorpayCurrentPeriodEnd += 30 days
                                                          │
                                                          ▼
                                    invalidateTenantAccessCache(tenantId)
```

The server **re-reads** `plan_key` from the Razorpay order's `notes` (not the client body) before activating, so a tampered client cannot pay for Starter and claim Scale.

### Operator: charge a tenant directly

1. Open **Settings → Organizations → Manage** for the tenant.
2. Confirm the **SaaS plan** dropdown is set to the right plan (e.g. `retail_growth`).
3. Click **Charge with Razorpay**.
4. The Razorpay modal opens. Pay with a test card in dev (`4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`).
5. On success the toast shows _"Plan activated — Active until DD/MM/YYYY"_. The detail panel now displays:
   - `Status: active`
   - `provider: razorpay`
   - `Current period ends: <30 days from now>`
   - `last payment: pay_xxxxx…`

### Tenant admin: self-serve

1. Sign in as the tenant admin.
2. Navigate to **Settings → Billing & plans**.
3. Pick a plan card and click **Pay with Razorpay**.
4. Same modal flow. After verify the page reloads to `/settings/billing?success=1`.

### Required env (backend)

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

These are the same keys the storefront uses (`PaymentService.createRazorpayOrder` for bookings/wallet top-ups). No separate Razorpay account or sub-merchant needed for v1.

### Plan price catalog (per month, INR)

| Vertical | Plan key | Price | Limits |
| --- | --- | --- | --- |
| `home_services` | `hs_starter` / `hs_growth` / `hs_scale` | ₹2,999 / ₹7,999 / ₹14,999 | 5 / 25 / 100 users |
| `restaurant` | `rest_starter` / `rest_pro` / `rest_enterprise` | ₹4,999 / ₹9,999 / ₹19,999 | 10 / 40 / 200 users |
| `salon` | `salon_starter` / `salon_growth` / `salon_scale` | ₹3,499 / ₹7,499 / ₹12,999 | 8 / 30 / 80 users |
| `retail` | `retail_starter` / `retail_growth` / `retail_scale` | ₹3,999 / ₹8,999 / ₹16,999 | per pack manifest |

> **Adding a plan / changing a price?** Update both `PLAN_PRICES_INR` in `fixer-backend/src/modules/billing/services/RazorpaySaasBillingService.ts` and the same plan in `fixer-admin/src/verticals/<vertical>/billingPlans.ts`. The frontend display price must match the backend charge price — verification will reject a stale plan key.

### Audit trail

Every Razorpay event lands in `tenant_billing_events`:

```text
provider:  razorpay
eventType: order.created | payment.captured | signature.invalid
externalId: order_xxx | pay_xxx
payloadSummary: { planKey, amountPaise, verticalKey }
```

Use this collection to reconcile against the Razorpay dashboard at month-end.

### Renewals / cancellation (v1 behaviour)

- **Renewal** is currently a re-purchase: the admin runs **Charge with Razorpay** again on or before `razorpayCurrentPeriodEnd`. The new 30-day period extends from the existing end-date (no lost days for early renewers).
- **Cancellation** = stop charging. `billingStatus` stays `active` until the period ends; the plan key is preserved so reports work.
- When you move to **Razorpay Subscriptions** (recurring) the `razorpaySubscriptionId` column on `Tenant` is already there to hold the `sub_xxx` id — the controller surface (`/create-order`, `/verify`) stays the same.

---

## 4 · Post-create verification (every tenant)

Run this on each of the three tenants. Treat any miss as a launch blocker.

1. **Table sanity** — Open Organizations. Each row should show:
   - Status: **Active** (not Suspended)
   - Billing: `none` until Razorpay charge (or Stripe webhook)
   - App modules: matches the table at the top of this doc
2. **JWT isolation** — Open the Manage detail for one tenant and read **Isolation summary**:
   - Users ≥ 1 if you attached an owner; 0 otherwise.
   - All other counts = **0** on a **new** org (no bookings/CRM/invoices from `profixer`).
3. **Mongo tenant isolation audit** (backend repo):

   ```bash
   cd fixer-backend
   npm run audit:tenant-isolation:strict
   # Expect: ✓ Tenant isolation OK
   ```

   Every tenant-scoped collection should show **Open = 0** (no rows missing `tenantId`). Legacy profixer data was backfilled with `npm run backfill:tenant-id` (assigns unscoped rows to slug `profixer`).

4. **Two-tenant API smoke test** (recommended before go-live):

   | Step | Actor | Expected |
   | --- | --- | --- |
   | 1 | Log in as **thebrownbutter** admin (or `test`) | Bookings / invoices lists empty |
   | 2 | Create one CRM contact or booking | Succeeds |
   | 3 | Log in as **profixer** admin | That new row **not** visible |
   | 4 | `mongosh`: `db.bookings.countDocuments({ tenantId: ObjectId("<brown-butter-id>") })` | `1` after step 2 |

5. **Owner login** — If you attached a user, ask them to **sign out and sign back in**. After login their JWT will carry `tenantId`. Confirm the header shows the tenant name and the sidebar omits any modules outside the allowlist.
6. **API module gate** — With the owner's token, `GET /api/crm/contacts` → 200 when `crm` is on the allowlist. `GET /api/finance/overview` → 403 `TENANT_FEATURE_DENIED` for `rest_starter` / `retail_growth` (no finance module).
7. **Storefront** — Open **View site** on the row (or `{slug}.profixer.localhost:3001` in dev). Restaurant → menu/reserve; retail → products/checkout.
8. **Launch readiness** — On `/settings/saas`, scope to each tenant and mark the six checklist items. Progress saves per tenant id in browser localStorage.

### Bootstrap reference tenants (CLI)

If `thebrownbutter` / `nozeperfume` are not in the table yet:

```bash
cd fixer-backend
ALLOW_DESTRUCTIVE=1 npm run onboard:reference-tenants
```

This creates (or syncs) both orgs with the plan keys and `featureModules` from §2–§3. Then continue with **Invite admin** and the checks above.

---

## 5 · Rollback / cleanup

If a tenant was created in error:

1. **Manage → Danger zone → Delete tenant…**
2. Type the slug exactly to confirm.
3. Click **Delete tenant**.

The backend cascade-removes every tenant-scoped collection (CRM, AMC, marketing, team work, boards, finance, domains). Dashboard users are **detached** from the tenant — their auth accounts are kept so they can be re-attached elsewhere.

---

## 6 · Operator cheat sheet

```text
TENANT_FEATURE_KEYS (backend allowlist values)
  cms                 # Pages, blog, menus, media, public site
  crm                 # Contacts, companies, deals, activities
  finance             # Expenses, budgets, P&L
  marketing_workspace # Campaigns, calendar, social
  team_work           # Boards, sprints, ceremonies
  bazaar              # Marketplace admin
  ecommerce           # Products, orders, storefront catalog

VERTICALS (sidebar + dashboard pack)
  home_services       # full pack    — Profixer
  restaurant          # full pack    — The Brown Butter
  salon               # full pack
  retail              # stub pack    — Noze Perfume  (retail_starter/growth/scale)
  fitness             # stub pack
  healthcare          # stub pack
  education           # stub pack
  real_estate         # stub pack
  b2b_services        # stub pack

PLANS WITH ECOMMERCE BUILT IN
  retail_starter      # cms + ecommerce                                — ₹3,999
  retail_growth       # + crm + marketing_workspace                    — ₹8,999
  retail_scale        # + finance + team_work + bazaar                 — ₹16,999
  rest_starter        # crm + cms + ecommerce                          — ₹4,999
  rest_pro            # + finance + marketing                          — ₹9,999
  rest_enterprise     # + team_work                                    — ₹19,999
  salon_growth        # crm + cms + finance + marketing + ecommerce    — ₹7,499
```

**Useful endpoints (super-admin only, requires `manage_system_settings`)**

```
GET    /api/platform/tenants                  # list all
POST   /api/platform/tenants                  # create
GET    /api/platform/tenants/:id              # get one
PATCH  /api/platform/tenants/:id              # update fields (plan, modules, vertical)
DELETE /api/platform/tenants/:id?confirmSlug= # cascade delete
GET    /api/platform/tenants/:id/isolation-summary
POST   /api/platform/tenants/:id/users        # attach user by email
GET    /api/platform/tenants/:id/domains      # list custom hostnames
POST   /api/platform/tenants/:id/domains      # add hostname
DELETE /api/platform/tenants/:id/domains/:dId # remove hostname
GET    /api/platform/tenants/resolve?host=    # public — used by storefronts
```

**Equivalent curl (in case the UI is down)**

```bash
# Create Profixer
curl -X POST "$API/api/platform/tenants" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Profixer","slug":"profixer","planKey":"hs_growth","verticalKey":"home_services"}'

# Create The Brown Butter
curl -X POST "$API/api/platform/tenants" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"The Brown Butter","slug":"thebrownbutter","planKey":"rest_starter","verticalKey":"restaurant"}'

# Create Noze Perfume (retail vertical, Growth plan)
curl -X POST "$API/api/platform/tenants" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Noze Perfume","slug":"nozeperfume","planKey":"retail_growth","verticalKey":"retail"}'

# (optional) tighten allowlist further to storefront-only
curl -X PATCH "$API/api/platform/tenants/<NOZE_ID>" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureModules":["ecommerce","cms"]}'
```

---

## 7 · Done — summary table to file with the customer

| Tenant | Slug | Vertical | Plan | App modules (allowlist) | Hostname |
| --- | --- | --- | --- | --- | --- |
| Profixer | `profixer` | `home_services` | `hs_growth` | `crm, cms, finance, marketing_workspace, team_work` | _e.g._ `app.profixer.com` |
| The Brown Butter | `thebrownbutter` | `restaurant` | `rest_starter` | `crm, cms, ecommerce` | _e.g._ `order.thebrownbutter.com` |
| Noze Perfume | `nozeperfume` | `retail` | `retail_growth` | `cms, ecommerce, crm, marketing_workspace` | _e.g._ `shop.nozeperfume.com` |
