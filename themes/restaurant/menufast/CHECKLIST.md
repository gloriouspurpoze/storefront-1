# menufast-cards — Theme checklist

**Vertical:** restaurant  
**Brief:** [THEME_BRIEF.yaml](./THEME_BRIEF.yaml)  
**Reference tenant:** `mycafe`  
**Status:** pre-launch  
**Verify:** lint + typecheck + build only (no browser)

> One component per Cursor session. Mark `[x]` only after lint, typecheck, and build pass for that component.

---

## shell-header

- [x] Default state (dark cards header, logo, store name, Fraunces + DM Sans)
- [x] Sparse state (no logo — name only)
- [x] Mobile 375px layout
- [x] Keyboard focus on nav / menu control
- [x] Branding from config (logo + colors v1); no emojis
- [x] lint + typecheck + build (pre-existing TS errors elsewhere in repo)
- [x] No hardcoded tenant-specific copy

**Notes / blockers:** Extracted `MenuFastCardsHeader.tsx`. Category pills deferred to `catalog-categories` session.

---

## shell-footer

- [x] Contact/social links hidden when unset in config
- [x] Default + sparse states
- [x] Mobile 375px
- [x] Styled consistently with cards menu (minimal, no heavy gradients)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsFooter.tsx` in scrollable menu body; contact links from branding.

---

## shell-mobile-nav

- [x] StorefrontMenuDrawer opens/closes; keyboard accessible
- [x] Link set matches header (no duplicate clutter)
- [x] Mobile 375px
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsMenuDrawer.tsx`; cards CSS vars; `drawerId` wired to header `aria-controls`.

---

## content-hero

- [x] Copy from admin config only (no theme lorem fallbacks beyond brief)
- [x] Partial state (missing hero — section collapses)
- [x] One primary CTA per viewport (hero is copy-only; checkout owns CTA)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsHero.tsx` — renders when `heroHeadline` or `heroSubcopy` set; null otherwise.

---

## catalog-categories

- [x] Horizontal category pills (required); active state matches HTML ref
- [x] “All” + per-category filter
- [x] Mobile horizontal scroll
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsCategoryNav.tsx` — tablist a11y, arrow keys, truncates long names. Hidden when fewer than 2 categories.

---

## catalog-grid

- [x] Card layout per HTML reference (image column hidden when no imageUrl)
- [x] Rich catalog (up to ~50 items)
- [x] Busy state (long names, price formatting via formatMenuPrice)
- [x] Veg indicator (dot, not emoji)
- [x] lint + typecheck + build

**Notes / blockers:** `MenuFastCardsGrid.tsx`; sold-out uses strikethrough + opacity per HTML ref. `VariantCarrier.inStock` optional for menu items.

---

## catalog-empty

- [x] Empty menu message per brief
- [x] Single-item menu still usable
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsEmpty.tsx` + `lib/menuCatalog.ts`; global vs category-filter empty; brief message replaces admin copy.

---

## commerce-add-to-cart

- [x] In-stock add flow (+ button)
- [x] Out-of-stock disabled / sold-out tag (default strikethrough pattern from ref)
- [x] Optional variants via modal when hasVariants
- [x] Login required before cart actions (useCartAuthGate)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsAddControl.tsx`; `isVariantInStock` for variant-level OOS; authReady disables add until session loads.

---

## commerce-cart

- [x] Sticky cart summary bar (dark bar, count, subtotal)
- [x] Line items, quantities, totals
- [x] Empty cart state
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsCart.tsx` — dark summary bar per HTML ref; bottom sheet with lines, subtotal, checkout slot.

---

## commerce-checkout

- [x] Login required (RequireStorefrontAuth / auth gate)
- [x] Pincode + preferred date/time from templateSettings
- [x] Shipping/fees from config (not hardcoded)
- [x] Closed store allows scheduled orders per brief
- [x] Payment options when backend flags exist: Razorpay, COD, pay-at-restaurant
- [x] WhatsApp order link when configured in admin/branding
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsCheckout.tsx` + `appearance="menufast-cards"` on shared block; auth return `/`; cards-styled fields in cart panel.

---

## account-shell

- [x] Same styling as menu (cards theme — MenuFastCardsAccountShell)
- [x] Login, orders, profile routes
- [x] lint + typecheck + build (pre-existing TS error in `BrownButterPage.tsx`; menufast account files clean)

**Notes / blockers:** Dark header + phone frame; mf-acct-sidebar replaces generic Tailwind nav. Dashboard overview/orders/profile use mf-acct-* layout (fixes sm:grid-cols-3 breakage inside 420px phone frame).

---

## system-store-status

- [x] StoreStatusBadge on menu (open / closed / hours)
- [x] Closed + scheduled ordering behavior per brief
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `MenuFastCardsStoreStatus.tsx`; dark-header styling; `checkoutGuard` skips open check when valid preferred date set.

---

## verify-full-pass

- [x] Search in scope works on menu/catalog UX
- [x] About + contact routes styled like menu
- [x] Track order: public + logged-in paths
- [x] Emojis removed from order success and placeholders
- [x] All scoped sections above are `[x]`
- [x] lint + typecheck + build (pre-existing TS error in `BrownButterPage.tsx`)

**Notes / blockers:** `MenuFastCardsSearch` + `filterMenuCategories`; `MenuFastCardsContentShell` for about/contact; order success uses CSS checkmark; track via `ThemedAccountShell` + `MenuFastCardsAccountShell`.

---

## Session log

| Date | Component | Result |
|------|-----------|--------|
| 2026-07-02 | shell-header | MenuFastCardsHeader extracted |
| 2026-07-02 | catalog-categories | Category nav component + a11y scroll |
| 2026-07-02 | catalog-grid | MenuFastCardsGrid; no-image column hidden; sold-out styling |
| 2026-07-02 | account-shell | MenuFastCardsAccountShell + cards sidebar nav |
| 2026-07-02 | catalog-empty | MenuFastCardsEmpty; item count helpers |
| 2026-07-03 | commerce-add-to-cart | MenuFastCardsAddControl; auth gate + variant stock |
| 2026-07-03 | commerce-cart | MenuFastCardsCart bottom sheet + summary bar |
| 2026-07-03 | commerce-checkout | MenuFastCardsCheckout; cards appearance + auth return / |
| 2026-07-03 | system-store-status | MenuFastCardsStoreStatus; scheduled checkout when closed |
| 2026-07-03 | shell-footer | MenuFastCardsFooter; config-driven contact/social links |
| 2026-07-03 | shell-mobile-nav | MenuFastCardsMenuDrawer + sticky cart dock layout fix |
| 2026-07-03 | content-hero | MenuFastCardsHero; admin-only copy, collapses when empty |
| 2026-07-03 | verify-full-pass | Search, about/contact shell, emoji-free success, full checklist |
