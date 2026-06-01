import type { CatalogKindDef } from '../core/catalog'
import type { WorkforceRoleDef } from '../core/workforce'
import type { TaxStrategyDef } from '../core/tax'
import type { ComplianceFieldDef } from '../core/compliance'
import type { IntegrationDef } from '../core/integrations'
import type { ReportDef } from '../core/reports'

export const restaurantCatalogKinds: CatalogKindDef[] = [
  {
    key: 'menu_item',
    label: 'Menu item',
    supportsModifiers: true,
    supportsAllergens: true,
    customFields: [{ key: 'allergens', label: 'Allergens', type: 'string' }],
  },
]

export const restaurantWorkforceRoles: WorkforceRoleDef[] = [
  { key: 'server', label: 'Server', commissionModel: 'tip_pool' },
  { key: 'chef', label: 'Chef', commissionModel: 'fixed_salary' },
  { key: 'host', label: 'Host', commissionModel: 'fixed_salary' },
]

export const restaurantTaxStrategy: TaxStrategyDef = {
  key: 'restaurant_gst_5_18',
  label: 'Restaurant GST (5% / 18%)',
  rates: [
    { key: 'gst_5', label: 'GST 5% (non-AC)', rate: 5 },
    { key: 'gst_18', label: 'GST 18% (AC / liquor)', rate: 18 },
  ],
  requiredFields: ['hsn_code'],
}

export const restaurantCompliance: ComplianceFieldDef[] = [
  { key: 'fssai_license_no', label: 'FSSAI license number', required: true },
  { key: 'gstin', label: 'GSTIN' },
]

export const restaurantIntegrations: IntegrationDef[] = [
  { key: 'zomato', label: 'Zomato', scope: 'orders', auth: 'oauth2' },
  { key: 'swiggy', label: 'Swiggy', scope: 'orders', auth: 'oauth2' },
  { key: 'razorpay', label: 'Razorpay', scope: 'payments', auth: 'api_key' },
]

export const restaurantReports: ReportDef[] = [
  { key: 'reservations', label: 'Reservations', path: '/bookings', permissions: ['view_bookings'] },
  { key: 'orders', label: 'Orders', path: '/orders', permissions: ['view_orders'] },
]
