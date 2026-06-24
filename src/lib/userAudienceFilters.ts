import type { User } from '../types'

/** Consumer app accounts (Customers page) — never dashboard staff. */
export function isConsumerCustomer(user: Pick<User, 'userType' | 'isDashboardMember'>): boolean {
  return user.userType === 'customer' && user.isDashboardMember !== true
}

/** Dashboard / team accounts (Team members page) — never consumer customers. */
export function isDashboardTeamMember(user: Pick<User, 'userType' | 'isDashboardMember'>): boolean {
  if (user.userType === 'customer' || user.userType === 'provider' || user.userType === 'professional') {
    return false
  }
  if (user.userType === 'super_admin') return true
  if (user.userType === 'admin') return user.isDashboardMember === true
  return false
}

export function filterUsersForAudience(rows: User[], audience: 'customers' | 'members'): User[] {
  if (audience === 'customers') return rows.filter(isConsumerCustomer)
  return rows.filter(isDashboardTeamMember)
}
