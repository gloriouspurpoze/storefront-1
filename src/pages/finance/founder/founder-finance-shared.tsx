import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function monthInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function rangeFromMonthInput(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, (m || 1) - 1, 1)
  const end = endOfMonth(start)
  return { from: toIsoDate(start), to: toIsoDate(end) }
}

export function lastNMonthsRange(n: number): { from: string; to: string } {
  const end = new Date()
  const start = startOfMonth(new Date(end.getFullYear(), end.getMonth() - (n - 1), 1))
  return { from: toIsoDate(start), to: toIsoDate(end) }
}

export function FounderLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export function FounderError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
        <div className="flex-1 space-y-2">
          <p className="text-destructive">{message}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function FounderMonthPicker({
  month,
  onMonthChange,
  label = 'Month',
}: {
  month: string
  onMonthChange: (v: string) => void
  label?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="founder-month">{label}</Label>
      <Input
        id="founder-month"
        type="month"
        value={month}
        onChange={(e) => onMonthChange(e.target.value)}
        className="max-w-[200px]"
      />
    </div>
  )
}

export function isApiNotReadyError(e: unknown): boolean {
  if (!(e instanceof Error)) return false
  const m = e.message.toLowerCase()
  return m.includes('404') || m.includes('not found') || m.includes('network')
}

export function apiNotReadyMessage(): string {
  return 'Founder finance API is not available yet. Wire the /finance/founder/* endpoints on the backend, then refresh.'
}
