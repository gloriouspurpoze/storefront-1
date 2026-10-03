/**
 * Tenant font overrides (`branding.fontHeading` / `branding.fontBody`), loaded from
 * Google Fonts. Theme CSS hardcodes families in many selectors, so the override CSS is
 * `!important` and scoped to the tenant root; icon fonts and code blocks are left alone.
 */

/** Google Fonts family names only: letters, digits, spaces (e.g. "Playfair Display"). */
export function sanitizeFontFamily(raw: string | undefined | null): string | null {
  const v = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!v || v.length > 40 || !/^[A-Za-z0-9 ]+$/.test(v)) return null
  return v
}

export function googleFontsHref(families: string[]): string | null {
  const unique = Array.from(new Set(families))
  if (!unique.length) return null
  const qs = unique.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')
  return `https://fonts.googleapis.com/css2?${qs}&display=swap`
}

const ICON_SAFE = ':not([class*="icon"]):not([class*="Icon"]):not(code):not(pre):not(kbd):not(samp)'

export function siteFontsCss(opts: { scope: string; heading: string | null; body: string | null }): string {
  const rules: string[] = []
  if (opts.body) {
    rules.push(`${opts.scope}, ${opts.scope} *${ICON_SAFE} { font-family: '${opts.body}', ui-sans-serif, system-ui, sans-serif !important; }`)
  }
  if (opts.heading) {
    rules.push(
      `${opts.scope} :is(h1, h2, h3, h4, h5, h6)${ICON_SAFE}, ${opts.scope} :is(h1, h2, h3, h4, h5, h6) *${ICON_SAFE} { font-family: '${opts.heading}', ui-serif, Georgia, serif !important; }`,
    )
  }
  return rules.join('\n')
}

/** Everything the layout needs, or null when the tenant keeps theme fonts. */
export function resolveSiteFonts(
  branding: { fontHeading?: string; fontBody?: string } | undefined,
  scope: string,
): { href: string; css: string } | null {
  const heading = sanitizeFontFamily(branding?.fontHeading)
  const body = sanitizeFontFamily(branding?.fontBody)
  const href = googleFontsHref([heading, body].filter((f): f is string => Boolean(f)))
  if (!href) return null
  return { href, css: siteFontsCss({ scope, heading, body }) }
}
