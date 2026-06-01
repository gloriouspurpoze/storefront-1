# Shared packages (future monorepo)

This folder is reserved for extracting vertical packs into a workspace package consumed by:

- `fixer-admin` (this repo)
- `fixer-mobile` (React Native — not scaffolded yet)

## Planned layout

```text
packages/
  verticals/          # @profixer/verticals — types, registry, manifests
  verticals-native/   # optional RN icon map + navigation adapters
```

## Current state

Vertical packs live in `src/verticals/` until the monorepo workspace is created. Mobile planning docs: [`docs/mobile/`](../docs/mobile/).

## Migration checklist

1. Move `src/verticals/` → `packages/verticals/src`
2. Add `package.json` with `exports` for `./registry`, `./core/types`
3. Point admin `tsconfig` paths `@verticals/*` at the package
4. Add RN app that depends on `@profixer/verticals` for tab labels and engagement statuses
