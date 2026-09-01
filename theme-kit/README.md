# theme-kit

Shared factories that back every `themes/{vertical}/...` file, so adding a new
theme or vertical means writing a config/case-map, not copy-pasting another
~200-400 lines of logic. See `tenant.ts`, `cart.tsx`, `layout.tsx`, `content.tsx`,
and `account/` for the tenant loader, cart context, layout router, content-block
wrapper, and account-shell factories respectively.

## Scope note: CSS design tokens

`storefront/themes/shared/tokens.css` defines role-based tokens (`--shadow-sm/md`,
`--font-display/body`, `--radius-sm/md/lg`). Only `luxe-essence.css` currently
exposes its values under these shared names (see the `--shadow-sm: var(--le-shadow-sm)`
style mappings near the top of that file) — additive only, each theme's own
prefixed tokens (`--le-*`, `--mf-*`, `--ss-*`, ...) remain the source of truth
for its own CSS.

Rewriting the ~11,000 lines of duplicated structural CSS (headers, drawers,
modals, cart, grid patterns) shared across theme files is explicitly **out of
scope** here — it's a separate, higher-risk visual-regression project with no
tooling support in this repo today (no visual regression testing exists).
Mapping the remaining themes' (`menufast.css`, `soft-studio.css`,
`brown-butter.css`) tokens onto the shared names first requires inventorying
what "radius" or "shadow" even corresponds to in each, since they don't use an
equivalent naming convention today.
