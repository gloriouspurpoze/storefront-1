import type { CatalogKindDef } from '../core/catalog'
import type { WorkforceRoleDef } from '../core/workforce'
import type { TaxStrategyDef } from '../core/tax'
import type { ComplianceFieldDef } from '../core/compliance'
import type { IntegrationDef } from '../core/integrations'
import type { ReportDef } from '../core/reports'

export const homeServicesCatalogKinds: CatalogKindDef[] = [
  {
    key: 'service',
    label: 'Service',
    supportsDuration: true,
    supportsSkillRequired: true,
    customFields: [{ key: 'skill_tags', label: 'Skill tags', type: 'string' }],
  },
  { key: 'product', label: 'Spare part / product', supportsSkillRequired: false },
]

export const homeServicesWorkforceRoles: WorkforceRoleDef[] = [
  { key: 'technician', label: 'Technician', requiresLicense: true, commissionModel: 'percent_of_sale' },
  { key: 'supervisor', label: 'Supervisor', commissionModel: 'fixed_salary' },
]

export const homeServicesTaxStrategy: TaxStrategyDef = {
  key: 'home_services_gst_18',
  label: 'Home services GST (18%)',
  rates: [{ key: 'gst_18', label: 'GST 18%', rate: 18 }],
  requiredFields: ['sac_code'],
}

export const homeServicesCompliance: ComplianceFieldDef[] = [
  { key: 'gstin', label: 'GSTIN', required: true, validatePattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' },
]

export const homeServicesIntegrations: IntegrationDef[] = [
  { key: 'razorpay', label: 'Razorpay', scope: 'payments', auth: 'api_key' },
  { key: 'twilio_whatsapp', label: 'WhatsApp (Twilio)', scope: 'messaging', auth: 'api_key' },
  { key: 'google_maps', label: 'Google Maps', scope: 'maps', auth: 'api_key' },
]

export const homeServicesReports: ReportDef[] = [
  { key: 'bookings_pipeline', label: 'Bookings pipeline', path: '/bookings', permissions: ['view_bookings'] },
  { key: 'provider_performance', label: 'Professional performance', path: '/professionals', permissions: ['view_providers'] },
  { key: 'revenue', label: 'Revenue', path: '/finance', permissions: ['view_finance'] },
]
