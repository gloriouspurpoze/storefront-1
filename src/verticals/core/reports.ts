/** Report definitions surfaced in admin analytics per vertical. */

export interface ReportDef {
  key: string
  label: string
  /** Route or report component id in host app */
  path: string
  permissions?: string[]
}
