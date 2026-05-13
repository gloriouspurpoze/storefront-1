import type { CategoryMarketingConfig } from '../types/categoryMarketing'

export interface CategoryMarketingFieldDiff {
  path: string
  industry: string
  locality: string
}

const SNIP = 160

function formatSnippet(value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t.length) return '—'
    return t.length > SNIP ? `${t.slice(0, SNIP)}…` : t
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    const s = JSON.stringify(value)
    return s.length > SNIP ? `${s.slice(0, SNIP)}…` : s
  } catch {
    return String(value)
  }
}

/** Loose equality for CMS JSON (treat null/undefined/"" as empty for primitives). */
function deepEqualCmsValues(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  const empty = (v: unknown) => v === null || v === undefined || v === ''
  if (empty(a) && empty(b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqualCmsValues(v, b[i]))
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
    for (const k of Array.from(keys)) {
      if (!deepEqualCmsValues((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false
    }
    return true
  }
  return false
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isArrayOfPlainObjects(arr: unknown[]): boolean {
  return arr.length > 0 && arr.every((item) => isPlainObject(item))
}

/**
 * List leaf paths where `locality` differs from `industry` (industry-wide template).
 * Both inputs should already be merged with {@link mergeCategoryConfig}.
 */
export function diffCategoryMarketingConfigs(
  industry: CategoryMarketingConfig,
  locality: CategoryMarketingConfig,
): CategoryMarketingFieldDiff[] {
  const out: CategoryMarketingFieldDiff[] = []

  const walk = (path: string, a: unknown, b: unknown) => {
    if (deepEqualCmsValues(a, b)) return

    if (isPlainObject(a) && isPlainObject(b)) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)])
      for (const key of Array.from(keys).sort()) {
        const next = path ? `${path}.${key}` : key
        walk(next, a[key], b[key])
      }
      return
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (
        a.length === b.length &&
        isArrayOfPlainObjects(a) &&
        isArrayOfPlainObjects(b as unknown[])
      ) {
        for (let i = 0; i < a.length; i++) {
          walk(`${path}[${i}]`, a[i], (b as unknown[])[i])
        }
        return
      }
    }

    out.push({
      path: path || '(root)',
      industry: formatSnippet(a),
      locality: formatSnippet(b),
    })
  }

  walk('', industry, locality)
  return out
}
