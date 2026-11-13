/**
 * Footer link grouping shared by every storefront footer (pure — safe for server,
 * client components and tests).
 */
export type FooterLink = { href: string; label: string }
export type FooterColumn = { title: string; links: FooterLink[] }

const LEGAL_LINK_RE = /\b(terms|privacy|refunds?|cancell?ation|grievance|disclaimer|cookies?|legal|polic(y|ies))\b/i

/** Terms / privacy / refund / grievance pages — grouped under "Policies" in every footer. */
export function isLegalFooterLink(link: FooterLink): boolean {
  return LEGAL_LINK_RE.test(link.label) || LEGAL_LINK_RE.test(link.href.replace(/[-_/]+/g, ' '))
}

/** Longest single link column before it is split in two. */
const MAX_LINKS_PER_COLUMN = 6

/**
 * Turn a flat CMS footer menu into titled columns: legal pages go to a "Policies"
 * column, the rest fill `titles[0]` (and `titles[1]` once it would exceed
 * `MAX_LINKS_PER_COLUMN` links). Keeps CMS order within each column.
 */
export function splitFooterLinks(links: FooterLink[], titles: string[], legalTitle = 'Policies'): FooterColumn[] {
  if (!links.length) return []
  const legal = links.filter(isLegalFooterLink)
  const rest = links.filter((l) => !isLegalFooterLink(l))
  const cols: FooterColumn[] = []
  if (rest.length) {
    const n = Math.min(Math.max(titles.length, 1), Math.ceil(rest.length / MAX_LINKS_PER_COLUMN))
    const per = Math.ceil(rest.length / n)
    for (let i = 0; i < n; i++) cols.push({ title: titles[i] ?? titles[0] ?? 'Explore', links: rest.slice(i * per, (i + 1) * per) })
  }
  if (legal.length) cols.push({ title: legalTitle, links: legal })
  return cols
}

function normaliseHref(href: string): string {
  return href.trim().toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'
}

/** Drop a link already shown in an earlier column (CMS menus often repeat Contact etc.), then empty columns. */
export function dedupeFooterColumns(columns: FooterColumn[]): FooterColumn[] {
  const seen = new Set<string>()
  return columns
    .map((c) => ({
      ...c,
      links: c.links.filter((l) => {
        const key = normaliseHref(l.href)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }),
    }))
    .filter((c) => c.links.length > 0)
}
