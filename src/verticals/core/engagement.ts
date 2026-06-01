/** Engagement (booking / reservation / appointment) metadata per vertical pack. */

export interface EngagementStatusDef {
  key: string
  label: string
  color?: string
  terminal?: boolean
  /** Allowed transitions for admin status updates (optional enforcement). */
  next?: string[]
}

export interface EngagementTypeDef {
  key: string
  label: string
  statuses: EngagementStatusDef[]
  defaultSortField?: string
  defaultColumns?: string[]
}
