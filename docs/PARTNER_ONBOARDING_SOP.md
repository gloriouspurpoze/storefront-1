# Partner / client onboarding SOP (multi-tenant)

**Purpose:** Repeatable steps when a **new organization** uses your **multi-tenant admin + API**—including clients who **keep their existing website**.

**Audience:** Founder, ops, implementation engineer.

**Related:** `docs/PRODUCT_AND_SAAS_PLAYBOOK.md`, admin route **`/settings/saas`** (platform readiness checklist), **`/cms/site-appearance`** (public theme tokens).

---

## 1. Definitions

| Term | Meaning |
|------|--------|
| **Tenant** | One paying organization (one isolation boundary in DB/API). |
| **Staff admin** | Users who log into **fixer-admin** (your React admin). |
| **Consumer site** | Customer-facing site—can be **yours** (e.g. profixer.in) or **the client’s** existing stack. |

---

## 2. Pre-flight (before provisioning)

1. **Commercial:** Plan name, modules enabled, seat limits, support SLA, billing start date.
2. **Legal:** If you process their users’ PII as processor—**DPA** path, subprocessors list, data retention.
3. **Technical discovery:**
   - Does the client keep **their own domain/site**? If yes: integration pattern (**§5**).
   - Single vs multi-location? Payment rails? Marketplace vs pure bookings?

---

## 3. Tenant provisioning (backend—required)

> The admin UI sends **`Authorization`** and, when configured, **`X-Tenant-Id`** (or custom header via `REACT_APP_TENANT_HEADER`). **Isolation is enforced only if the API validates membership + tenant on every request.**

**Minimum backend checklist:**

1. **Create tenant/org row** with stable UUID (or equivalent).
2. **Create org owner user** (or invite flow) and attach **`tenant_id`** + RBAC role.
3. **Return tenant context** on login/profile (`tenant`, `tenant_id`, `tenant_slug`, etc.—see `src/lib/extractTenantFromAuth.ts` shapes).
4. **Apply entitlements** (feature flags / module gates) for that tenant’s plan.
5. **Optional:** Map **custom hostname** → `tenant_id` for public APIs (**§5B**).

**Admin UX helpers already in this repo:**

- **`/settings/saas`** — readiness checklist, tenant context display, optional billing/legal URLs (`REACT_APP_BILLING_PORTAL_URL`, legal URLs in `.env.example`).
- **`REACT_APP_SAAS_MODE=true`** — tenant affordances in shell (org indicator).
- **`REACT_APP_DEFAULT_TENANT_ID`** — dev only; production must come from auth/profile.

---

## 4. Staff onboarding (first week)

1. **Invite admins** (team invite flow: `/auth/accept-invite`).
2. **Configure tenant-wide settings** (business profile, timezone, currency—Settings).
3. **Turn on modules** matching contract (CRM, finance, marketplace, etc.—RBAC).
4. **Content / growth:**
   - CMS structure (menus, pages, homepage sections).
   - **`/cms/site-appearance`** — export/save **public theme tokens**; wire **`GET/PUT /cms/public-site-theme`** on API when ready so **consumer properties** read the same JSON.
5. **Smoke test:** bookings/payments path on **staging tenant**; verify **no cross-tenant IDs** in URLs or API responses.

---

## 5. Client already has a website — integration patterns

Pick **one primary pattern** per client; document it in the CRM/deployment ticket.

### A. Headless / API-first (recommended default)

- Their site stays on **their domain**.
- They consume **your public or partner APIs**: catalog, availability, booking creation, CMS snippets, theme tokens.
- **Credentials:** issue **scoped API keys** or **OAuth client** per tenant for server-side calls; never expose full admin JWT on their frontend.

**Pros:** Clean separation; admin stays on your host; fastest long-term.  
**Cons:** Their engineering must integrate.

### B. Hostname → tenant (reverse proxy or edge routing)

- Same app builds; **`Host`** header maps to `tenant_id` on API.
- Useful for **`client-brand.yourplatform.com`** or later **`www.client.com`** (custom domain).

**Pros:** One codebase; strong branding path.  
**Cons:** SSL + routing discipline; support burden.

### C. Hybrid migration

- **Phase 1:** Widget/API for booking only; marketing unchanged.
- **Phase 2:** Move blog/SEO into your CMS; redirect old URLs.
- **Phase 3:** Full consumer app on your stack if desired.

### D. What not to promise on day one

- Drag-and-drop **website builder** parity with Webflow.
- “Paste arbitrary HTML” inside admin as primary integration—that bypasses your schema and tenants.

---

## 6. Database posture (choose and document)

**Default for most SaaS:** Shared DB + **`tenant_id` on every tenant-owned row** + mandatory query filters + automated tests for isolation.

**Escalate** to schema-per-tenant or DB-per-tenant only for **contractual/regulatory** reasons—automate provisioning if you do.

---

## 7. Go-live checklist

- [ ] Tenant id stable; owners cannot see other tenants’ data (manual + automated checks).
- [ ] Billing live or pilot billing documented (who invoices whom).
- [ ] Observability: logs/metrics **tagged by tenant_id**.
- [ ] Backup/restore tested for **tenant-scoped** disaster scenarios where promised.
- [ ] Support path + escalation contact shared with client.
- [ ] If external site: API keys rotated from staging; rate limits set.

---

## 8. Handoff artifact (fill per client)

| Field | Value |
|-------|--------|
| Client legal name | |
| Tenant id | |
| Plan / modules | |
| Primary domain | |
| Integration pattern (A/B/C) | |
| API key ids / OAuth client ids | |
| Go-live date | |
| Owner email(s) | |

---

*Revision: align this SOP whenever backend tenant APIs or hostname mapping ship.*



How you onboard a new client (multi-tenant admin)
You are selling one product (your admin + API) to many organizations. Each client = one tenant (organization). Onboarding is creating that tenant and giving their users a safe, isolated slice of your platform—not cloning your repo per customer.

1. What “done” looks like for one client
Step	Outcome
Commercial
Contract, plan (seats/modules), SLA/support channel, data-processing terms if you touch PII.
Tenant created
Stable tenant/org id in your DB; branding slug optional (acme → acme.yourproduct.com or custom domain later).
Identity
At least one org owner admin user invited; RBAC matches what they paid for.
Entitlements
Feature flags / limits (modules, seat cap, API rate limits) tied to billing when you productize it.
Go-live
Their staff uses your admin URL (or white-label host); API calls carry tenant context; consumer site (theirs or yours) reads public config/CMS/theme from your API.
Your admin already reflects tenant context (X-Tenant-Id–style headers from Redux). The CEO rule: every serious customer assumes you enforce isolation on the server, not in the browser.

2. Managing the database (three real patterns)
Pick one primary model; don’t improvise per customer without a rulebook.

Shared database, shared schema, tenant_id on every tenant-owned row

Pros: Simple ops, one migration pipeline, lowest cost at scale.
Cons: Highest discipline burden—every query must filter by tenant; one bug can leak data.
Fit: Most vertical SaaS until you hit enterprise/regulatory pressure.
Shared DB, schema per tenant (Postgres schemas)

Pros: Stronger isolation feeling; easier “export tenant.”
Cons: Migration explosion at scale; tooling complexity.
Database per tenant

Pros: Maximum isolation; some enterprises prefer it.
Cons: Ops nightmare unless automated; expensive.
CEO default: Start with (1) plus audit logs, row-level checks, and automated tests for cross-tenant access. Add (3) only for whale deals or regulated industries.

3. Managing the API (what must be true)
Resolve tenant once per request: JWT claims +/or explicit header—but always verify the user belongs to that tenant. Never trust a raw header alone for authorization.
Authorize twice: “Is user logged in?” then “Is this user allowed this tenant and this permission?”
Background jobs, webhooks, uploads: Every path must carry tenant_id (S3 prefixes, queue payloads, etc.).
Public storefront APIs: Separate surface (/public/... or host-based tenant resolution) with read-only scopes where possible.
4. Client already has a website — how do you “connect” them?
You are not merging their old site into your React admin repo. You integrate:

A. Headless / API-first (best fit with what you built)

Their site (WordPress, Next.js, whatever) calls your APIs for: bookings catalog, CMS blocks, theme tokens, promotions.
Their domain stays theirs; they add API keys or OAuth-style public client credentials per tenant for safe reads.
Your admin remains staff-only on your domain.
B. Reverse proxy / path split

e.g. www.client.com/app → your consumer app; rest stays static marketing.
Tenant often inferred from hostname → map host → tenant_id on the API.
C. Embedded widgets / iframe (tactical, weak long-term)

Quick for “book now” widgets; not a platform strategy alone.
D. Migration narrative

Phase 1: Keep their marketing site; integrate checkout/booking + data via API.
Phase 2: Move SEO pages / blog into your CMS gradually (your admin already has CMS surfaces).
Phase 3: Optional full front door on your stack if they want one throat to choke.
CEO line to customers: “We’re your operating system and APIs; your domain can stay. We connect through authenticated APIs and optional hostname mapping—not by rebuilding your marketing site on day one.”

5. Practical onboarding checklist (what you do internally)
Create tenant + plan entitlements.
Create owner user + send invite (your team-invite flow aligns here).
Configure modules (CRM, finance, marketplace on/off).
If they have an existing site: document hostname, integration type (API vs proxy), credentials issuance.
Seed catalog/locations if needed; train 2–3 admins.
Cutover window: read-only freeze or dual-write only if you must—prefer clean API cutover.
Monitor: errors and GMV tagged by tenant_id.
6. What you still need if this is “real” SaaS
Your admin UI added readiness tooling; production multi-tenancy still requires backend: tenant lifecycle APIs, billing webhooks, isolation audits, and optionally per-tenant domains and SSO for enterprise.

If you want this turned into a one-page “Partner onboarding SOP” inside docs/ for your team, say so and we can add it as a short markdown runbook.