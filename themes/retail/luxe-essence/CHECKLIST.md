# luxe-essence — Theme checklist

**Vertical:** retail  
**Brief:** [THEME_BRIEF.yaml](./THEME_BRIEF.yaml)  
**Reference tenant:** _(set in brief)_  
**Status:** launch-ready (browser verify pending `referenceTenant`)  
**Verify:** lint + typecheck + build only (no browser until `referenceTenant` set)

> One component per Cursor session. Mark `[x]` only after lint, typecheck, and build pass for that component.

---

## shell-header

- [x] Default state (logo/site name, tagline, account + cart controls)
- [x] Sparse state (no logo — name only; tagline hidden when unset)
- [x] Mobile 375px layout (menu toggle visible; no emoji icons)
- [x] Keyboard focus on menu / account / cart
- [x] Branding from config (siteName, tagline, logoUrl); no hardcoded tenant copy
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)
- [x] No hardcoded `| STUDIO` brand split unless in brief defaults

**Notes / blockers:** `LuxeEssenceHeader.tsx` extracted; SVG menu + cart icons; optional `|` split only when present in admin siteName.

---

## shell-footer

- [x] Contact/social links hidden when unset in config
- [x] Default + sparse states (tagline/address/contact optional)
- [x] Mobile 375px (existing responsive grid)
- [x] Styled consistently with luxe palette
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceFooter.tsx`; phone, email, WhatsApp, all socials from branding; address in brand column.

---

## shell-mobile-nav

- [x] StorefrontMenuDrawer opens/closes; keyboard accessible
- [x] Link set matches footer (no duplicate clutter)
- [x] Mobile 375px
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceMenuDrawer.tsx`; `navLinks` on shared drawer; luxe CSS vars + `theme-luxe-essence` on page root.

---

## content-hero

- [x] Copy from admin config only (`heroHeadline`, `heroSubcopy`); collapse partial fields gracefully
- [x] Hero product cards from catalog when available; no emoji placeholders when empty
- [x] One primary CTA per viewport
- [x] Promo strip from config/flags (not hardcoded `STRIP_ITEMS`)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceHero.tsx` + `lib/storefrontPromoStrip.ts`; title falls back to `siteName` (branding); promo from shipping policy when `showOfferMarquee`. CMS announcement supersedes shipping strip when active.

---

## content-announcement

- [x] Slim marquee above sticky header when CMS announcement + `showOfferMarquee`
- [x] Empty / inactive → no DOM (layout collapses)
- [x] Takes precedence over `LuxeEssencePromoStrip` shipping strip
- [x] lint on touched files

**Notes / blockers:** `content/LuxeEssenceAnnouncementBar.tsx` + `LuxeEssenceStorefrontPage` fetch via `fetchStorefrontAnnouncement`.

---

## content-offers

- [x] Horizontal strip below hero / before product grid
- [x] Empty → collapse
- [x] lint on touched files

**Notes / blockers:** `content/LuxeEssenceOffersStrip.tsx`; merges `offers` + `home_page_hero` + `seasonal` like MenuFast.

---

## content-promo

- [x] Mid-homepage editorial band after product grid / before footer
- [x] Empty → collapse
- [x] lint on touched files

**Notes / blockers:** `content/LuxeEssencePromoBlock.tsx`; placement `promo` only.

---

## content-popup

- [x] Session-dismissible overlay on homepage load
- [x] Empty → no popup
- [x] lint on touched files

**Notes / blockers:** `content/LuxeEssencePopupBanner.tsx`; `popupStorageKey(tenantId)`.

---

## catalog-grid

- [x] Product card layout per HTML ref
- [x] Rich catalog + busy state (long names, price via `formatMoney` / `formatListPrice`)
- [x] Image fallback without emoji
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceProductGrid.tsx`; CSS placeholder; line-clamp; OOS card styling.

---

## catalog-empty

- [x] Empty catalog message per brief
- [x] Single-product catalog still usable (grid renders one card; empty only when zero products)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceCatalogEmpty.tsx` + shared `LuxeEssenceCatalogSectionShell`.

---

## commerce-add-to-cart

- [x] In-stock add flow with auth gate
- [x] Out-of-stock disabled per brief
- [x] Toast feedback styled (no emoji)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceAddControl`, `useLuxeEssenceAddToCart`, `LuxeEssenceToast`; variant products link to PDP.

---

## commerce-variants

- [x] Variant products use `ProductVariantSelector` / detail modal pattern
- [x] Separate cart lines per variant
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceProductModal`; cart/checkout pass `variantId`; PDP `ProductPurchaseBlock` variant-aware.

---

## commerce-cart

- [x] Modal/sheet: line items, qty, subtotal
- [x] Shipping display from config (not hardcoded ₹1500 / ₹120)
- [x] Empty cart state
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceCartModal.tsx`; `getCartShippingDisplayLabel` in `lib/shippingPolicy.ts`.

---

## commerce-checkout

- [x] Login required; prefill via `useCheckoutCustomerPrefill`
- [x] Delivery fields per `templateSettings`
- [x] Payment methods from `getEnabledPaymentMethods` (not razorpay-only label)
- [x] Closed store blocked per brief
- [x] Order success with Home / track link (no emoji)
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceCheckoutModal.tsx`; shipping policy gate on pay; hardcoded shipping constants removed from page.

---

## account-shell

- [x] `LuxeEssenceAccountShell` matches storefront skin
- [x] Login, orders, profile, track routes
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** Logo + brand split aligned with header; `le-acct-sidebar` for dashboard; header nav hidden when sidebar active.

---

## system-store-status

- [x] Intentionally **out of scope** for retail — open/closed badge is restaurant-only (see `templates/README.md`)
- [x] Checkout still blocks when closed via `useStoreStatus` (no badge UI)

**Notes / blockers:** Badge/card removed from header + hero; `LuxeEssenceStoreStatus.tsx` deleted.

---

## system-shipping-policy

- [x] `ShippingPolicyModal` + `/shipping-policy` route styled
- [x] No hardcoded free-shipping threshold in UI copy
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** `LuxeEssenceShippingPolicyPage` + `LuxeEssenceShippingPolicyModal`; modal `tone="luxe"`; cart uses `getCartShippingDisplayLabel`.

---

## system-track-order

- [x] `/orders/track` works with luxe account theme
- [x] lint + typecheck + build (pre-existing TS errors elsewhere)

**Notes / blockers:** LE tracking classes in `accountThemeClasses` + `luxe-essence.css`; `TrackOrderPageFallback`.

---

## verify-full-pass

- [x] Product detail + cart + checkout routes skinned
- [x] About/contact styled (or documented out-of-scope)
- [x] Emojis removed theme-wide
- [x] Hardcoded shipping constants removed
- [x] All scoped sections above are `[x]`
- [x] lint + typecheck + build

**Notes / blockers:** `LuxeEssenceLayoutPage` shared shell; cart/checkout/about/contact routes wired; `CartClient`/`CheckoutClient` luxe emoji-free + variant-aware keys; PDP via `ProductDetailView` `le-root`; browser skipped per brief (`verify.browser.enabled: false`).

---

## Session log

| Date | Component | Result |
|------|-----------|--------|
| 2026-07-05 | _(plan)_ | THEME_BRIEF.yaml + CHECKLIST.md created |
| 2026-07-05 | shell-header | LuxeEssenceHeader extracted; emoji icons removed |
| 2026-07-05 | shell-footer | LuxeEssenceFooter; config-driven contact/social/address |
| 2026-07-05 | shell-mobile-nav | LuxeEssenceMenuDrawer; footer-aligned nav pills |
| 2026-07-05 | content-hero | LuxeEssenceHero; config promo strip; no emoji placeholders |
| 2026-07-06 | catalog-grid | LuxeEssenceProductGrid; variant list prices; image placeholder |
| 2026-07-06 | catalog-empty | LuxeEssenceCatalogEmpty; brief empty message + section shell |
| 2026-07-06 | commerce-add-to-cart | Add control + auth hook + toast; choose options for variants |
| 2026-07-06 | commerce-variants | Product modal + variantId in cart/checkout; PDP variant selector |
| 2026-07-06 | commerce-cart | LuxeEssenceCartModal; config shipping label; no emojis |
| 2026-07-06 | commerce-checkout | LuxeEssenceCheckoutModal; payment methods; policy gate |
| 2026-07-06 | account-shell | Shell brand/logo; le-acct-sidebar; auth layout |
| 2026-07-06 | system-store-status | LuxeEssenceStoreStatus; themed badge/card; checkout closed gate |
| 2026-07-07 | system-shipping-policy | Policy page + modal tone; checkout gate themed |
| 2026-07-07 | system-track-order | LE tracking panel styles; themed loading fallback |
| 2026-07-07 | verify-full-pass | LayoutPage shell; sub-routes wired; emoji cleanup; CI pass |
| 2026-08-02 | content-announcement / offers / promo / popup | Hybrid CMS wire-up; RSC fetch in StorefrontPage |

---

## Known anti-patterns (pre-perfection audit)

| Issue | Status |
|-------|--------|
| God file ~625 LOC | Reduced via extractions |
| Hardcoded `STRIP_ITEMS` with emojis | Removed |
| Emoji UI in cart/checkout success | Removed (incl. `/cart` `/checkout` clients for luxe) |
| Forced `\| STUDIO` brand split | Removed from account shell |
| Checkout lines omit `variantId` | Fixed in modals + shared clients |
| No payment method selector | Fixed in checkout modal |
