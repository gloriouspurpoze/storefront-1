'use client'

import Link from 'next/link'
import { useState } from 'react'
import { postGiftMatch, type GiftMatchResult } from '@/lib/storefront-api'

const RECIPIENTS = ['Mom', 'Dad', 'Partner', 'Friend', 'Colleague', 'Child', 'Grandparent']
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Housewarming', 'Thank you', 'Festival', 'Just because']

type Props = {
  tenantId: string
  className?: string
}

export function GiftMatchWidget({ tenantId, className }: Props) {
  const [recipient, setRecipient] = useState('')
  const [customRecipient, setCustomRecipient] = useState('')
  const [occasion, setOccasion] = useState('')
  const [customOccasion, setCustomOccasion] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GiftMatchResult | null>(null)

  const resolvedRecipient = recipient === 'Other' ? customRecipient.trim() : recipient
  const resolvedOccasion = occasion === 'Other' ? customOccasion.trim() : occasion

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!resolvedRecipient || !resolvedOccasion) {
      setError('Please tell us who the gift is for and the occasion.')
      return
    }

    setLoading(true)
    try {
      const data = await postGiftMatch({
        tenantId,
        recipient: resolvedRecipient,
        occasion: resolvedOccasion,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <form onSubmit={(e) => void submit(e)} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Find the perfect gift</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Who&apos;s it for, what&apos;s the occasion, and what&apos;s your budget? We&apos;ll suggest a few picks.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Who&apos;s it for?</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              <option value="">Select…</option>
              {RECIPIENTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Occasion</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            >
              <option value="">Select…</option>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        {recipient === 'Other' ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Recipient (custom)</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={customRecipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              placeholder="e.g. Sister, Teacher"
            />
          </label>
        ) : null}

        {occasion === 'Other' ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Occasion (custom)</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              placeholder="e.g. Graduation"
            />
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Budget min (₹)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Budget max (₹)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Finding gifts…' : 'Get gift ideas'}
        </button>
      </form>

      {result ? (
        <div className="mt-8 space-y-6">
          <p className="text-base leading-relaxed text-foreground">{result.explanation}</p>
          {result.recommendations.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.recommendations.map((item) => (
                <article
                  key={item.productId}
                  className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-semibold leading-snug">{item.name}</h3>
                    <p className="text-sm font-medium">₹{item.priceInr.toLocaleString('en-IN')}</p>
                    <p className="flex-1 text-sm text-muted-foreground">{item.reason}</p>
                    <Link
                      href={`/products/${encodeURIComponent(item.slug)}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View product →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No products matched your budget.{' '}
              <Link href="/products" className="font-medium text-primary hover:underline">
                Browse the full catalog
              </Link>
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
