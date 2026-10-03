/**
 * Browser client for storefront live chat (paid add-on `showLiveChat`).
 *
 * Backend: fixer-backend `src/modules/storefront-live-chat` under `/api/public`.
 * The visitor token travels in the body (POST) / query (GET) rather than a custom
 * header so no extra CORS `allowedHeaders` are needed.
 */
import { env } from './env'
import { withTenantId } from './tenant-headers'

export type LiveChatSender = 'visitor' | 'admin'

export interface LiveChatMessage {
  id: string
  sender: LiveChatSender
  body: string
  adminName?: string
  createdAt: string
}

export interface LiveChatSession {
  conversationId: string
  visitorToken: string
  visitorName: string
}

export class LiveChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'LiveChatError'
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
  error?: { code?: string } | string
}

function url(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}/public/storefront/live-chat${path}`
}

async function call<T>(tenantId: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    cache: 'no-store',
    headers: withTenantId(tenantId, {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    }),
  })
  const json = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || !json?.success || json.data === undefined) {
    const code = json?.code ?? (typeof json?.error === 'object' ? json.error?.code : undefined)
    throw new LiveChatError(json?.message || `Chat request failed (${res.status})`, res.status, code)
  }
  return json.data
}

export function startLiveChat(
  tenantId: string,
  input: { name: string; phone?: string; email?: string; message?: string; pageUrl?: string },
): Promise<{ conversationId: string; visitorToken: string; messages: LiveChatMessage[] }> {
  return call(tenantId, '/conversations', { method: 'POST', body: JSON.stringify(input) })
}

export function fetchLiveChatMessages(
  tenantId: string,
  session: Pick<LiveChatSession, 'conversationId' | 'visitorToken'>,
  after?: string,
): Promise<{ status: 'open' | 'closed'; messages: LiveChatMessage[] }> {
  const qs = new URLSearchParams({ token: session.visitorToken })
  if (after) qs.set('after', after)
  return call(tenantId, `/conversations/${encodeURIComponent(session.conversationId)}/messages?${qs}`)
}

export function sendLiveChatMessage(
  tenantId: string,
  session: Pick<LiveChatSession, 'conversationId' | 'visitorToken'>,
  body: string,
): Promise<LiveChatMessage> {
  return call(tenantId, `/conversations/${encodeURIComponent(session.conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, token: session.visitorToken }),
  })
}

/** Merge polled messages into the current list, deduped by id, oldest → newest. */
export function mergeLiveChatMessages(current: LiveChatMessage[], incoming: LiveChatMessage[]): LiveChatMessage[] {
  if (!incoming.length) return current
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt),
  )
}

const STORAGE_PREFIX = 'sf-live-chat:'

export function loadLiveChatSession(tenantId: string): LiveChatSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + tenantId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LiveChatSession>
    if (typeof parsed.conversationId !== 'string' || typeof parsed.visitorToken !== 'string') return null
    return {
      conversationId: parsed.conversationId,
      visitorToken: parsed.visitorToken,
      visitorName: typeof parsed.visitorName === 'string' ? parsed.visitorName : '',
    }
  } catch {
    return null
  }
}

export function saveLiveChatSession(tenantId: string, session: LiveChatSession | null): void {
  try {
    if (session) window.localStorage.setItem(STORAGE_PREFIX + tenantId, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_PREFIX + tenantId)
  } catch {
    /* storage blocked (private mode) — chat still works for this page view */
  }
}
