# Fixer Admin Mobile — App Folder Structure

> Feature-first layout aligned with your web `src/pages/` domains.
> Assumes: React Navigation 7, Redux Toolkit, TypeScript, NativeWind (optional).

## Top-level app layout

```text
apps/admin-mobile/
├── app.json / app.config.ts
├── index.js
├── package.json
├── tsconfig.json
│
├── src/
│   ├── app/                    # App shell, providers, root navigator
│   ├── navigation/             # Navigators, linking, guards
│   ├── features/               # Feature modules (screens + logic)
│   ├── components/             # Shared UI primitives
│   ├── services/               # Mobile API adapter, push, socket
│   ├── store/                  # Redux store + RTK Query APIs
│   ├── hooks/                  # Cross-feature hooks
│   ├── theme/                  # Colors, spacing, typography
│   ├── assets/                 # Images, fonts
│   ├── config/                 # env, feature flags
│   └── types/                  # App-only types (re-export @profixer/types)
│
├── android/
└── ios/
```

---

## `src/app/` — bootstrap

```text
src/app/
├── App.tsx                     # Provider tree
├── providers/
│   ├── ReduxProvider.tsx
│   ├── SafeAreaProvider.tsx
│   ├── ThemeProvider.tsx
│   └── SocketProvider.tsx      # live ops (from LiveOpsAdminGate pattern)
└── RootNavigator.tsx           # Auth vs Main switch
```

**Provider order (recommended):**

1. Redux + PersistGate
2. Theme
3. Safe area
4. Navigation container
5. Socket (authenticated only)
6. Toast overlay

---

## `src/navigation/` — routing

```text
src/navigation/
├── types.ts                    # RootStackParamList, TabParamList, etc.
├── linking.ts                  # Deep links: profixer://booking/:id
├── navigationRef.ts
│
├── RootNavigator.tsx
├── AuthNavigator.tsx           # Login, AcceptInvite, Unauthorized
│
├── roles/
│   ├── AdminNavigator.tsx      # Tabs + Drawer for internal admin
│   ├── ProviderNavigator.tsx     # Provider portal (if same app)
│   └── ProfessionalNavigator.tsx
│
├── admin/
│   ├── AdminTabNavigator.tsx   # Bottom tabs (5 max)
│   ├── AdminDrawerNavigator.tsx
│   ├── HomeStack.tsx
│   ├── OpsStack.tsx
│   ├── ChatStack.tsx
│   ├── InboxStack.tsx
│   └── MoreStack.tsx           # "More" → drawer / modal menu
│
└── guards/
    ├── PermissionGate.tsx      # wraps screens — uses @profixer/rbac
    └── RoleGate.tsx
```

**Role selection** (mirror `sidebar.tsx` lines 892–911):

```ts
function pickRootNavigator(user: AuthUser) {
  if (user.userType === 'professional') return ProfessionalNavigator
  if (user.userType === 'provider') return ProviderNavigator
  return AdminNavigator
}
```

---

## `src/features/` — feature modules

Each feature follows the same internal shape:

```text
features/<name>/
├── screens/
├── components/
├── hooks/
├── api/                        # RTK Query endpoints OR thin wrappers
├── types.ts                    # re-exports / screen-specific types
└── index.ts                    # public exports
```

### MVP features (build first)

```text
features/
├── auth/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── AcceptInviteScreen.tsx
│   │   └── BiometricUnlockScreen.tsx
│   └── hooks/useAuth.ts
│
├── dashboard/
│   ├── screens/DashboardScreen.tsx
│   └── components/KpiCard.tsx
│
├── bookings/
│   ├── screens/
│   │   ├── BookingsListScreen.tsx
│   │   ├── BookingDetailScreen.tsx
│   │   └── BookingStatusSheet.tsx
│   └── components/AssignProviderSheet.tsx
│
├── notifications/
│   ├── screens/NotificationsScreen.tsx
│   └── hooks/usePushRegistration.ts
│
├── chat/
│   ├── screens/
│   │   ├── ChatInboxScreen.tsx
│   │   └── ChatThreadScreen.tsx
│   └── hooks/useChatSocket.ts
│
├── professionals/
│   ├── screens/
│   │   ├── ProfessionalsListScreen.tsx
│   │   ├── ProfessionalDetailScreen.tsx
│   │   └── LiveMapScreen.tsx
│   └── components/ProMarker.tsx
│
├── approvals/
│   ├── screens/
│   │   ├── ProviderApplicationsScreen.tsx
│   │   ├── RefundRequestsScreen.tsx
│   │   └── SupportTicketsScreen.tsx
│
└── settings/
    ├── screens/SettingsScreen.tsx
    └── screens/ProfileScreen.tsx
```

### Phase 2 features

```text
features/
├── orders/
├── disputes/                   # operations/dispute-cases
├── payments/                   # read-only payment list
├── crm/                        # leads list + quick actions
├── analytics/                  # simplified KPI charts
└── team-work/                  # tasks list only
```

### Explicitly out of MVP (web-only parity)

```text
# Do not create feature folders until product asks:
features/cms/
features/marketing-workspace/
features/boards/
features/finance-founder/
features/company-documents-editor/
```

---

## `src/components/` — design system

Mirror web `src/components/ui/` + `src/components/common/`:

```text
components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Skeleton.tsx
│   ├── Sheet.tsx              # bottom sheet (modals)
│   └── Toast.tsx
├── common/
│   ├── EmptyState.tsx         # port from web EmptyState
│   ├── StatCard.tsx           # port from shared StatCard
│   ├── StatusBadge.tsx
│   ├── ListRow.tsx
│   └── ScreenHeader.tsx
└── layout/
    ├── Screen.tsx             # safe area + scroll
    └── TabBarIcon.tsx
```

---

## `src/store/` — state

```text
store/
├── index.ts
├── hooks.ts
├── persistConfig.ts
├── api/
│   ├── baseApi.ts             # RTK Query createApi + tagTypes
│   ├── bookingsApi.ts
│   ├── dashboardApi.ts
│   ├── chatApi.ts
│   └── notificationsApi.ts
└── slices/
    ├── authSlice.ts           # from @profixer/store-core or local
    ├── tenantSlice.ts
    └── chatInboxSlice.ts
```

**Prefer RTK Query** for list/detail screens (pagination, cache, refetch on focus).

---

## `src/services/` — native integrations

```text
services/
├── createMobileClient.ts      # @profixer/api-client adapter
├── push/
│   ├── onesignal.ts           # replaces OneSignalWeb
│   └── handleNotificationOpen.ts
├── socket/
│   ├── liveOpsSocket.ts       # port LiveOpsAdminGate behavior
│   └── reconnectOnAppState.ts
└── auth/
    ├── keychain.ts            # secure token storage
    └── biometrics.ts
```

---

## `src/config/`

```text
config/
├── env.ts                     # dev / staging / prod API URLs
├── featureFlags.ts            # toggle modules per build
└── mobileNav.config.ts        # ← single source for tabs/drawer (see doc 03)
```

---

## Screen naming ↔ web routes

| Web route | Mobile screen |
|-----------|---------------|
| `/auth` | `LoginScreen` |
| `/` | `DashboardScreen` |
| `/bookings` | `BookingsListScreen` |
| `/bookings/:id` | `BookingDetailScreen` |
| `/chat` | `ChatInboxScreen` |
| `/notifications` | `NotificationsScreen` |
| `/professionals` | `ProfessionalsListScreen` |
| `/professionals/live-locations` | `LiveMapScreen` |
| `/provider-applications` | `ProviderApplicationsScreen` |
| `/support/refund-requests` | `RefundRequestsScreen` |
| `/support/tickets` | `SupportTicketsScreen` |
| `/operations/dispute-cases` | `DisputeCasesScreen` |

---

## Dependencies (starter set)

```json
{
  "@react-navigation/native": "^7",
  "@react-navigation/native-stack": "^7",
  "@react-navigation/bottom-tabs": "^7",
  "@react-navigation/drawer": "^7",
  "@reduxjs/toolkit": "^2",
  "react-redux": "^9",
  "redux-persist": "^6",
  "@react-native-async-storage/async-storage": "^2",
  "react-native-keychain": "^9",
  "react-native-onesignal": "^5",
  "socket.io-client": "^4",
  "axios": "^1",
  "react-hook-form": "^7",
  "zod": "^4",
  "date-fns": "^4",
  "react-native-maps": "latest",
  "react-native-reanimated": "^3",
  "react-native-gesture-handler": "^2",
  "react-native-safe-area-context": "^5",
  "react-native-screens": "^4"
}
```

---

## Testing structure

```text
__tests__/
├── rbac/
│   └── navigationVisibility.test.ts
├── features/bookings/
└── e2e/                        # Detox or Maestro (later)
```
