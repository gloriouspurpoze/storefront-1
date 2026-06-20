# Tenant Permissions Reference — Super Admin Guide

> **Audience:** Platform operators (super admins) who provision tenants and assign what each person may do.  
> **Last updated:** 2026-06-12  
> **Related:** [`TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md`](../TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md), [`08-onboard-three-tenants-runbook.md`](./08-onboard-three-tenants-runbook.md), [`11-tenant-basic-flow-audit.md`](./11-tenant-basic-flow-audit.md), backend [`ADMIN_PERMISSIONS.md`](../../../ADMIN_PERMISSIONS.md)

---

## How to use this document

When a customer asks *“Why can’t Maria edit the storefront but John can?”*, debug in this order:

1. **Is the tenant active?** Suspended orgs block login entirely.
2. **Module entitlements** — Does the tenant have the product area enabled (`featureModules`)?
3. **User role** — What template role does the person have (`admin`, `manager`, `staff`)?
4. **Explicit permissions** — Did someone override the role with a custom chip list?
5. **Route / API guard** — Does the specific page or API need a permission they lack?

This guide covers steps 2–4 in detail and lists every permission key you can assign.

---

## Two layers (do not confuse them)

| Layer | Stored on | Who sets it | Question it answers |
|-------|-----------|-------------|---------------------|
| **Module entitlements** | `Tenant.featureModules` | **Super admin** in **Settings → Platform tenants** | *“Did this customer pay for CMS / CRM / Finance?”* |
| **User RBAC** | `User.rbacRole`, `User.permissions[]` | **Super admin** or **tenant admin** in **Settings → Access** or **Users** | *“What may this specific person do inside enabled modules?”* |

Both layers must pass. A user with `manage_cms` on a tenant whose `featureModules` excludes `cms` still gets **403** from the API.

### Module keys (`featureModules`)

| Key | Product area gated |
|-----|-------------------|
| `cms` | CMS admin, public site theme, legacy content tools |
| `crm` | CRM (leads, contacts, deals) |
| `finance` | Company finance / expenses |
| `marketing_workspace` | Marketing planning workspace |
| `team_work` | Internal team tasks |
| `bazaar` | Bazaar marketplace admin |
| `ecommerce` | E-commerce–specific surfaces |

**Allowlist behaviour**

| `featureModules` value | Effect |
|------------------------|--------|
| Omitted or `null` | Full access to all gated modules (default / legacy) |
| `["crm","cms"]` | Only listed modules; everything else **403** |
| `[]` | **No** gated modules until you grant keys again |

Storefront Studio (`/settings/storefront`) is available to all tenant admins by default; it is **not** behind `requireTenantFeature('cms')`, but CMS pages under `/cms/*` are.

---

## Who is who

| Actor | JWT shape | Scope |
|-------|-----------|-------|
| **Platform operator (super admin)** | `userType: super_admin`, usually no `tenantId` | All tenants; platform settings; can override storefront locks |
| **Platform operator (legacy)** | `userType: admin`, no `tenantId` | Same elevated access as above for most platform APIs |
| **Tenant owner / admin** | `userType: admin`, `tenantId` set | One organisation only |
| **Tenant manager** | `userType: admin`, `rbacRole: manager` | Operations + storefront; no org settings |
| **Tenant staff** | `userType: admin`, `rbacRole: staff` | Day-to-day ops; usually read-only on storefront |

---

## How to assign permissions (practical guide)

### A — Enable product modules for the tenant (super admin)

1. Sign in as platform operator.
2. Open **Settings → Platform tenants** (`/settings/tenants`).
3. Click **Manage** on the tenant row.
4. Under **API module access**, either leave unrestricted (full product) or enable **Restrict modules** and check only what they purchased.
5. **Save module access**.

Optional: apply a **billing plan** preset — plans can seed suggested `featureModules` and `planKey`.

### B — Invite the tenant admin (super admin)

1. From the same tenant **Manage** panel, use **Invite admin** (or **Users → Team members** with org context set).
2. Choose a **base role**: `admin`, `manager`, or `staff`.
3. Optionally **Customize permissions** to start with an explicit chip list (`rbacPermissionMode: explicit`).
4. User completes invite, signs in — JWT includes `tenantId`.

### C — Fine-tune a team member (super admin or tenant admin with `manage_user_roles`)

1. Open **Settings → Access** (`/settings/access`) or **Users**.
2. Select the team member.
3. Choose access strategy:
   - **Union (role_plus)** — Role template **plus** extra chips (legacy behaviour; chips with non-empty list may narrow to explicit — see below).
   - **Explicit only** — **Only** selected chips apply; role template is ignored.
   - **Clear scoped** — Remove custom RBAC; fall back to role defaults.
4. Pick chips from grouped categories (Products, Storefront & CMS, Orders, …).
5. **Save**.

**Tip:** For a “storefront editor only” user, use **Explicit only** with:

- `view_storefront`
- `edit_storefront_branding`
- `edit_storefront_theme`
- (add others as needed)

Do **not** grant `manage_cms` unless they should edit everything in CMS too.

### D — Verify

| Check | How |
|-------|-----|
| Module gate | Call a CRM API with CRM removed from `featureModules` → 403 |
| Permission gate | Sign in as staff → Storefront Studio read-only, no Save |
| Cross-tenant | User A cannot see User B’s org in **Users** list |

---

## Role templates (default permission bundles)

These apply when `rbacPermissionMode` is unset and `permissions[]` is empty (legacy full admin), or when using union mode without a narrowing chip list.

| Role | Level | Typical use | Storefront default |
|------|-------|-------------|-------------------|
| `super_admin` | Platform | Your internal team | Full (all keys) |
| `admin` | Tenant owner | Business owner / IT lead | Full CMS + all storefront edits + org settings |
| `manager` | Shift lead | Runs catalog, orders, public site | Full storefront edit; no org settings |
| `staff` | Counter / support | Orders, bookings, read catalog | **View only** on storefront (`view_cms`, `view_storefront`) |

Canonical source: `packages/rbac/src/rbac.config.ts` and backend `dashboardRolePermissions.ts` (kept in sync).

---

## Complete permission catalog

Permissions use snake_case keys stored on `User.permissions[]` and checked by API middleware + admin UI route guards.

**Legend**

- **Grants** — What the user can do with this key alone (or as part of explicit list).
- **Does not grant** — Common misconceptions.
- **Implied by** — Umbrella keys that also satisfy this requirement.

---

### Overview & analytics

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_dashboard` | Open the home dashboard | Dashboard KPIs, support entry | Edit any data |
| `view_analytics` | Analytics pages | Funnels, ops analytics | Export raw DB |

---

### Products & catalog

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_products` | List and view products / menu items | `/products`, inventory read | Create or delete |
| `create_products` | Add new products | `/products/add` | Publish to storefront (visibility still product flags) |
| `edit_products` | Update existing products | Edit forms, quick edits | Delete |
| `delete_products` | Remove products | Hard delete | Archive-only workflows |
| `manage_product_inventory` | Stock / availability fields | Inventory page, stock counts | Pricing rules |
| `publish_products` | Toggle publish / visibility | Make items live on storefront | Change tenant theme |

---

### Services (home services / marketplace)

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_services` | View service catalog | Services list, service requests hub | Create services |
| `create_services` | Add services | Create service flows | Approve provider-submitted |
| `edit_services` | Update services | Edit existing | Delete |
| `delete_services` | Remove services | Delete | — |
| `approve_services` | Approve pending services | Moderation queue | Provider verification |
| `manage_service_categories` | Service category tree | Category admin for services | Product categories |

---

### Orders

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_orders` | See order list and detail | `/orders` | Change status without `process_orders` |
| `create_orders` | Create orders manually | POS / manual order entry | Refund |
| `edit_orders` | Edit order fields | Line items, notes | Delete |
| `delete_orders` | Delete orders | Remove order records | Cancel workflow |
| `process_orders` | Advance order status | Confirm, prepare, ship | Issue refunds |
| `cancel_orders` | Cancel orders | Cancelled status | Refund money |
| `refund_orders` | Refund order payments | Refund actions | Platform payout config |

---

### Users & roles

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_users` | List team / members | Users page (tenant-scoped) | Edit |
| `create_users` | Invite team members | Register admin / invite | Assign platform tenants |
| `edit_users` | Update profiles | Name, phone, deactivate | Delete |
| `delete_users` | Remove users | Delete member | Cross-tenant access |
| `manage_user_roles` | Assign RBAC | Settings → Access | Change `featureModules` |
| `ban_users` | Ban / block users | Ban actions | Legal compliance holds |

---

### Providers & workforce

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_providers` | View provider list | Providers, professionals hub | Verify |
| `create_providers` | Onboard providers | Create provider | Background checks |
| `edit_providers` | Edit provider profiles | Profile updates | Payout bank details (platform) |
| `delete_providers` | Remove providers | Delete | — |
| `approve_providers` | Approve applications | Application queue | KYC documents |
| `verify_providers` | Mark verified | Verified badge | Insurance validation |

---

### Bookings & quotes

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_bookings` | View bookings | Bookings list, calendar | Change status |
| `create_bookings` | Create bookings | POS desk, phone bookings | Override pricing |
| `edit_bookings` | Edit booking details | Reschedule, notes | Delete |
| `delete_bookings` | Delete bookings | Remove records | Cancel with refund |
| `manage_bookings` | Full booking ops | Status workflow, command center | Provider payouts |
| `view_quotes` | View quotes | Quotes list | Accept on behalf |
| `create_quotes` | Create quotes | New quote | — |
| `edit_quotes` | Edit quotes | Update lines | — |
| `delete_quotes` | Delete quotes | Remove | — |
| `approve_quotes` | Approve / reject quotes | Approval actions | Convert to invoice |

---

### Categories

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_categories` | View category trees | Category hubs | Edit |
| `create_categories` | Add categories | Create forms | Reorder (needs edit) |
| `edit_categories` | Update categories | Rename, reorder | Delete |
| `delete_categories` | Remove categories | Delete nodes | Merge categories |

---

### Settings & platform (tenant org)

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_settings` | View org settings | Settings pages, org profile read | Change slug / plan |
| `edit_settings` | Edit safe org fields | Org name, industry settings, many CMS routes | `featureModules`, suspend |
| `manage_system_settings` | Elevated tenant settings | Platform tenants page (operators), sliders, system status | Cross-tenant data without header |

**Platform-only (never for org-scoped admins):** change `slug`, `planKey`, `featureModules`, suspend org, inject `customHeadScripts`, free-grant storefront add-ons.

---

### Storefront & CMS (umbrella)

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_cms` | Read CMS + storefront config | CMS overview (where routed), Storefront Studio read | Edit theme, domains |
| `manage_cms` | Full CMS + storefront edit | All granular storefront keys below, CMS pages/menus/media | Platform locks, org slug |

---

### Storefront Studio — granular permissions

Use these for least-privilege storefront access. **`manage_cms` and `edit_settings` still satisfy all edit keys** (backward compatible).

| Key | Description | Grants | Does not grant | Implied by |
|-----|-------------|--------|----------------|------------|
| `view_storefront` | Open Storefront Studio read-only | GET config, preview link, domain list (read) | Save, theme change | `view_cms`, `manage_cms`, `view_settings`, `edit_settings` |
| `edit_storefront_branding` | Branding tab | Site name, tagline, logo, favicon, primary color | SEO, theme | `manage_cms`, `edit_settings` |
| `edit_storefront_theme` | Themes tab | Select / switch storefront template | Section content | `manage_cms`, `edit_settings` |
| `edit_storefront_sections` | Sections tab | Homepage section layout and content blocks | Per-page SEO | `manage_cms`, `edit_settings` |
| `edit_storefront_seo` | SEO + per-page SEO tabs | Meta tags, OG image, sitemap toggle, page titles | Custom domains | `manage_cms`, `edit_settings` |
| `edit_storefront_content` | AI copy tab | `POST /generate-copy` | Manual section edits (needs sections perm) | `manage_cms`, `edit_settings` |
| `manage_storefront_domains` | Custom domains | Add, verify, set primary, remove domains | Change org slug | `manage_cms`, `edit_settings` |
| `manage_storefront_addons` | Add-ons tab | Feature flags, Razorpay add-on purchase/verify | Super-admin free grant | `manage_cms`, `edit_settings` |

**Storefront API mapping**

| API | Required permission (any one) |
|-----|------------------------------|
| `GET /api/storefront-studio/config` | `view_storefront`, `view_cms`, `view_settings`, … |
| `PATCH /api/storefront-studio/config` | Any `edit_storefront_*`, `manage_cms`, `edit_settings` |
| `POST /api/storefront-studio/generate-copy` | `edit_storefront_content`, `manage_cms`, `edit_settings` |
| `GET /api/storefront-studio/domains` | `view_storefront`, `manage_storefront_domains`, … |
| `POST/DELETE …/domains` | `manage_storefront_domains`, `manage_cms`, `edit_settings` |
| `POST …/addons/order`, `…/verify` | `manage_storefront_addons`, `manage_cms`, `edit_settings` |

**Admin UI:** `/settings/storefront` — tabs hidden per permission; read-only users see preview + summary only.

**Products on storefront:** Controlled by **product permissions** (`view_products`, `edit_products`, `publish_products`), not storefront keys. A user can edit the theme but not the menu without product perms.

---

### Reports

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_reports` | View reports | Reports hub | Export |
| `export_reports` | Export CSV / files | Download exports | Schedule email |
| `generate_reports` | Run report jobs | Generate action | Raw SQL |

---

### Payments

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_payments` | View payments / invoices | Payments, invoices, payouts read | Capture new payment |
| `create_payments` | Record payments | Manual payment entry | Refund |
| `refund_payments` | Issue refunds | Refund requests hub | Chargeback dispute legal |
| `export_payments` | Export payment data | CSV export | — |

---

### Finance (company ledger)

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_finance` | View finance module | `/finance` read | Post expenses |
| `manage_finance` | Full finance | Create/edit expenses, budgets | Tenant billing plan |

Requires **`finance`** in `featureModules` when allowlist is enforced.

---

### Messages & notifications

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_messages` | Read messages | Inbox, chat | Delete others’ messages |
| `send_messages` | Send messages | Reply, outbound | Broadcast marketing |
| `delete_messages` | Delete messages | Moderation delete | — |
| `view_notifications` | View notifications | Notification center | Push config |
| `manage_notifications` | Manage notification rules | Admin notification settings | OneSignal platform keys |

---

### Coupons & referrals

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_coupons` | View coupons | List | Edit |
| `create_coupons` | Create coupons | New coupon | Auto-apply at checkout |
| `edit_coupons` | Edit coupons | Update rules | Delete |
| `delete_coupons` | Delete coupons | Remove | — |
| `manage_coupons` | Full coupon admin | All coupon ops | — |
| `view_referrals` | View referrals | Referral list | Payout |
| `create_referrals` | Create programs | New program | — |
| `edit_referrals` | Edit programs | Update | — |
| `delete_referrals` | Delete programs | Remove | — |
| `manage_referrals` | Full referral admin | All referral ops | — |

---

### CRM

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_crm` | View CRM records | Leads, contacts, deals (read) | Delete |
| `manage_crm` | Full CRM | Create/edit/delete CRM entities | Email integration DNS |

Requires **`crm`** module entitlement.

---

### Team work & boards

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_team_tasks` | View tasks | Team work board | Create projects |
| `manage_team_tasks` | Edit tasks | Assign, status changes | Archive workspace |
| `manage_team_projects` | Project admin | Create boards, roster | Tenant billing |
| `view_boards` | View canvas boards | Boards read | Edit canvas |
| `manage_boards` | Edit boards | Draw, edit content | Invite external emails |
| `invite_board_members` | Invite to boards | Board sharing | Manage tenant users |

Requires **`team_work`** module where gated.

---

### Home-services commercial ops

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_amc` | View AMC contracts | AMC ledger read | Billing customer |
| `manage_amc` | Manage AMC | Create/edit AMC | — |
| `view_rate_cards` | View rate cards | Pricing playbooks read | Publish to web |
| `manage_rate_cards` | Edit rate cards | CMS rate card admin | Provider payout % |
| `view_company_documents` | View document templates | Policies, agreements | Send envelopes |
| `manage_company_documents` | Manage documents | Template CRUD, signing | Legal review |
| `view_operating_terms` | View fees / cities | Commercial terms read | Stripe connect |
| `manage_operating_terms` | Edit operating terms | Fee tables, cities | Tax registration |
| `view_provider_assets` | View fleet / toolkit | Asset registry read | Purchase orders |
| `manage_provider_assets` | Manage assets | CRUD assets | Depreciation accounting |
| `view_professional_conduct` | View conduct ledger | Warnings read | Terminate employment |
| `manage_professional_conduct` | Manage conduct | Penalties, rewards | Legal holds |

---

### Subscriptions (recurring revenue)

| Key | Description | Grants | Does not grant |
|-----|-------------|--------|----------------|
| `view_subscriptions` | View subscription plans | Subscriber list read | Charge cards |
| `manage_subscriptions` | Manage subscriptions | Plan CRUD, lifecycle | Platform Stripe keys |

---

## Recommended permission bundles

Copy these chip sets in **Settings → Access** with **Explicit only** mode.

### Storefront editor (marketing hire)

```
view_storefront
edit_storefront_branding
edit_storefront_theme
edit_storefront_sections
edit_storefront_seo
edit_storefront_content
```

### Storefront + domains (technical lead)

Above plus:

```
manage_storefront_domains
manage_storefront_addons
```

### Catalog manager (restaurant / retail)

```
view_dashboard
view_products
create_products
edit_products
manage_product_inventory
publish_products
view_orders
process_orders
view_storefront
```

### Finance clerk

```
view_dashboard
view_finance
view_payments
export_payments
view_orders
```

Requires `finance` module on tenant.

### Support staff (read-heavy)

Use role **`staff`** defaults, or explicit:

```
view_dashboard
view_orders
edit_orders
process_orders
view_bookings
edit_bookings
view_products
view_storefront
view_messages
send_messages
```

---

## Common scenarios & troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Menu item missing | Module not in `featureModules` | Super admin → enable module on tenant |
| 403 on API but UI visible | Stale JWT | User logs out and back in |
| Manager locked out of Storefront | Missing `manage_cms` or granular edit key | Grant `edit_storefront_*` or `manage_cms` |
| Staff can edit storefront | Has `manage_cms` chip or `admin` role | Switch to `staff` role; remove edit chips |
| Chips seem ignored | Union mode with empty role re-expands | Use **Explicit only** strategy |
| Platform operator can’t edit tenant storefront | Not impersonating tenant | Use platform storefront config route or set `X-Tenant-Id` |

---

## Key files (engineering reference)

| Area | Path |
|------|------|
| Permission types | `packages/types/src/rbac.types.ts` |
| Role templates + routes | `packages/rbac/src/rbac.config.ts` |
| Storefront alias map | `packages/rbac/src/storefrontPermissionAliases.ts` |
| Permission picker UI | `src/config/permissionsCatalog.ts`, `PermissionChipPicker.tsx` |
| Assign access UI | `src/pages/settings/access/AssignTeamAccessPage.tsx` |
| Module entitlements UI | `src/pages/settings/PlatformTenantsPage.tsx` |
| Backend role defaults | `fixer-backend/src/core/rbac/dashboardRolePermissions.ts` |
| Backend effective perms | `fixer-backend/src/core/rbac/dashboardEffectivePermissions.ts` |
| Storefront API guards | `fixer-backend/src/modules/storefront-studio/routes/storefrontStudio.ts` |

---

## Database / seeding note

Permission keys are **plain strings** on the `User` document. **No Mongo migration is required** when adding new keys. Legacy `Permission` / `RolePermission` collections (used for older `resource:action` enums) are mapped to dashboard keys automatically via `permissionRequirementMapping.ts`.

After deploying new storefront keys, existing users with `manage_cms` or `edit_settings` continue to work without re-seeding.

---

*When adding permissions, update this doc, `rbac.types.ts`, `rbac.config.ts`, `dashboardRolePermissions.ts`, and route guards together.*
