import { buildAdminNavigationDefs } from '../../lib/buildAdminSidebar'
import { getDashboardLayout } from '../../lib/verticalDashboard'
import { getBillingPlansForVertical, getRecommendedPlan } from '../../lib/verticalPlans'
import { getVerticalPack, verticalKeyFromMarketingSlug } from '../registry'
import { validateVerticalPack } from '../validatePack'
import { getEngagementStatusLabel } from '../../lib/verticalEngagement'
import { toApiBookingStatus } from '../../lib/engagementStatusAliases'

describe('vertical packs', () => {
  it('validates home_services, restaurant, salon, and stub packs', () => {
    expect(() => validateVerticalPack(getVerticalPack('home_services'))).not.toThrow()
    expect(() => validateVerticalPack(getVerticalPack('restaurant'))).not.toThrow()
    expect(() => validateVerticalPack(getVerticalPack('salon'))).not.toThrow()
    expect(() => validateVerticalPack(getVerticalPack('clinic'))).not.toThrow()
  })

  it('resolves marketing slugs to vertical keys', () => {
    expect(verticalKeyFromMarketingSlug('for-restaurants')).toBe('restaurant')
    expect(verticalKeyFromMarketingSlug('for-home-services')).toBe('home_services')
    expect(getVerticalPack('home_services').catalogKinds?.length).toBeGreaterThan(0)
  })

  it('home_services sidebar includes bookings', () => {
    const groups = buildAdminNavigationDefs('home_services')
    const ops = groups.find((g) => g.id === 'hs_operations')
    expect(ops?.items.some((i) => i.id === 'bookings')).toBe(true)
  })

  it('restaurant sidebar uses reservations label and hides hs-only groups', () => {
    const groups = buildAdminNavigationDefs('restaurant')
    expect(groups.find((g) => g.id === 'hs_operations')).toBeUndefined()
    const foh = groups.find((g) => g.id === 'restaurant_ops')
    expect(foh?.items.some((i) => i.name === 'Reservations')).toBe(true)
  })

  it('maps booking status labels for home_services', () => {
    expect(getEngagementStatusLabel('home_services', 'in_progress')).toBe('In progress')
  })

  it('maps legacy API statuses to restaurant pack labels', () => {
    expect(getEngagementStatusLabel('restaurant', 'pending')).toBe('Booked')
    expect(getEngagementStatusLabel('restaurant', 'in_progress')).toBe('Ordering')
  })

  it('maps restaurant pack keys to bookings API on write', () => {
    expect(toApiBookingStatus('restaurant', 'booked')).toBe('pending')
    expect(toApiBookingStatus('restaurant', 'seated')).toBe('accepted')
    expect(toApiBookingStatus('home_services', 'in_progress')).toBe('in_progress')
  })

  it('salon sidebar uses appointments and hides hs-only groups', () => {
    const groups = buildAdminNavigationDefs('salon')
    expect(groups.find((g) => g.id === 'hs_operations')).toBeUndefined()
    const ops = groups.find((g) => g.id === 'salon_ops')
    expect(ops?.items.some((i) => i.name === 'Appointments')).toBe(true)
  })

  it('restaurant dashboard omits category_performance section', () => {
    const layout = getDashboardLayout('restaurant')
    expect(layout.sections).not.toContain('category_performance')
    expect(layout.kpis.some((k) => k.label.includes('Reservations'))).toBe(true)
  })

  it('maps salon API in_service to In service label', () => {
    expect(getEngagementStatusLabel('salon', 'in_progress')).toBe('In service')
  })

  it('exposes distinct billing plans per vertical', () => {
    const hs = getRecommendedPlan('home_services')
    const rest = getRecommendedPlan('restaurant')
    expect(hs.key).toBe('hs_starter')
    expect(rest.key).toBe('rest_starter')
    expect(getBillingPlansForVertical('salon').length).toBeGreaterThanOrEqual(3)
  })
})
