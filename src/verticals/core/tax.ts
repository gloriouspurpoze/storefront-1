/** Tax / GST strategy hints per vertical (enforcement in billing/invoicing services). */

export interface TaxRateDef {
  key: string
  label: string
  /** Percentage e.g. 18 for 18% GST */
  rate: number
}

export interface TaxStrategyDef {
  key: string
  label: string
  rates: TaxRateDef[]
  requiredFields?: string[]
}
