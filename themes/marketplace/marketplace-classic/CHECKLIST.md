# marketplace-classic — checklist

Tick a box only after `npx tsc --noEmit` and `npx vitest run` pass and the route was checked on
`itsgivin.lvh.me:3001`.

## Shell
- [ ] Header: inline search (desktop), search sheet (mobile), category mega menu, Sellers / Sell links, cart badge
- [ ] Cart drawer: per-seller shipping note
- [ ] Footer: Shop / Sell / Help columns

## Browse
- [ ] Home: every block toggles from Studio (`effectiveSections`)
- [ ] `/products`, `/categories/[slug]`, `/search`: facets, sort, pagination are URLs; mobile filter drawer closes on navigate
- [ ] `/search`: matching sellers above products
- [ ] PDP: gallery, "by seller", buy box keyed by listing, Sold-by card, more from this seller, Product JSON-LD seller
- [ ] `/sellers`: search + pagination, featured first
- [ ] `/store/[slug]`: banner, avatar, rating, location, bio, policies, faceted catalog, Store JSON-LD, metadata

## Buy
- [ ] `/cart`: grouped by seller, live quote, unavailable-listing error blocks checkout
- [ ] `/checkout`: sign-in gate, contact + phone, address validation, Razorpay, cancel keeps cart
- [ ] `/checkout/success`: sub-orders per seller
- [ ] `/account/orders`: checkouts with sub-order status + tracking links

## Sell
- [ ] `/sell`: landing
- [ ] `/sell/apply`: validation, honeypot, duplicate-email message, confirmation; appears in admin Seller onboarding

## Regression
- [ ] Retail, restaurant, home-services tenants render unchanged; marketplace-only routes 404 there
