import type { TeamWorkTagCatalogEntry } from '../types/teamWork.types'

/** Match backend `teamWorkTagSlug` (Mongo labels store slugs). */
export function teamWorkTagSlug(raw: string): string {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return s || 'tag'
}

export function teamWorkTagDisplayName(slug: string, catalog: TeamWorkTagCatalogEntry[]): string {
  const hit = catalog.find((t) => t.slug === slug)
  return hit?.name || slug
}
