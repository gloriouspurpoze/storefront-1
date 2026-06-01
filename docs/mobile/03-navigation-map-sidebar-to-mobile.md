# Fixer Admin Mobile — Sidebar → Tabs & Drawer Map

> Source of truth on web: `src/components/layout/sidebar.tsx`
> Permission filtering: `filterAdminNavigationByRouteAccess` + `canAccessRoute` from `@profixer/rbac`

## Design principles for mobile

1. **Bottom tabs = daily actions** (max 5 tabs — iOS HIG).
2. **Drawer / "More" stack = infrequent admin modules** (CMS, finance, settings).
3. **Hide entire tab** if user has zero accessible routes in that tab (same as sidebar filter).
4. **Do not port 80+ sidebar links** — group into hubs with "see all on web" for desktop-only tools.
5. **Provider / Professional** get a **separate tab set** (not the admin drawer).

---

## Persona → root navigator

| Persona | Web sidebar source | Mobile root |
|---------|-------------------|-------------|
| Admin / staff / manager | `navigationGroups` | `AdminNavigator` (tabs + drawer) |
| Provider | `providerNavigationGroups` | `ProviderNavigator` (3 tabs) |
| Professional | `professionalNavigationGroups` | `ProfessionalNavigator` (4 tabs) |

Detection (match web):

```ts
user.userType === 'professional' → ProfessionalNavigator
user.userType === 'provider'     → ProviderNavigator
else                             → AdminNavigator
```

---

## Admin mobile — bottom tabs (recommended)

| Tab | Icon | Primary screens | Web sidebar group | Show tab if |
|-----|------|-----------------|-------------------|-------------|
| **Home** | Dashboard | Dashboard, quick KPIs | Overview | `canAccessRoute('/')` |
| **Ops** | Calendar / Wrench | Bookings, Disputes, Applications, Live map | Operations + Catalog (subset) | any ops route accessible |
| **Chat** | Message | Chat inbox, thread | Operations → Chat | `canAccessRoute('/chat')` |
| **Inbox** | Bell | Notifications, support tickets | People + System (partial) | notifications OR tickets OR refunds |
| **More** | Menu | Drawer menu hub | Everything else | always (filtered items inside) |

### Ops tab — internal stack (priority order)

| Stack screen | Web href | Permissions (sidebar) | MVP? |
|--------------|----------|----------------------|------|
| Bookings list | `/bookings` | `view_bookings`, `manage_bookings` | Yes |
| Booking detail | `/bookings/:id` | same | Yes |
| Live locations | `/professionals/live-locations` | `view_providers`… | Yes |
| Professionals list | `/professionals` | `view_providers`… | Yes |
| Provider applications | `/provider-applications` | `view_providers`… | Yes |
| Dispute cases | `/operations/dispute-cases` | `view_bookings`, `manage_bookings`, `edit_bookings` | Yes |
| Service requests | `/requests` | `view_services`, `manage_services` | Phase 2 |
| Quotes | `/quotes` | `view_quotes` | Phase 2 |
| POS | `/operations/pos` | `create_bookings`, `manage_bookings` | No (desktop) |
| Command center | `/operations/command-center` | `view_bookings`, `manage_bookings` | Phase 2 (simplified) |

### Home tab — stack

| Screen | Web href | Permissions |
|--------|----------|-------------|
| Dashboard | `/` | `view_dashboard` |
| Analytics summary | `/analytics` | `view_analytics` |
| Growth funnels | `/analytics/funnels` | `view_analytics` (Phase 2) |
| Catalog analytics | `/analytics/catalog` | `view_analytics` (Phase 2) |

### Inbox tab — stack

| Screen | Web href | Permissions |
|--------|----------|-------------|
| Notifications | `/notifications` | `view_notifications`, `manage_notifications` |
| Support tickets | `/support/tickets` | `view_dashboard` |
| Refund requests | `/support/refund-requests` | `refund_payments` |

### Chat tab — stack

| Screen | Web href | Permissions |
|--------|----------|-------------|
| Chat inbox | `/chat` | `view_messages` |
| Messages (legacy) | `/messages` | `view_messages` (optional) |

---

## Admin mobile — drawer sections ("More")

Drawer groups map 1:1 to web sidebar **titles**, but items are **collapsed into hub screens**.

### Drawer section: Overview

| Drawer item | Web href | Mobile action |
|-------------|----------|---------------|
| Analytics | `/analytics` | Navigate to Analytics stack (or Home sub-screen) |

### Drawer section: CRM

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| CRM hub | `/crm` | `CrmHubScreen` → Leads, Contacts, Deals lists |
| Leads | `/crm/leads` | `CrmLeadsScreen` |
| Contacts | `/crm/contacts` | Phase 2 |
| Deals | `/crm/deals` | Phase 2 |

**Show section if:** `canAccessRoute('/crm')`

### Drawer section: Operations (extended)

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Payments | `/payments` | Read-only list Phase 2 |
| Invoices | `/invoices` | Desktop-only |
| Earnings & payouts | `/payouts` | Phase 2 |
| Finance | `/finance/overview` | KPI summary only Phase 2 |
| Founder finance | `/finance/founder/dashboard` | Desktop-only |
| AMC | `/amc/overview` | Phase 3 |
| Rate cards | `/rate-cards/overview` | Desktop-only |
| Company documents | `/company-documents` | Desktop-only |
| Fees & cities | `/operations/commercial/terms` | Desktop-only |
| Subscriptions | `/subscriptions` | Phase 3 |
| Team work | `/team-work` | Task list Phase 2 |
| Boards | `/boards` | Desktop-only |

### Drawer section: Commerce

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Store overview | `/ecommerce` | Phase 3 |
| Products | `/products` | Phase 3 |
| Orders | `/orders` | `OrdersListScreen` Phase 2 |
| Bazaar / listing review | `/bazaar/*` | Approve listing Phase 2 |

**Show section if:** any of `/ecommerce`, `/products`, `/orders`, `/bazaar` accessible.

### Drawer section: Catalog & network

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Professionals | `/professionals` | Also in Ops tab |
| Workforce dashboard | `/professionals/operations` | Phase 2 |
| Platform services | `/platform-services` | Desktop-only |
| Marketplace | `/marketplace` | Desktop-only |
| Categories | `/categories/*` | Desktop-only |

### Drawer section: Content & Marketing

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| All CMS / marketing workspace | `/cms/*`, `/marketing/*` | **Web-only banner** — "Open admin web" |

**Show section if:** user has CMS permissions — but default to deep link to web, not native screens.

### Drawer section: People & messaging

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Customers | `/users/customers` | `CustomersListScreen` Phase 2 |
| Team members | `/users/members` | Read-only Phase 3 |

### Drawer section: Knowledge kit

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Guides | `/knowledge-kit` | In-app WebView or static markdown Phase 3 |

### Drawer section: System

| Drawer item | Web href | Mobile |
|-------------|----------|--------|
| Reports | `/reports` | Phase 3 |
| System status | `/system-status` | `SystemStatusScreen` Phase 2 |
| Settings | `/settings` | `SettingsScreen` |
| Roles & access | `/settings/access` | Desktop-only |
| SaaS / Tenants | `/settings/saas`, `/settings/tenants` | Desktop-only |
| Help & support | `/support` | `SupportScreen` |

---

## Provider mobile — bottom tabs

Maps to `providerNavigationGroups`:

| Tab | Web href |
|-----|----------|
| Dashboard | `/provider/dashboard` |
| Bookings | `/provider/bookings` |
| Earnings | `/provider/earnings` |
| More | Profile `/provider/profile`, Messages `/messages`, Support `/support` |

---

## Professional mobile — bottom tabs

Maps to `professionalNavigationGroups`:

| Tab | Web href |
|-----|----------|
| Dashboard | `/professional/dashboard` |
| Bookings | `/professional/bookings` |
| Earnings | `/professional/earnings` |
| Chat | `/chat` |
| More | Services, Profile, Reviews, Documents, Settings, Support |

---

## Shared config: `mobileNav.config.ts`

Extract from sidebar into a **platform-agnostic** config consumed by web (optional) and mobile:

```ts
export type MobileNavItem = {
  id: string
  label: string
  webPath: string           // for canAccessRoute()
  mobileScreen: string      // React Navigation screen name
  permissions?: Permission[] // fallback if route not in routePermissions
  tier: 'tab' | 'ops' | 'drawer' | 'desktop-only'
  personas: ('admin' | 'provider' | 'professional')[]
}

export const adminMobileNav: MobileNavItem[] = [
  {
    id: 'bookings',
    label: 'Bookings',
    webPath: '/bookings',
    mobileScreen: 'BookingsList',
    permissions: ['view_bookings', 'manage_bookings'],
    tier: 'tab',
    personas: ['admin'],
  },
  // …
]
```

**Visibility helper:**

```ts
function isNavItemVisible(
  item: MobileNavItem,
  checkRouteAccess: (path: string) => boolean,
): boolean {
  return checkRouteAccess(item.webPath.split('?')[0])
}
```

This mirrors `filterAdminNavigationByRouteAccess` in `sidebar.tsx` (lines 798–819).

---

## Deep linking map

| URL | Screen |
|-----|--------|
| `profixer://booking/:id` | `BookingDetail` |
| `profixer://chat/:threadId` | `ChatThread` |
| `profixer://applications` | `ProviderApplications` |
| `profixer://refunds` | `RefundRequests` |
| `profixer://professional/:id` | `ProfessionalDetail` |

Push payloads from OneSignal should carry the same paths.

---

## Badge / unread parity

| Web sidebar | Mobile placement |
|-------------|------------------|
| Chat unread poll (`ChatService.getUnreadCount`, 45s) | Tab badge on **Chat** |
| Notification bell | Tab badge on **Inbox** |

---

## ASCII: Admin navigation tree

```text
RootNavigator
├── AuthNavigator (logged out)
└── AdminNavigator (logged in)
    ├── AdminTabNavigator
    │   ├── HomeStack → Dashboard, Analytics?
    │   ├── OpsStack → Bookings, Detail, Pros, Map, Approvals, Disputes
    │   ├── ChatStack → Inbox, Thread
    │   ├── InboxStack → Notifications, Tickets, Refunds
    │   └── MoreStack → DrawerHub
    └── AdminDrawer (modal from More)
        ├── CRM
        ├── Commerce (collapsed)
        ├── Finance (collapsed)
        ├── People
        ├── System → Settings, Status, Support
        └── Open Web Admin (CMS / Founder / Boards)
```

---

## MVP vs desktop-only summary

| Tier | Count | Examples |
|------|-------|----------|
| **Tab / Ops MVP** | ~12 screens | Dashboard, bookings, chat, notifications, live map, applications, refunds, tickets |
| **Drawer Phase 2** | ~10 screens | Orders, CRM leads, disputes hub, system status, customers |
| **Desktop-only** | 100+ web routes | CMS, marketing workspace, boards, founder finance, rate card editor, access explorer |
