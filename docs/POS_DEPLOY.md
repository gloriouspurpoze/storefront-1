# POS deploy notes (admin desk)

## Route

- Web: `/operations/pos` (vertical-aware via `PosEntryPage`)
- API: `POST /api/bookings/admin` with `posPricing` + `totalAmount`

## Permissions

- `create_bookings` or `manage_bookings`

## Customer attachment (three paths)

Staff choose the path that fits the counter conversation:

| Path | When to use | Password at counter? | History / tracking |
|------|-------------|----------------------|-------------------|
| **1. Search directory** | Returning customer | No | Existing profile + past jobs |
| **2. Walk-in (phone-first)** | Default for walk-ins / phone desk | No | Booking ref after commit; OTP on same phone merges history later |
| **3. Full account** | Customer wants app login now, GST email, wallet/coupons | Yes (temp password) | Immediate login credentials |

**Walk-in API:** `POST /api/users/directory/find-or-create` (preferred). If unavailable, admin falls back to internal register with placeholder email — still no password handoff at counter.

**After commit:** share the **customer track link** from the success dialog or booking detail (`/track-booking?ref=…&phone=…`). SMS also sends when Twilio is configured (`PUBLIC_BOOKING_TRACK_URL` on the API for link in SMS).

## Customer tracking (public — consumer site)

Share links on **profixer.in** (not the admin host). Set in admin `.env`:

```bash
REACT_APP_PUBLIC_SITE_ORIGIN=http://localhost:3000   # local consumer Next app
# Production: https://www.profixer.in
```

| What | URL |
|------|-----|
| **Customer page** | `{PUBLIC_SITE_ORIGIN}/track-booking?ref=XXXXXXXX&phone=+91…` |
| **API** | `GET /api/public/bookings/track?ref=&phone=` |
| **SMS (backend)** | `PUBLIC_BOOKING_TRACK_URL=https://www.profixer.in/track-booking` |

POS “Copy track link” and booking detail cards use `REACT_APP_PUBLIC_SITE_ORIGIN`. Old admin `/track-booking` URLs redirect to the consumer site when that env is set.

Customer page includes CTAs: **Sign in with OTP** and **Book another service** to drive retention on the consumer site.

## Pricing alignment

POS totals use the same stack as consumer checkout (see Operations → Fees & commissions live preview):

1. Merchandise subtotal (platform services + parts)
2. Manual discount and coupon (coupon re-validated on commit)
3. Weighted merchandise GST from catalog line `gst_percentage` / `tax_included`
4. Visit fee (`visitingFeeFixed`) waived when subtotal ≥ `freeVisitThresholdRupees`
5. Convenience fee (% + flat, floored at `minimumPlatformFeePerBooking`)
6. GST on fee lines (`gstPercentOnFees`)
7. Optional after-hours uplift (`afterHoursSurchargePercent`)

**City zones:** service address city is matched to Operating cities; `priceMultiplier` applies to counter prices.

**Industry rate cards:** CMS customer rate-card rows override catalog base prices when the service name matches (same merge as Industry → Rate card CMS).

## Environment

| Variable | Purpose |
|----------|---------|
| `REACT_APP_GOOGLE_MAPS_EMBED_KEY` | Optional map preview on service address (HTTP referrer–restricted Embed API key) |

## Verticals

| Vertical | POS surface |
|----------|-------------|
| `home_services` | Full home-services POS |
| `salon` | Same pipeline, salon labels (appointments / stylists) |
| `restaurant` | Gate page — use Reservations instead |
