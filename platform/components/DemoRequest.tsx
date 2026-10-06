'use client'

/**
 * "Free demo call" popup — ported from the admin's `components/marketing/DemoRequest.tsx`.
 *
 * - `DemoRequestProvider` owns one dialog per page; any CTA calls `useDemoRequest().open()`.
 * - Steps: pitch (why book) → form → confirmation.
 * - With `autoPopup`, the pitch opens once on its own (after 25s, 55% scroll, or desktop exit
 *   intent) and stays quiet for a week after being dismissed — and for good once a request is sent.
 * - Submissions go to `POST /api/public/demo-request` and land in CRM → Leads as Website leads.
 *   The API must allow this site's origin in CORS (see docs/torqerp/LAUNCH.md).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Headphones,
  Loader2,
  MonitorPlay,
  PhoneCall,
  Route,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react'
import { MARKETING_VERTICALS } from '@profixer/marketing-data'
import { env } from '@/lib/env'
import { PLATFORM_BRAND, signupUrl } from '../config'
import { ATTRIBUTION_PARAMS, captureAttribution, withAttribution } from '../attribution'

type Step = 'pitch' | 'form' | 'done'

interface DemoRequestContextValue {
  open: (step?: Exclude<Step, 'done'>) => void
  setDefaultIndustry: (label: string | undefined) => void
}

const DemoRequestContext = createContext<DemoRequestContextValue | null>(null)

function useDemoRequest(): DemoRequestContextValue {
  const ctx = useContext(DemoRequestContext)
  if (!ctx) throw new Error('useDemoRequest must be used inside <DemoRequestProvider>')
  return ctx
}

// ── Auto-popup bookkeeping ────────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'pf_demo_popup_dismissed_at'
const SUBMITTED_KEY = 'pf_demo_submitted'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000
const AUTO_DELAY_MS = 25_000
const AUTO_SCROLL_RATIO = 0.55

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage blocked — the popup may show again next visit, which is fine
  }
}

function autoPopupSuppressed(): boolean {
  if (readStorage(SUBMITTED_KEY)) return true
  const dismissedAt = Number(readStorage(DISMISSED_KEY) || 0)
  return dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_MS
}

// ── Form model ────────────────────────────────────────────────────────────────────────────────

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'] as const
const PREFERRED_TIMES = ['Morning (9am–12pm)', 'Afternoon (12–4pm)', 'Evening (4–7pm)', 'Anytime'] as const
const CONTACT_PREFERENCES = ['Phone call', 'WhatsApp', 'Video call (Google Meet)'] as const
const OTHER_INDUSTRY = 'Other'

interface FormState {
  name: string
  email: string
  phone: string
  company: string
  industry: string
  teamSize: string
  city: string
  preferredTime: string
  contactPreference: string
  message: string
  consent: boolean
  website: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function emptyForm(defaultIndustry?: string): FormState {
  return {
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: defaultIndustry ?? '',
    teamSize: '',
    city: '',
    preferredTime: 'Anytime',
    contactPreference: 'Phone call',
    message: '',
    consent: false,
    website: '',
  }
}

function validate(f: FormState): FieldErrors {
  const e: FieldErrors = {}
  if (f.name.trim().length < 2) e.name = 'Enter your full name'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid work email'
  const digits = f.phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15 || !/^\+?[0-9\s()-]+$/.test(f.phone.trim())) {
    e.phone = 'Enter a valid phone number'
  }
  if (!f.company.trim()) e.company = 'Enter your business name'
  if (!f.industry) e.industry = 'Choose your industry'
  if (!f.teamSize) e.teamSize = 'Choose your team size'
  if (!f.consent) e.consent = 'Please agree so we can contact you'
  return e
}

/** Same shape the admin sends: ad params + first touch + this page. */
function demoAttribution(): Record<string, string> {
  const first = captureAttribution()
  const out: Record<string, string> = {}
  for (const key of ATTRIBUTION_PARAMS) if (first[key]) out[key] = first[key]
  if (first.lp) out.landing_page = first.lp
  out.page_url = window.location.href.slice(0, 1000)
  const referrer = first.ref || document.referrer
  if (referrer) out.referrer = referrer.slice(0, 1000)
  return out
}

async function submitDemoRequest(body: Record<string, unknown>): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${env.API_BASE_URL.replace(/\/+$/, '')}/public/demo-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; error?: string }
    if (res.ok && json.success) return { ok: true }
    if (res.status === 429) return { ok: false, message: json.message || 'Too many requests. Please try again in a few minutes.' }
    return { ok: false, message: json.error || json.message || 'Could not submit your request. Please try again.' }
  } catch {
    return { ok: false, message: 'Network error — check your connection and try again.' }
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────────────────────

export function DemoRequestProvider({ children, autoPopup = true }: { children: ReactNode; autoPopup?: boolean }) {
  /** Industry label to preselect — set by <DemoIndustryHint> on industry pages. */
  const [defaultIndustry, setDefaultIndustry] = useState<string | undefined>()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>('pitch')
  const autoShown = useRef(false)

  const open = useCallback((next: Exclude<Step, 'done'> = 'form') => {
    autoShown.current = true
    setStep(next)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    if (step !== 'done') writeStorage(DISMISSED_KEY, String(Date.now()))
    setIsOpen(false)
  }, [step])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  useEffect(() => {
    if (!autoPopup || autoPopupSuppressed()) return
    const show = () => {
      if (autoShown.current) return
      autoShown.current = true
      setStep('pitch')
      setIsOpen(true)
    }
    const timer = window.setTimeout(show, AUTO_DELAY_MS)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= AUTO_SCROLL_RATIO) show()
    }
    // Exit intent: pointer leaves through the top edge (desktop only; touch devices never fire it).
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onMouseOut)
    }
  }, [autoPopup])

  const value = useMemo(() => ({ open, setDefaultIndustry }), [open])

  return (
    <DemoRequestContext.Provider value={value}>
      {children}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => open('pitch')}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-tq-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tq-primary focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
          aria-label="Book a free demo call"
        >
          <PhoneCall className="h-4 w-4" aria-hidden />
          <span>Free demo call</span>
        </button>
      ) : null}
      <dialog
        ref={dialogRef}
        aria-labelledby="demo-title"
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
        className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-tq-line bg-white p-0 text-tq-ink shadow-2xl backdrop:bg-black/50"
      >
        {isOpen ? (
          <div className="relative">
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-tq-muted hover:text-tq-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            {step === 'pitch' ? (
              <PitchStep onContinue={() => setStep('form')} onClose={close} />
            ) : (
              <DemoForm
                defaultIndustry={defaultIndustry}
                done={step === 'done'}
                onDone={() => {
                  writeStorage(SUBMITTED_KEY, String(Date.now()))
                  setStep('done')
                }}
                onClose={() => setIsOpen(false)}
              />
            )}
          </div>
        ) : null}
      </dialog>
    </DemoRequestContext.Provider>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────────────────────

const PITCH_POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: MonitorPlay, title: 'A walkthrough for your industry', body: 'Bookings, CRM, storefront and billing set up the way you work.' },
  { icon: Route, title: 'A migration plan', body: 'How to move off spreadsheets, WhatsApp and your current tools.' },
  { icon: Tag, title: 'The right plan and price', body: 'Which tier fits your team, plus any launch offer you qualify for.' },
  { icon: Headphones, title: 'Answers from a real specialist', body: 'Ask anything. No bots, no pressure, no obligation.' },
]

function PitchStep({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-tq-primary-deep via-tq-primary to-tq-primary-bright px-6 pb-8 pt-9 text-white sm:px-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          100% free · 30 minutes
        </p>
        <h2 id="demo-title" className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          Book your free demo call
        </h2>
        <p className="mt-2 max-w-md text-sm text-tq-primary-soft sm:text-base">
          See exactly how {PLATFORM_BRAND} would run your business — live, one-on-one, with a product specialist.
        </p>
      </div>
      <div className="px-6 py-6 sm:px-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {PITCH_POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tq-primary-soft text-tq-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-sm text-tq-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:items-center">
          <button type="button" onClick={onContinue} className={`${btnPrimary} sm:flex-1`}>
            <PhoneCall className="h-4 w-4" aria-hidden />
            Book my free demo call
          </button>
          <button type="button" onClick={onClose} className="h-12 rounded-full px-6 text-sm font-medium text-tq-muted hover:text-tq-ink">
            Maybe later
          </button>
        </div>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-tq-muted">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> No credit card
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> We call within 1 business day
          </span>
        </p>
      </div>
    </div>
  )
}

const btnPrimary =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-tq-primary px-7 text-sm font-semibold text-white hover:bg-tq-primary-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tq-primary focus-visible:ring-offset-2'
const inputClass =
  'h-11 w-full rounded-lg border border-tq-line bg-white px-3 text-sm text-tq-ink placeholder:text-tq-muted/70 focus:border-tq-primary focus:outline-none focus:ring-2 focus:ring-tq-primary/20 aria-[invalid=true]:border-red-500'
const labelClass = 'text-sm font-medium text-tq-ink'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-red-600" role="alert">
      {message}
    </p>
  )
}

function DemoForm({
  defaultIndustry,
  done,
  onDone,
  onClose,
}: {
  defaultIndustry?: string
  done: boolean
  onDone: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultIndustry))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const openedAt = useRef(Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  const industries = useMemo(() => {
    const labels = MARKETING_VERTICALS.map((v) => v.label)
    if (defaultIndustry && !labels.includes(defaultIndustry)) labels.unshift(defaultIndustry)
    return [...labels, OTHER_INDUSTRY]
  }, [defaultIndustry])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setSubmitError('')
    const firstInvalid = Object.keys(nextErrors)[0]
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus()
      return
    }
    setSubmitting(true)
    const result = await submitDemoRequest({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      industry: form.industry,
      teamSize: form.teamSize,
      city: form.city.trim(),
      preferredTime: form.preferredTime,
      contactPreference: form.contactPreference,
      message: form.message.trim(),
      consent: true,
      website: form.website,
      elapsedMs: Date.now() - openedAt.current,
      attribution: demoAttribution(),
    })
    setSubmitting(false)
    if (result.ok) onDone()
    else setSubmitError(result.message)
  }

  if (done) {
    const firstName = form.name.trim().split(/\s+/)[0]
    const verticalKey = MARKETING_VERTICALS.find((v) => v.label === form.industry)?.key
    return (
      <div className="px-6 py-10 text-center sm:px-10">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-tq-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 id="demo-title" className="mt-4 text-2xl font-semibold tracking-tight">
          You&apos;re booked in{firstName ? `, ${firstName}` : ''}!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-tq-muted">
          A product specialist will reach you on <span className="font-medium text-tq-ink">{form.phone.trim()}</span> by{' '}
          {form.contactPreference.toLowerCase()} within one business day
          {form.preferredTime && form.preferredTime !== 'Anytime' ? `, in the ${form.preferredTime.toLowerCase()}` : ''}.
        </p>
        <ol className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm">
          {[
            { icon: CalendarCheck, t: 'We confirm a time that suits you' },
            { icon: MonitorPlay, t: `Live demo tailored to ${form.industry === OTHER_INDUSTRY ? 'your business' : form.industry}` },
            { icon: Route, t: 'You leave with a setup and migration plan' },
          ].map(({ icon: Icon, t }, i) => (
            <li key={t} className="flex items-center gap-3 rounded-lg border border-tq-line px-3 py-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tq-primary-soft text-xs font-semibold text-tq-primary">
                {i + 1}
              </span>
              <Icon className="h-4 w-4 shrink-0 text-tq-muted" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <a href={withAttribution(signupUrl(verticalKey), captureAttribution())} className={`${btnPrimary} h-11 px-6`}>
            Start free trial meanwhile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-tq-line px-6 text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    )
  }

  const fieldProps = (key: keyof FormState) => ({
    id: `demo-${key}`,
    'data-field': key,
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `demo-${key}-error` : undefined,
  })

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="px-6 pb-6 pt-8 sm:px-8">
      <h2 id="demo-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
        Book your free demo call
      </h2>
      <p className="mt-1 text-sm text-tq-muted">30 minutes, one-on-one. Tell us a little about your business so we can tailor it.</p>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="demo-website">Website</label>
        <input
          id="demo-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set('website', e.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="demo-name" className={labelClass}>Full name *</label>
          <input {...fieldProps('name')} name="name" autoComplete="name" placeholder="Priya Sharma" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} className={inputClass} />
          <FieldError id="demo-name-error" message={errors.name} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-email" className={labelClass}>Work email *</label>
          <input {...fieldProps('email')} name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@yourbusiness.com" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={200} className={inputClass} />
          <FieldError id="demo-email-error" message={errors.email} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-phone" className={labelClass}>Phone / WhatsApp *</label>
          <input {...fieldProps('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} className={inputClass} />
          <FieldError id="demo-phone-error" message={errors.phone} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-company" className={labelClass}>Business name *</label>
          <input {...fieldProps('company')} name="organization" autoComplete="organization" placeholder="Sharma Home Services" value={form.company} onChange={(e) => set('company', e.target.value)} maxLength={160} className={inputClass} />
          <FieldError id="demo-company-error" message={errors.company} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-industry" className={labelClass}>Industry *</label>
          <select {...fieldProps('industry')} value={form.industry} onChange={(e) => set('industry', e.target.value)} className={inputClass}>
            <option value="" disabled>Select your industry</option>
            {industries.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
          <FieldError id="demo-industry-error" message={errors.industry} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-teamSize" className={labelClass}>Team size *</label>
          <select {...fieldProps('teamSize')} value={form.teamSize} onChange={(e) => set('teamSize', e.target.value)} className={inputClass}>
            <option value="" disabled>How many people?</option>
            {TEAM_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError id="demo-teamSize-error" message={errors.teamSize} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-city" className={labelClass}>City</label>
          <input id="demo-city" name="city" autoComplete="address-level2" placeholder="Bengaluru" value={form.city} onChange={(e) => set('city', e.target.value)} maxLength={80} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-preferredTime" className={labelClass}>Best time to call</label>
          <select id="demo-preferredTime" value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)} className={inputClass}>
            {PREFERRED_TIMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className={labelClass}>How should we reach you?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTACT_PREFERENCES.map((p) => {
            const active = form.contactPreference === p
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => set('contactPreference', p)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'border-tq-primary bg-tq-primary-soft text-tq-primary-deep' : 'border-tq-line text-tq-muted hover:text-tq-ink'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-4 space-y-1.5">
        <label htmlFor="demo-message" className={labelClass}>What would you like to see? (optional)</label>
        <textarea
          id="demo-message"
          name="message"
          rows={3}
          placeholder="e.g. Online bookings with technician dispatch, and moving our customer list from Excel."
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          maxLength={2000}
          className={`${inputClass} h-auto py-2`}
        />
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-start gap-2.5">
          <input
            {...fieldProps('consent')}
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-tq-primary"
          />
          <label htmlFor="demo-consent" className="text-xs leading-relaxed text-tq-muted">
            I agree to be contacted by {PLATFORM_BRAND} by phone, WhatsApp or email about this demo. We never share your details.
          </label>
        </div>
        <FieldError id="demo-consent-error" message={errors.consent} />
      </div>

      {submitError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <button type="submit" className={`${btnPrimary} mt-6 w-full`} disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Booking your call…
          </>
        ) : (
          <>
            <PhoneCall className="h-4 w-4" aria-hidden /> Book my free demo call
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-tq-muted">Free · No credit card · No obligation</p>
    </form>
  )
}

/** Preselects this page's industry in the demo form (renders nothing). */
export function DemoIndustryHint({ label }: { label: string }) {
  const { setDefaultIndustry } = useDemoRequest()
  useEffect(() => {
    setDefaultIndustry(label)
    return () => setDefaultIndustry(undefined)
  }, [label, setDefaultIndustry])
  return null
}

/** A page CTA that opens the demo form. */
export function DemoCallButton({ className, children }: { className?: string; children?: ReactNode }) {
  const { open } = useDemoRequest()
  return (
    <button type="button" className={className} onClick={() => open('form')}>
      {children ?? (
        <>
          <PhoneCall className="h-4 w-4" aria-hidden />
          Book a free demo call
        </>
      )}
    </button>
  )
}
