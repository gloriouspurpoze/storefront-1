/**
 * Industry (vertical) aware copy for the mobile admin.
 *
 * Mirrors the web vertical packs (src/verticals/.../engagement.ts): the same
 * underlying bookings API is relabeled per industry so a salon sees
 * "Appointments", a restaurant sees "Reservations", etc.
 */

export type VerticalKey =
  | 'home_services'
  | 'restaurant'
  | 'salon'
  | 'fitness'
  | 'real_estate'
  | 'b2b_services'
  | 'retail'
  | 'healthcare'
  | 'education'

export interface VerticalLabels {
  /** e.g. "Booking" / "Reservation" / "Appointment" */
  engagementSingular: string
  /** e.g. "Bookings" / "Reservations" / "Appointments" */
  engagementPlural: string
  /** Short dashboard section title, e.g. "Recent bookings" */
  recentTitle: string
  /** Workforce noun, e.g. "Professional" / "Stylist" / "Agent" */
  workforceSingular: string
}

const DEFAULT_LABELS: VerticalLabels = {
  engagementSingular: 'Booking',
  engagementPlural: 'Bookings',
  recentTitle: 'Recent bookings',
  workforceSingular: 'Professional',
}

const LABELS_BY_VERTICAL: Record<VerticalKey, VerticalLabels> = {
  home_services: DEFAULT_LABELS,
  b2b_services: {
    engagementSingular: 'Job',
    engagementPlural: 'Jobs',
    recentTitle: 'Recent jobs',
    workforceSingular: 'Technician',
  },
  restaurant: {
    engagementSingular: 'Reservation',
    engagementPlural: 'Reservations',
    recentTitle: 'Recent reservations',
    workforceSingular: 'Staff',
  },
  salon: {
    engagementSingular: 'Appointment',
    engagementPlural: 'Appointments',
    recentTitle: 'Recent appointments',
    workforceSingular: 'Stylist',
  },
  fitness: {
    engagementSingular: 'Session',
    engagementPlural: 'Sessions',
    recentTitle: 'Recent sessions',
    workforceSingular: 'Trainer',
  },
  real_estate: {
    engagementSingular: 'Viewing',
    engagementPlural: 'Viewings',
    recentTitle: 'Recent viewings',
    workforceSingular: 'Agent',
  },
  retail: {
    engagementSingular: 'Order',
    engagementPlural: 'Orders',
    recentTitle: 'Recent orders',
    workforceSingular: 'Associate',
  },
  healthcare: {
    engagementSingular: 'Appointment',
    engagementPlural: 'Appointments',
    recentTitle: 'Recent appointments',
    workforceSingular: 'Practitioner',
  },
  education: {
    engagementSingular: 'Class',
    engagementPlural: 'Classes',
    recentTitle: 'Recent classes',
    workforceSingular: 'Instructor',
  },
}

export function normalizeVerticalKey(raw: unknown): VerticalKey {
  if (typeof raw === 'string' && raw in LABELS_BY_VERTICAL) {
    return raw as VerticalKey
  }
  return 'home_services'
}

export function verticalLabels(raw: unknown): VerticalLabels {
  return LABELS_BY_VERTICAL[normalizeVerticalKey(raw)]
}
