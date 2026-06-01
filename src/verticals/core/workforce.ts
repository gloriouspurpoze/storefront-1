/** Workforce roles (professionals, stylists, chefs, …) per vertical pack. */

export type CommissionModel = 'percent_of_sale' | 'fixed_salary' | 'mixed' | 'tip_pool'

export interface WorkforceRoleDef {
  key: string
  label: string
  requiresLicense?: boolean
  requiresSkills?: string[]
  commissionModel?: CommissionModel
}
