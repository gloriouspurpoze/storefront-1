# Fixer Admin Mobile — Planning Docs

Planning documents for building a React Native companion app for the `fixer-admin` web admin panel.

## Reading order

1. [`01-monorepo-and-shared-packages.md`](./01-monorepo-and-shared-packages.md) — How to restructure the repo into a monorepo and which existing files move into shared packages (`@profixer/types`, `@profixer/rbac`, `@profixer/api-client`, etc.).
2. [`02-react-native-app-structure.md`](./02-react-native-app-structure.md) — Folder layout, providers, navigation, features, components, store, and dependencies for the new RN app.
3. [`03-navigation-map-sidebar-to-mobile.md`](./03-navigation-map-sidebar-to-mobile.md) — Direct mapping from web sidebar groups (`src/components/layout/sidebar.tsx`) to mobile bottom tabs + drawer, with permission gating.

## Quick context

- **Web app:** ~150+ routes, 346+ `.tsx` files, three personas (admin, provider, professional).
- **Mobile strategy:** Focused companion app for ops-on-the-go — not a 1:1 port. ~15–20 MVP screens.
- **Decision still open:** Expo (recommended) vs bare React Native CLI; single multi-persona app vs separate Admin / Provider / Professional apps.

## Phase 0 questions to answer before coding

1. Primary persona for v1: internal admin/ops, or provider/professional too?
2. Expo + EAS, or bare React Native CLI?
3. iOS + Android, or Android-first?
4. One app with role-based UI, or separate apps per persona?
5. Final MVP screen list (10–15 screens).
6. Are mobile-friendly API endpoints (cursor pagination, device token registration, slimmer payloads) ready on the backend?
