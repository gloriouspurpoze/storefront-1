# Tenant onboarding & RBAC — full operational runbook

**Audience:** Platform operators, implementation engineers, customer success.  
**Goal:** Stand up a **new organization (tenant)**, assign **what product modules they may use**, provision **dashboard login** (email + password / invite), and confirm the customer sees **only entitled surfaces** after sign-in.  
**Related:** `docs/PARTNER_ONBOARDING_SOP.md` (partner-facing), `docs/PRODUCT_AND_SAAS_PLAYBOOK.md`, backend **`fixer-backend/docs/TENANT_PLATFORM_API.md`**.

---

## 1. Concepts (read once)

### 1.1 Tenant vs platform operator vs tenant admin

| Actor | Typical JWT | What they do |
|-------|-------------|----------------|
| **Platform operator** | `super_admin`, or **`admin` without `tenantId`** | Creates tenants, billing posture, module allowlists, domain mappings; may send **`X-Tenant-Id`** to act on a specific org’s data where APIs support it. |
| **Tenant admin / staff** | **`admin` with `tenantId`** (org-scoped) | Runs day-to-day operations inside **their** organization only: CRM, CMS, finance, etc., subject to **RBAC** and **module entitlements**. |

**Why two “admin” shapes exist:** Legacy single-tenant deployments used platform-wide admins. Multi-tenant SaaS keeps that path for your internal team while adding **tenant-bound** admins for each customer.

### 1.2 Two independent enforcement layers (both must be understood)

1. **Org module entitlements (`Tenant.featureModules`)** — *What product areas exist for this customer’s contract?*  
   - Stored on the **tenant** document in MongoDB.  
   - Enforced on specific API routers via **`requireTenantFeature`** (backend).  
   - Keys used today: `cms`, `crm`, `finance`, `marketing_workspace`, `team_work`, `bazaar`.  
   - **Omitted or cleared (`null`)** → tenant users get **full** gated-module access (default / legacy).  
   - **Non-empty array** → **allowlist only**; anything not listed returns **403** `TENANT_FEATURE_DENIED` even if the user’s RBAC role would allow it.  
   - **Empty array `[]`** → **no** gated modules (hard lock until you grant keys again).

2. **User RBAC (roles & permissions)** — *What may this specific person do inside features they’re allowed to see?*  
   - Stored on the **user** (`rbacRole`, `rbacPermissionMode`, `permissions`, etc.) and enforced with **`requirePermission`** / **`requireAnyPermission`** on routes and route guards in **fixer-admin** (`src/config/rbac.config.ts`).  
   - **Why separate from modules:** One tenant might have Finance enabled, but only two users may `manage_finance`; others only `view_finance`.

**Industry pattern:** “Entitlement / plan” (tenant) × “authorization / least privilege” (user). Never substitute RBAC for tenant isolation or module packaging—they solve different problems.

### 1.3 How tenant context reaches the API

- **Tenant-scoped JWT:** After login, access tokens include **`tenantId`** when the user’s `User.tenantId` is set. The backend **`authenticateToken`** loads the tenant row (active, not suspended), attaches **`req.tenantAccess`**, and applies module gates.  
- **Header `X-Tenant-Id`:** fixer-admin can send this (see `src/lib/saasEnv.ts` → `TENANT_HEADER`). The backend **rejects** requests where the header disagrees with JWT `tenantId` (anti-spoofing).  
- **Platform operator:** Often **no** `tenantId` on JWT; for APIs that support targeting an org (e.g. public site theme), they pass **`X-Tenant-Id`**.

### 1.4 Why “attach user then re-login”

Attaching a user to a tenant updates **`User.tenantId`** in the database. Existing JWTs were issued **before** that claim existed. **Industry standard:** require a **fresh login** (or token refresh that re-issues claims from DB—only valid if your refresh path re-reads tenant membership). This codebase documents **re-login** after attach.

---

## 2. Prerequisites

### 2.1 Who may run provisioning

- **fixer-admin:** User with **`manage_system_settings`** (and route access to **`/settings/tenants`**).  
- **Backend:** Same elevated posture for **`/api/platform/tenants`** (platform operator JWT + permission chain).

### 2.2 Environment (high level)

| Layer | Purpose |
|-------|--------|
| **MongoDB** | `Tenant`, `User`, `TenantDomain`, RBAC collections, tenant-scoped business data. |
| **fixer-backend** | Tenant lifecycle APIs, auth, module gates, CMS/theme APIs. |
| **fixer-admin** | `REACT_APP_API_URL`, optional `REACT_APP_SAAS_MODE=true`, optional `REACT_APP_TENANT_HEADER`, optional `REACT_APP_DEFAULT_TENANT_ID` (**dev only**). |
| **SMTP (recommended)** | Team invite emails (`invite_team_member`) send temp password + set-password link; without SMTP, operators must distribute credentials securely out-of-band. |

---

## 3. End-to-end onboarding procedure

Use **either** the admin UI **or** direct API calls; steps mirror each other.

### Phase A — Commercial & scope (why)

**Steps**

1. Capture **legal entity**, **plan**, **modules purchased**, **seat policy**, **support SLA**, **go-live date**.  
2. If you process customer PII: **DPA**, subprocessors, retention—document in ticket.

**Why:** Module allowlists and RBAC should trace to **contract**, reducing “why can’t I see Finance?” disputes and audit gaps.

---

### Phase B — Create the tenant (organization row)

**Steps (fixer-admin)**

1. Sign in as a **platform operator**.  
2. Open **`/settings/tenants`** → **New tenant**.  
3. Enter **display name**, unique **slug** (URL-safe; becomes org identifier in URLs and branding).  
4. Optionally set **plan key** (metadata; wire to billing when you automate).  
5. Optionally set **owner email** — **only if that user already exists** in MongoDB: backend will attach `tenantId` and promote to dashboard admin when appropriate.  
6. Create.

**Steps (API)**

- `POST /api/platform/tenants` with `{ "name", "slug", "planKey?", "ownerEmail?" }`.

**Why slug matters:** Stable external identifier; used in resolution, branding, and operational conversation (“the `acme-services` org”).

**Outcome:** A **`Tenant`** document with `_id` you will reference everywhere (domains, billing metadata, headers).

---

### Phase C — Module entitlements (contract → enforcement)

**Steps (fixer-admin)**

1. **`/settings/tenants`** → **Manage** on the row.  
2. Under **API module access**:  
   - Leave **unrestricted** if the customer bought full product (field unset / full access).  
   - Or enable **Restrict modules** and check only what they paid for.  
3. **Save module access**.

**Steps (API)**

- `PATCH /api/platform/tenants/:id` with `{ "featureModules": ["crm","cms"] }` or `{ "featureModules": null }` to clear restriction.

**Why:** Prevents “shadow IT” usage of modules not on the invoice and gives Sales/CS a single lever aligned with backend enforcement.

**Operational note:** Tenant access metadata is cached briefly server-side (~1 minute); after changes, expect a short delay before all API nodes reflect the new allowlist.

---

### Phase D — Dashboard identity (email + password / invite)

You need a **User** row with:

- `userType`: `admin` (tenant staff; never attach **`super_admin`** to a tenant—backend rejects it).  
- **`tenantId`**: must equal this tenant’s `_id`.  
- **RBAC**: `rbacRole` and/or explicit permissions appropriate for their job.

#### Path D1 — User already exists (e.g. migrated account)

1. **`/settings/tenants`** → **Manage** → **Attach dashboard user by email** → email → **Attach**.  
2. Or `POST /api/platform/tenants/:id/users` with `{ "email" }`.  
3. Tell the user: **log out everywhere and log in again** so the JWT includes `tenantId`.

**Why attach is explicit:** Avoids accidentally linking the wrong person during tenant creation; keeps audit trail (“who attached whom”).

#### Path D2 — New user (recommended: team invite)

1. Ensure **organization context** exists before clicking **Create**:  
   - **Tenant admin:** their JWT already carries `tenantId` after login.  
   - **Platform operator:** open **`/settings/tenants`**, use **Manage** / checklist link so Redux **`tenantId`** is set (same value sent as **`X-Tenant-Id`** on API calls).  
2. Open **Users** → **Team members** → create member (invite flow). The backend **`POST /api/auth/register/admin`** now sets **`User.tenantId`** automatically when either the **JWT includes `tenantId`** or the body includes **`tenant_id`** (platform-only path when JWT has no tenant).  
3. If you invite **without** org context, the UI warns you — then use **Attach** (`POST /api/platform/tenants/:id/users`) or recreate after selecting an org.  
4. User completes invite (SMTP temporary password + link when configured). First tokens issued after registration already reflect **`tenantId`** when it was set at create time.

#### Path D3 — New user (direct password, no email)

1. Same **org context** rule as D2 (JWT tenant or Redux tenant + optional **`tenant_id`** on **`POST /api/auth/register/admin`**).  
2. **Attach** is only needed if the user was created with **no** tenant context (legacy mistake).  
3. Deliver password through **your approved secure channel** (never Slack/email plaintext in regulated environments without policy).

**Why invites win in production:** Reduces shared passwords, forces password choice, and preserves evidence of provisioning.

---

### Phase E — RBAC for tenant staff (fine-grained)

**Steps**

1. In **Users / Team members**, edit the dashboard user.  
2. Assign **`rbacRole`** (`admin`, `manager`, `support`, … — see `src/config/rbac.config.ts` and `src/types/rbac.types.ts`).  
3. Optionally set **`rbacPermissionMode`** to **`explicit`** and a minimal **`permissions`** list for least-privilege operators.

**Why roles:** Operations scales—CS vs Finance vs Marketing shouldn’t share the same destructive capabilities.

**Interaction with modules:** If **Finance** module is off at tenant level, **`view_finance`** on the user is irrelevant—the API returns **403** `TENANT_FEATURE_DENIED` before finance RBAC runs.

---

### Phase F — Domain & public site (optional but common)

1. **`/settings/tenants`** → add **custom hostname** (`TenantDomain`).  
2. Complete **DNS + verification workflow** your platform defines; **`GET /api/platform/tenants/resolve?host=`** only returns **verified** mappings.  
3. **Site appearance / theme:** `Tenant.publicSiteTheme` via **`/api/cms/public-site-theme`** (requires **CMS** module entitlement for tenant JWTs).

**Why:** Separates **staff admin host** from **consumer-facing host** and keeps hostname spoofing out of tenant resolution until verified.

---

### Phase G — Validation (tenant signs in and works)

**Checklist**

| Check | Expectation |
|-------|-------------|
| Login | User receives tokens; profile/populated user shows **tenant** context when applicable. |
| Suspension | If tenant **suspended** or **inactive**, login **blocked** (backend guard). |
| Module gate | Calling a gated API without entitlement → **403** `TENANT_FEATURE_DENIED`. |
| RBAC | Inside an entitled module, missing permission → **403** from permission middleware. |
| Header spoof | `X-Tenant-Id` ≠ JWT `tenantId` → **403** `TENANT_FORBIDDEN`. |
| Cross-tenant | User A (`tenantId` T1) cannot read T2 rows—verify with IDs in staging (automation recommended). |

**Why:** This is the minimum **acceptance test** for SaaS onboarding before commercial go-live.

---

## 4. Role & permission reference (fixer-admin UI)

- **Canonical mapping:** `src/config/rbac.config.ts` (`rolePermissionsMap`, route permissions).  
- **Route guards:** `src/config/app-routes.ts` (which sidebar/pages require which permission keys).  
- **Backend:** Permission strings on routes must match Mongo **Permission** documents / seeds (e.g. CRM: `view_crm`, `manage_crm`; Finance: `view_finance`, `manage_finance`; Team work: `view_team_tasks`, `manage_team_tasks`, `manage_team_projects`; Marketing workspace uses coupon/referral/system keys—see marketing router).

**Operational tip:** When customers ask “why is menu X missing?”, debug in order: **tenant suspended?** → **module allowlist?** → **RBAC role?** → **route permission map?**

---

## 5. Stripe / billing hook (when you turn it on)

- Put **`tenant_id`** (Mongo ObjectId string) on Stripe **Subscription** or **Checkout Session** metadata so webhooks update **`Tenant`** billing fields.  
- Keep **commercial module list** aligned with **`featureModules`** (manual today; automate mapping per `planKey` when ready).

---

## 6. Handoff template (copy per customer)

| Field | Value |
|-------|--------|
| Customer legal name | |
| Tenant `_id` | |
| Slug | |
| Modules enabled (`featureModules` or “full”) | |
| Owner / primary emails | |
| RBAC roles assigned | |
| Custom domains | |
| Integration pattern (headless / hostname / hybrid) | |
| Verified go-live date | |

---

## 7. FAQ

**Q: Can one email belong to two tenants?**  
Today’s attach model assumes **one `User.tenantId`**. Typical SaaS uses **one user per org** or **SSO with separate IdP groups per org**. If you need multi-org users, plan **membership table + claims**—not covered by this runbook.

**Q: Is RBAC enough for tenant isolation?**  
No. Isolation is **`tenantId` on data** + **server-side filters** + **tests**. RBAC and module gates **authorize**; they don’t replace **data scoping**.

**Q: Where is the checklist UI?**  
**`/settings/saas`** — browser-local checklist keyed per tenant id for launch readiness; not a server audit log.

---

*Keep this document aligned with `fixer-backend/docs/TENANT_PLATFORM_API.md` whenever platform routes or `TENANT_FEATURE_KEYS` change.*
