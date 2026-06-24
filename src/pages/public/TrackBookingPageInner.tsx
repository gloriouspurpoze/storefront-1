import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, Loader2, MapPin, Phone, Search, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  trackPublicBooking,
  type PublicBookingTrackResult,
} from '../../services/api/publicBooking.service'
import { formatMoney } from '../../lib/financeFormat'
import { cn } from '../../lib/utils'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'cancelled') return 'destructive'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

function formatSchedule(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  })
}

export function TrackBookingPageInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ref, setRef] = useState(() => searchParams.get('ref') || '')
  const [phone, setPhone] = useState(() => searchParams.get('phone') || '')
  const [token, setToken] = useState(() => searchParams.get('token') || '')
  const tenantFromUrl = searchParams.get('tenant') || undefined

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicBookingTrackResult | null>(null)

  const canAutoFetch = useMemo(() => {
    const r = (searchParams.get('ref') || '').trim()
    const p = (searchParams.get('phone') || '').trim()
    const t = (searchParams.get('token') || '').trim()
    return Boolean(r && (p || t))
  }, [searchParams])

  const runTrack = useCallback(
    async (overrides?: { ref?: string; phone?: string; token?: string }) => {
      const r = (overrides?.ref ?? ref).trim()
      const p = (overrides?.phone ?? phone).trim()
      const t = (overrides?.token ?? token).trim()
      setError(null)
      setResult(null)
      setLoading(true)
      try {
        const res = await trackPublicBooking({
          ref: r,
          phone: p || undefined,
          token: t || undefined,
          tenantId: tenantFromUrl,
        })
        if (!res.success || !res.data) {
          setError(res.message || 'Booking not found')
          return
        }
        setResult(res.data)
        const next = new URLSearchParams()
        next.set('ref', r)
        if (p) next.set('phone', p)
        if (t) next.set('token', t)
        if (tenantFromUrl) next.set('tenant', tenantFromUrl)
        setSearchParams(next, { replace: true })
      } finally {
        setLoading(false)
      }
    },
    [ref, phone, token, tenantFromUrl, setSearchParams],
  )

  useEffect(() => {
    if (!canAutoFetch) return
    void runTrack({
      ref: searchParams.get('ref') || '',
      phone: searchParams.get('phone') || '',
      token: searchParams.get('token') || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-fetch once when URL has ref + identity
  }, [canAutoFetch])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void runTrack()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-sm font-medium text-primary">ProFixer</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Track your booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the reference from your receipt and the mobile number used at the desk. No account
            required.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
              Look up status
            </CardTitle>
            <CardDescription>
              Reference is the 8-character code on your confirmation (e.g.{' '}
              <span className="font-mono">#A1B2C3D4</span>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="track-ref">Booking reference</Label>
                <Input
                  id="track-ref"
                  value={ref}
                  onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="A1B2C3D4"
                  autoComplete="off"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-phone">Mobile number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="track-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="pl-9"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Looking up…
                  </>
                ) : (
                  'Track booking'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {result ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{result.serviceName}</CardTitle>
                  <CardDescription className="font-mono">#{result.bookingRef}</CardDescription>
                </div>
                <Badge variant={statusVariant(result.status)}>
                  {STATUS_LABELS[result.status] || result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-medium">{formatSchedule(result.scheduledDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium tabular-nums">{formatMoney(result.totalAmount)}</p>
                </div>
              </div>
              {result.professionalName ? (
                <div className="flex gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Professional</p>
                    <p className="font-medium">{result.professionalName}</p>
                  </div>
                </div>
              ) : null}
              {result.address?.city ? (
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Service area</p>
                    <p className="font-medium">
                      {[result.address.city, result.address.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          Staff desk?{' '}
          <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  )
}
