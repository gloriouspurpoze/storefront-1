import type { SocialPlatform } from '../types/marketingWorkspace.types'

/** Approximate public post limits for planning / QA (platforms change over time). */
const CAPTION_LIMIT: Record<SocialPlatform, number> = {
  x: 280,
  instagram: 2200,
  facebook: 8000,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  reddit: 40000,
  whatsapp: 4096,
  other: 8000,
}

export function getSocialCaptionLimit(platform: SocialPlatform): number {
  return CAPTION_LIMIT[platform] ?? 4000
}

export type CaptionLengthHealth = 'ok' | 'warn' | 'over'

export function captionLengthHealth(length: number, limit: number): CaptionLengthHealth {
  if (length > limit) return 'over'
  if (length > Math.floor(limit * 0.92)) return 'warn'
  return 'ok'
}
