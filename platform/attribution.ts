/**
 * First-touch marketing attribution, carried from torqerp.com to the signup page
 * on app.torqerp.com as query params (different origins can't share storage).
 *
 * The admin signup reads the same keys — see `src/lib/signupAttribution.ts`.
 */

export const ATTRIBUTION_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const

/** Query keys added on top of the ad params: first landing page and the external referrer. */
export const LANDING_PAGE_PARAM = 'lp'
export const REFERRER_PARAM = 'ref'

const STORAGE_KEY = 'tq_first_touch'
const MAX_VALUE = 500

export type Attribution = Record<string, string>

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : null
  } catch {
    return null
  }
}

function store(value: Attribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // storage blocked (private mode) — the current page's params still apply
  }
}

/**
 * Record the first touch once per browser. A later visit that arrives with ad
 * params (a new campaign) replaces it, so paid clicks are never lost.
 */
export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search)
  const fromUrl: Attribution = {}
  for (const key of ATTRIBUTION_PARAMS) {
    const v = params.get(key)?.trim()
    if (v) fromUrl[key] = v.slice(0, MAX_VALUE)
  }
  const stored = readStored()
  if (stored && !Object.keys(fromUrl).length) return stored

  const next: Attribution = { ...fromUrl, [LANDING_PAGE_PARAM]: window.location.pathname.slice(0, MAX_VALUE) }
  const referrer = document.referrer
  if (referrer) {
    try {
      if (new URL(referrer).host !== window.location.host) next[REFERRER_PARAM] = referrer.slice(0, MAX_VALUE)
    } catch {
      // malformed referrer — skip it
    }
  }
  store(next)
  return next
}

/** `href` with the visitor's attribution appended (existing query params win). */
export function withAttribution(href: string, attribution: Attribution): string {
  try {
    const url = new URL(href)
    for (const [k, v] of Object.entries(attribution)) {
      if (v && !url.searchParams.has(k)) url.searchParams.set(k, v)
    }
    return url.toString()
  } catch {
    return href
  }
}
