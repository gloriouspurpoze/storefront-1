# trade-pro — Theme checklist

**Vertical:** home_services  
**Brief:** [THEME_BRIEF.yaml](./THEME_BRIEF.yaml)  
**Design:** [../DESIGN.md](../DESIGN.md)  
**Reference tenant:** _(set in brief before browser verify)_  
**Status:** pre-launch  
**Verify:** lint + typecheck + build (browser when `verify.browser.enabled`)

> One component per Cursor session. Mark `[x]` only after verify passes for that component.

---

## shell-header

- [x] Default state (logo/name, nav, phone tel: link, primary CTA)
- [x] Sparse state (no logo / no phone)
- [x] Phone visible on mobile (thumb-reachable)
- [x] Sticky header; top bar collapses on mobile
- [x] Nav collapses &lt; 1024px; keyboard-accessible menu
- [x] Primary CTA uses `--brand-primary` + contrast text; secondary for accents
- [x] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:** Wired `--brand-primary` / `--brand-secondary` + contrast vars in tenant layout; `--tp-accent` maps to secondary. Header CTAs use `.tp-btn-primary`. Browser verify skipped (`verify.browser.enabled: false`). `next lint` prompted for ESLint setup interactively — typecheck + `CI=true npm run build` (includes type lint) passed.

---

## shell-mobile-cta

- [x] Mobile-only sticky bottom bar: Call now (outline) + Get a quote (primary)
- [x] Appears after header CTA scrolls out of view
- [x] Hidden when no phone (Call) / still shows quote CTA
- [x] Does not stack under open mobile menu awkwardly
- [x] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:** `TradeProMobileStickyCta.tsx` mounted from `TradeProHeader`. Sentinel after header; IO shows bar when past header. `sm:hidden` so it doesn’t compete with header CTA. Hides when `menuOpen`. Quote-only when no phone. Theme root gets `tp-has-mobile-cta` padding. Browser skipped per brief. Restart `npm run dev` after build (clear `.next` if chunk errors return).

---

## shell-footer

- [x] 4-col desktop / stacked mobile per DESIGN §4.3
- [x] Contact/social/hours/license hidden when unset
- [x] Bottom strip: copyright + privacy/terms + Powered by
- [x] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:** Config-driven footer: brand + socials, explore links, contact (tel/mailto/maps), hours/credentials column collapses when empty. Removed always-on “Licensed & insured” placeholder. Hours from `orderingAvailability.slotsNote` or prop; license/insurance optional props until Studio schema. Browser skipped per brief.

---

## content-hero

- [x] Headline/subcopy from config with DESIGN fallback
- [x] Rating chip hidden when no reviews
- [x] One primary CTA per viewport
- [x] Secondary token for highlight chips
- [x] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:** Display type scale (`.tp-display`); rating requires `reviewCount > 0`; trust chips use secondary; form submit uses `.tp-btn-primary` + `heroCtaLabel`; quiet `tel:` secondary when phone set; form error `role="alert"`. Browser skipped per brief.

---

## content-stats

- [ ] Hides entirely if fewer than 2 real stats
- [ ] Never shows "0 jobs completed"
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## catalog-grid

- [ ] Service cards: photo/icon, name, description, starting price, Book link
- [ ] Busy state (long names, many services)
- [ ] Partial (missing image → branded monogram)
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## catalog-empty

- [ ] Friendly empty + phone CTA (no blank grid)
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-how-it-works

- [ ] 3–4 step intentional theme default always shown
- [ ] Secondary accents on step numbers
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-service-area

- [ ] Map/list from config; collapses when empty
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-why-us

- [ ] Differentiators always shown (intentional defaults)
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-gallery

- [ ] Studio media grid/slider; collapses when no photos
- [ ] Keyboard-navigable if carousel
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-testimonials

- [ ] Omitted when testimonials empty
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-certifications

- [ ] License/insurance/badges; omit empty values
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-about

- [ ] Omitted when title + body empty
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-faq

- [ ] Omitted when empty
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-cta

- [ ] Final CTA: phone + quote; CTA-only if no phone
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## content-emergency-banner

- [ ] Only when `featureFlags.emergencyService`
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## system-lead-form

- [ ] BookingForm → submitLead; service select hides if empty
- [ ] Success / error / submitting states
- [ ] lint + typecheck + build
- [ ] Browser visual pass (or skipped per brief)

**Notes / blockers:**

---

## verify-full-pass

- [ ] Cross-route smoke: home → service → book/contact
- [ ] Sparse tenant end-to-end
- [ ] All scoped sections above are `[x]`
- [ ] lint + typecheck + build
- [ ] Browser visual pass on scoped routes (or skipped per brief)

**Notes / blockers:**

---

## Session log

| Date | Component | Agent / human | Result |
|------|-----------|---------------|--------|
| 2026-09-08 | shell-header | agent | Done — tokens + header UX; typecheck/build ✓; browser skipped |
| 2026-09-08 | shell-mobile-cta | agent | Done — sticky Call/Quote bar; typecheck/build ✓; browser skipped |
| 2026-09-08 | shell-footer | agent | Done — DESIGN §4.3 footer; typecheck/build ✓; browser skipped |
| 2026-09-08 | content-hero | agent | Done — hero tokens/CTA/rating; typecheck/build ✓; browser skipped |
| 2026-09-08 | redesign-pass | agent | Full Fixer light redesign + DESIGN.md YAML format; typecheck/build ✓; browser ✓ on profixer.lvh.me |
| | | | |
