# Storefront HTML source → React templates

Design reference HTML lives here. Each file is converted into a React layout under `storefront/themes/`.

## Restaurant (`restaurant/`)

| HTML source | `themeKey` (admin picker) | React implementation | Best for |
|-------------|---------------------------|----------------------|----------|
| `temp1/index.html` | `saffron` | `themes/restaurant/saffron/` | Full-service restaurants, editorial order-online |
| `temp2/menufast_menu_templates.html` (Minimal tab) | `menufast-minimal` | `themes/restaurant/menufast/MenuFastMinimalPage.tsx` | Tiffin, cloud kitchens, daily menus |
| `temp2/menufast_menu_templates.html` (Cards tab) | `menufast-cards` | `themes/restaurant/menufast/MenuFastCardsPage.tsx` | Bakeries, cafés, image-heavy menus |

**Note:** `temp2` is one HTML mockup with two layout variants. Both are registered as separate selectable templates.

## Retail / e-commerce (`e-commerce/`)

| HTML source | `themeKey` (admin picker) | React implementation | Best for |
|-------------|---------------------------|----------------------|----------|
| `temp1/theme1-soft-studio.html` | `soft-studio` | `themes/retail/soft-studio/SoftStudioPage.tsx` | D2C brands, boutiques, handmade goods |

**Note:** E-commerce tenants use vertical key `retail` in the backend. The theme catalog filters by `verticalKey`, so only retail / e-commerce tenant admins see these templates.

## Home services

| Vertical | Layout template 1 | Layout template 2 |
|----------|-------------------|-------------------|
| `home_services` | `classic` | `trade-pro` |
| `retail` (also) | `classic` | `luxury-retail` (Pro) |

Add folders under `html-source/home_services/` when design mocks are ready.

## Where tenant admin selects a template

1. Sign in to the **admin dashboard** (`/auth`)
2. Go to **Settings → Storefront** (`/settings/storefront`)
3. Open the **Themes** tab
4. Under **Layout templates**, click a card — saves immediately via `PATCH /api/storefront-studio/config` (`themeKey`)
5. Click **Preview** (top right) to open the live storefront

Catalog is served from `fixer-backend/src/modules/storefront-studio/catalog/storefrontThemes.ts` and filtered by the tenant's `verticalKey`.

## Ordering APIs (storefront checkout)

The storefront client already called these endpoints; they are now implemented on the backend:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/public/storefront/checkout/create-order` | Validate cart, create Razorpay order (`x-tenant-id` header) |
| `POST` | `/api/public/storefront/checkout/verify` | Verify payment signature, create `Order`, CRM contact, confirmation email |
| `GET` | `/api/public/storefront/orders/track` | Track order by order number + email |

**Request body (create-order):**
```json
{
  "items": [{ "productId": "...", "quantity": 2 }],
  "customerEmail": "guest@example.com",
  "customerName": "Guest Name",
  "notes": "optional delivery note"
}
```

**Requires:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in backend `.env`.

**Frontend helper:** `storefront/lib/runStorefrontCheckout.ts` (used by all restaurant templates + retail checkout).


1. Add HTML mock under `html-source/{vertical}/`
2. Register in `storefrontThemes.ts` with `kind: 'layout'` and `htmlSource` path
3. Build React components under `storefront/themes/{vertical}/`
4. Wire in `HomePageSections.tsx` (or vertical layout router)
5. Restart backend so catalog API picks up the new entry
