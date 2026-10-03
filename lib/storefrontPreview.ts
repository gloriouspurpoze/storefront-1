/**
 * Draft preview helpers (pure — safe to import from route handlers, RSC and tests).
 *
 * Flow: admin opens `/api/preview?v=<versionId>&t=<token>` → route sets the
 * httpOnly `sf_preview` cookie (`<versionId>.<token>`) → `fetchStorefrontConfig`
 * sees the cookie and fetches the version-overlaid config with `no-store`.
 */
export const PREVIEW_COOKIE = 'sf_preview'
export const PREVIEW_MAX_AGE_SECONDS = 60 * 60 * 24

const VERSION_ID_RE = /^[a-f0-9]{24}$/
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/

export interface PreviewParams {
  versionId: string
  token: string
}

export function isValidPreviewVersionId(v: unknown): v is string {
  return typeof v === 'string' && VERSION_ID_RE.test(v)
}

export function isValidPreviewToken(t: unknown): t is string {
  return typeof t === 'string' && TOKEN_RE.test(t)
}

export function buildPreviewCookieValue(versionId: string, token: string): string | null {
  if (!isValidPreviewVersionId(versionId) || !isValidPreviewToken(token)) return null
  return `${versionId}.${token}`
}

/** Parse `<versionId>.<token>`; returns null for anything malformed. */
export function parsePreviewCookie(value: string | null | undefined): PreviewParams | null {
  if (!value) return null
  const dot = value.indexOf('.')
  if (dot <= 0) return null
  const versionId = value.slice(0, dot)
  const token = value.slice(dot + 1)
  if (!isValidPreviewVersionId(versionId) || !isValidPreviewToken(token)) return null
  return { versionId, token }
}
