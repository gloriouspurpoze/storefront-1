import type { CatalogKindDef } from '../core/catalog'
import type { WorkforceRoleDef } from '../core/workforce'
import type { TaxStrategyDef } from '../core/tax'
import type { ComplianceFieldDef } from '../core/compliance'
import type { IntegrationDef } from '../core/integrations'
import type { ReportDef } from '../core/reports'

export const salonCatalogKinds: CatalogKindDef[] = [
  { key: 'treatment', label: 'Treatment', supportsDuration: true, supportsSkillRequired: true },
  { key: 'retail_product', label: 'Retail product' },
]

export const salonWorkforceRoles: WorkforceRoleDef[] = [
  { key: 'stylist', label: 'Stylist', commissionModel: 'percent_of_sale' },
  { key: 'receptionist', label: 'Receptionist', commissionModel: 'fixed_salary' },
]

export const salonTaxStrategy: TaxStrategyDef = {
  key: 'salon_gst_18',
  label: 'Salon services GST (18%)',
  rates: [{ key: 'gst_18', label: 'GST 18%', rate: 18 }],
}

export const salonCompliance: ComplianceFieldDef[] = [
  { key: 'shop_establishment', label: 'Shop & establishment registration' },
]

export const salonIntegrations: IntegrationDef[] = [
  { key: 'razorpay', label: 'Razorpay', scope: 'payments', auth: 'api_key' },
  { key: 'whatsapp_reminders', label: 'WhatsApp reminders', scope: 'messaging', auth: 'api_key' },
]

export const salonReports: ReportDef[] = [
  { key: 'appointments', label: 'Appointments', path: '/bookings', permissions: ['view_bookings'] },
  { key: 'stylist_utilization', label: 'Stylist utilization', path: '/professionals', permissions: ['view_providers'] },
]
