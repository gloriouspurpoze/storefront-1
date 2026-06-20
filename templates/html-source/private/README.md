# Private (tenant-exclusive) storefront templates

Use this folder for **custom HTML designs** that should only be available to specific tenants — not the public theme marketplace.

## Folder layout

```
private/
├── README.md                    ← you are here
├── _example/                    ← copy this skeleton for a new template
│   └── index.html
└── <your-slug>/                 ← e.g. acme-boutique
    ├── index.html               ← your full-page design reference
    └── assets/                  ← images, fonts (reference only — not served in prod)
```

## End-to-end workflow

### 1. Drop your HTML

Place the design file at:

```
private/<your-slug>/index.html
```

Use a short slug (lowercase, hyphens). Example: `acme-boutique`.

### 2. Register in the platform (super-admin)

**Brown Butter** has a one-shot seed (template + products + theme):

```bash
cd homeservice_monolotic/fixer-backend
npm run onboard:reference-tenants   # if tenant missing
npm run seed:thebrownbutter-storefront
```

Or open **Settings → Private templates** (`/settings/private-templates`) and create a record manually:

| Field | Example |
|-------|---------|
| **key** | `private-acme-boutique` (must start with `private-`) |
| **name** | Acme Boutique |
| **vertical** | `retail` |
| **htmlSource** | `private/acme-boutique/index.html` |
| **assigned tenants** | Select only the tenant(s) who should see this template |

Only assigned tenants will see it under **Settings → Storefront → Themes**. Other tenants never see it.

### 3. Convert HTML → React

1. Create components under `storefront/themes/private/<your-slug>/` (or reuse an existing vertical folder).
2. Register the layout in `storefront/themes/private/registry.ts`:

```typescript
'private-acme-boutique': {
  vertical: 'retail',
  render: ({ products, tenant, config }) => (
    <AcmeBoutiquePage products={products ?? []} tenant={tenant} config={config} />
  ),
},
```

3. Set `reactModulePath` on the Mongo record (optional, for documentation):  
   `themes/private/acme-boutique/AcmeBoutiquePage.tsx`

### 4. Tenant selects the template

The assigned tenant opens **Settings → Storefront → Themes**, picks the **Custom** layout, and clicks **Preview**.

## Notes

- HTML files are **design reference only** — production renders React/Next.js components.
- Private template keys must use the `private-` prefix to avoid collisions with public themes (`soft-studio`, `saffron`, …).
- Deactivating a private template hides it from all tenants; tenants still on that `themeKey` should be migrated to a public theme.
