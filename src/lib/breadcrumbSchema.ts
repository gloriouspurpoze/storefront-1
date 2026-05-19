import type { BreadcrumbItemBlock } from '@/types/categoryMarketing'

/** Rows safe to emit in BreadcrumbList JSON-LD (name + absolute URL required). */
export function filterValidBreadcrumbItems(items: readonly BreadcrumbItemBlock[]): BreadcrumbItemBlock[] {
  return items
    .map((b) => ({ name: b.name.trim(), url: b.url.trim() }))
    .filter((b) => b.name.length > 0 && b.url.length > 0)
}
