'use client'

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  LiveChatError,
  fetchLiveChatMessages,
  loadLiveChatSession,
  mergeLiveChatMessages,
  saveLiveChatSession,
  sendLiveChatMessage,
  startLiveChat,
  type LiveChatMessage,
  type LiveChatSession,
} from '@/lib/storefrontLiveChatClient'

const POLL_OPEN_MS = 4000
const POLL_CLOSED_MS = 20000

function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function splitContact(raw: string): { phone?: string; email?: string } {
  const v = raw.trim()
  if (!v) return {}
  return v.includes('@') ? { email: v } : { phone: v }
}

/**
 * Paid add-on `showLiveChat` — visitor chat bubble. Visitor starts with name +
 * phone/email, then messages; conversation id + token persist in localStorage.
 * Replies arrive by polling (no websocket).
 */
export function LiveChatWidget({
  tenantId,
  siteName,
  onOpenChange,
}: {
  tenantId: string
  siteName: string
  onOpenChange?: (open: boolean) => void
}) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [session, setSession] = useState<LiveChatSession | null>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [draft, setDraft] = useState('')

  const openRef = useRef(open)
  openRef.current = open
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const scrollRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setSession(loadLiveChatSession(tenantId))
  }, [tenantId])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const resetSession = useCallback(() => {
    saveLiveChatSession(tenantId, null)
    setSession(null)
    setMessages([])
    setUnread(0)
  }, [tenantId])

  const handleError = useCallback(
    (e: unknown, fallback: string) => {
      if (e instanceof LiveChatError) {
        if (e.status === 403) {
          setDisabled(true)
          return
        }
        if (e.status === 404) {
          resetSession()
          setError('Your previous chat has ended. Start a new one below.')
          return
        }
        setError(e.message)
        return
      }
      setError(fallback)
    },
    [resetSession],
  )

  const poll = useCallback(
    async (full = false) => {
      if (!session) return
      const current = messagesRef.current
      const after = full || !current.length ? undefined : current[current.length - 1].createdAt
      try {
        const res = await fetchLiveChatMessages(tenantId, session, after)
        const known = new Set(current.map((m) => m.id))
        const fresh = res.messages.filter((m) => !known.has(m.id))
        if (fresh.length) {
          setMessages((prev) => mergeLiveChatMessages(prev, fresh))
          const newReplies = fresh.filter((m) => m.sender === 'admin').length
          if (!openRef.current && newReplies && !full) setUnread((n) => n + newReplies)
        }
      } catch (e) {
        // Polling is best-effort; only terminal errors change state.
        if (e instanceof LiveChatError && (e.status === 403 || e.status === 404)) handleError(e, '')
      }
    },
    [session, tenantId, handleError],
  )

  // Initial history load when a stored session is restored.
  useEffect(() => {
    if (session) void poll(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.conversationId])

  useEffect(() => {
    if (!session || disabled) return
    const id = window.setInterval(
      () => {
        if (document.visibilityState === 'visible') void poll()
      },
      open ? POLL_OPEN_MS : POLL_CLOSED_MS,
    )
    return () => window.clearInterval(id)
  }, [session, open, disabled, poll])

  useEffect(() => {
    if (!open) return
    setUnread(0)
    const t = window.setTimeout(() => {
      if (session) composerRef.current?.focus()
      else firstFieldRef.current?.focus()
    }, 30)
    return () => window.clearTimeout(t)
  }, [open, session])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  const close = useCallback(() => {
    setOpen(false)
    bubbleRef.current?.focus()
  }, [])

  const onStart = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    const c = splitContact(contact)
    if (!trimmedName) return setError('Please enter your name.')
    if (!c.phone && !c.email) return setError('Please enter a phone number or email.')
    setBusy(true)
    try {
      const res = await startLiveChat(tenantId, {
        name: trimmedName,
        ...c,
        message: firstMessage.trim() || undefined,
        pageUrl: window.location.pathname.slice(0, 500),
      })
      const next: LiveChatSession = {
        conversationId: res.conversationId,
        visitorToken: res.visitorToken,
        visitorName: trimmedName,
      }
      saveLiveChatSession(tenantId, next)
      setMessages(res.messages)
      setSession(next)
      setFirstMessage('')
    } catch (err) {
      handleError(err, 'Could not start the chat. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const onSend = async (e?: FormEvent) => {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || !session || busy) return
    setError(null)
    setBusy(true)
    try {
      const msg = await sendLiveChatMessage(tenantId, session, body)
      setMessages((prev) => mergeLiveChatMessages(prev, [msg]))
      setDraft('')
    } catch (err) {
      handleError(err, 'Message not sent. Please try again.')
    } finally {
      setBusy(false)
      composerRef.current?.focus()
    }
  }

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void onSend()
    }
  }

  if (disabled) return null

  const title = siteName ? `Chat with ${siteName}` : 'Chat with us'

  return (
    <>
      {open ? (
        <div
          id={panelId}
          className="sfw-panel"
          role="dialog"
          aria-label={title}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <div className="sfw-panel__head">
            <div>
              <p className="sfw-panel__title">{title}</p>
              <p className="sfw-panel__subtitle">We typically reply within a few minutes.</p>
            </div>
            <button type="button" className="sfw-icon-btn" onClick={close} aria-label="Close chat">
              <CloseGlyph />
            </button>
          </div>

          {session ? (
            <>
              <div className="sfw-panel__body" ref={scrollRef}>
                {messages.length ? (
                  <ul className="sfw-msgs" aria-live="polite" aria-relevant="additions">
                    {messages.map((m) => (
                      <li key={m.id} className={`sfw-msg sfw-msg--${m.sender}`}>
                        <span className="sfw-sr-only">{m.sender === 'visitor' ? 'You' : m.adminName || siteName}: </span>
                        {m.body}
                        <span className="sfw-msg__meta">
                          {m.sender === 'admin' && m.adminName ? `${m.adminName} · ` : ''}
                          {formatTime(m.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sfw-empty">
                    Hi{session.visitorName ? ` ${session.visitorName}` : ''}! Send us a message and we’ll reply here.
                  </p>
                )}
              </div>
              {error ? <p className="sfw-error" style={{ padding: '6px 14px 0' }} role="alert">{error}</p> : null}
              <form className="sfw-composer" onSubmit={onSend}>
                <label className="sfw-sr-only" htmlFor={`${panelId}-draft`}>
                  Message
                </label>
                <textarea
                  id={`${panelId}-draft`}
                  ref={composerRef}
                  className="sfw-textarea"
                  rows={1}
                  maxLength={2000}
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onComposerKey}
                />
                <button type="submit" className="sfw-primary" disabled={busy || !draft.trim()}>
                  Send
                </button>
              </form>
              <div style={{ padding: '0 14px 10px', background: '#fff', textAlign: 'right' }}>
                <button type="button" className="sfw-link-btn" onClick={resetSession}>
                  Start a new chat
                </button>
              </div>
            </>
          ) : (
            <form className="sfw-form" onSubmit={onStart} noValidate>
              <p>Leave your details and we’ll reply right here.</p>
              <label className="sfw-label">
                Name
                <input
                  ref={firstFieldRef}
                  className="sfw-input"
                  autoComplete="name"
                  maxLength={80}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="sfw-label">
                Phone or email
                <input
                  className="sfw-input"
                  autoComplete="tel"
                  inputMode="text"
                  maxLength={160}
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </label>
              <label className="sfw-label">
                How can we help? <span style={{ fontWeight: 400, color: '#64748b' }}>(optional)</span>
                <textarea
                  className="sfw-textarea"
                  rows={3}
                  maxLength={2000}
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                />
              </label>
              {error ? <p className="sfw-error" role="alert">{error}</p> : null}
              <button type="submit" className="sfw-primary" disabled={busy}>
                {busy ? 'Starting…' : 'Start chat'}
              </button>
            </form>
          )}
        </div>
      ) : null}

      <button
        ref={bubbleRef}
        type="button"
        className="sfw-fab"
        aria-label={open ? 'Close chat' : unread ? `${title} — ${unread} new ${unread === 1 ? 'reply' : 'replies'}` : title}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        data-storefront-live-chat-bubble=""
      >
        {open ? <CloseGlyph /> : <ChatGlyph />}
        {!open && unread > 0 ? (
          <span className="sfw-badge" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
    </>
  )
}
