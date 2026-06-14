import { api } from './base'

const silent = { showSuccessToast: false, showLoading: false } as const

/** One anonymized completed job surfaced on the public hyperlocal pages. */
export interface RecentJobRow {
  /** Category slug (e.g. "electrician"). */
  service: string
  /** Real booked service name (e.g. "MCB Replacement"). */
  serviceName: string
  /** Sub-area / society / neighbourhood label. */
  area: string
  /** Day-rounded ISO timestamp. */
  completedAt: string
  /** Optional job duration in minutes. */
  durationMins?: number
  /** Optional problem summary (curated jobs). */
  problem?: string
  /** Optional resolution summary (curated jobs). */
  resolution?: string
  /** Provenance: "auto" = from a booking, "manual" = admin-curated. */
  source?: 'auto' | 'manual'
}

export interface RecentJobsMeta {
  window_days: number
  localities: number
  total_jobs: number
  generated_at: string
}

export interface RecentJobsData {
  /** Map of locality slug → anonymized recent jobs. */
  jobs: Record<string, RecentJobRow[]>
  meta: RecentJobsMeta
}

/** Admin-curated recent job (merged into the public feed for extra trust). */
export interface ManualRecentJob {
  /** Category slug (e.g. "electrician"). */
  service: string
  /** Service name shown to users (e.g. "MCB Replacement"). */
  serviceName: string
  /** Sub-area / society / neighbourhood label. */
  area: string
  /** ISO date (YYYY-MM-DD) the job was completed. */
  completedAt: string
  /** Optional duration in minutes. */
  durationMins?: number
  /** Optional short problem summary. */
  problem?: string
  /** Optional resolution summary. */
  resolution?: string
}

/** Map of locality slug → admin-curated jobs. */
export type ManualRecentJobsMap = Record<string, ManualRecentJob[]>

/**
 * SEO data computed server-side (not CMS static blobs). The recent-jobs feed is
 * derived from real completed bookings, anonymized + k-anonymity-gated by the
 * backend before it reaches the public site. This admin endpoint exposes the
 * exact same feed plus counts so admins can verify what crawlers will see.
 */
export class SeoService {
  /** Admin preview/moderation: anonymized recent jobs + meta, grouped by locality. */
  static async getRecentJobs() {
    return api.get<RecentJobsData>('/seo/admin/recent-jobs', silent)
  }

  /** Load the admin-curated manual jobs blob (locality slug → jobs). */
  static async getManualRecentJobs() {
    return api.get<ManualRecentJobsMap>('/cms/admin/static-content/seo-recent-jobs', silent)
  }

  /** Persist the admin-curated manual jobs blob. */
  static async saveManualRecentJobs(payload: ManualRecentJobsMap) {
    return api.put<ManualRecentJobsMap>('/cms/admin/static-content/seo-recent-jobs', payload, silent)
  }
}
