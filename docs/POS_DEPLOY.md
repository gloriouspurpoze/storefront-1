# ProFixer admin POS — deploy checklist

## Backend (`fixer-backend`)

1. Deploy a build that includes **`POST /api/bookings/admin`** (admin JWT + `booking:create` / dashboard `create_bookings`).
2. Staff dashboard users receive **`create_bookings`** via server defaults in `src/core/rbac/dashboardRolePermissions.ts` (`staff` role).  
   - Users with **`explicit`** permission mode must have `create_bookings` (and usually `view_bookings`) granted on their account.
3. CORS must allow your admin origin (see `app.ts` / `config.CORS.ORIGIN`).

## Admin (`fixer-admin`)

1. Set **`REACT_APP_API_URL`** to your API base including `/api`, e.g. `https://api.profixer.in/api`.
2. Route: **`/operations/pos`** (sidebar: **Operations → POS — Home services**).
3. Gate: **`create_bookings`** or **`manage_bookings`** (matches backend booking create).
4. POS checkout always sends **`posPricing`** (line subtotal, manual + coupon discount, GST flags). Optional **`parts`**, **`couponCode`**, and **`splitTender`** are validated server-side against **`totalAmount`**.
5. **Maps**: “Open in Google Maps” uses the typed address (no API key). Optional **`REACT_APP_GOOGLE_MAPS_EMBED_KEY`** (Maps Embed API, referrer-restricted browser key) enables the inline map preview on the POS ticket.

## Order of rollout

Deploy **backend first**, then **admin**, so the POS screen never calls a missing route.

## Quick-create customer (POS)

Uses **`POST /auth/register`** with a generated compliant password. Counter staff should hand the password to the customer (or trigger a password reset flow from support). Operators with **`create_users`** can continue to use **Users** for full admin-created accounts if preferred.
