/**
 * Chat/team-work uploads often return paths like `/uploads/chat/...` which must be
 * opened against the API host (port 5000), not the CRA dev server (3000).
 */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

export function resolveBackendMediaUrl(url: string): string {
  const u = (url || '').trim()
  if (!u) return u
  if (/^https?:\/\//i.test(u)) return u
  const origin = API_BASE.replace(/\/api\/?$/i, '') || API_BASE.replace(/\/+$/, '')
  if (u.startsWith('/')) return `${origin}${u}`
  return `${origin}/${u}`
}
