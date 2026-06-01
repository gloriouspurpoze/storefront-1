/** Regulatory fields collected per vertical (FSSAI, salon license, etc.). */

export interface ComplianceFieldDef {
  key: string
  label: string
  required?: boolean
  validatePattern?: string
}
