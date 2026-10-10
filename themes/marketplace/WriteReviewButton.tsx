'use client'

import { useState, type FormEvent } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { submitReview } from '@/lib/marketplace-api'
import { Button, Field, Input, Modal, Textarea } from '@/ui'
import './marketplace.css'

/** Per-item "Write a review" for delivered sub-orders (one review per item per order). */
export function WriteReviewButton({
  tenantId,
  subOrderNumber,
  listingId,
  itemTitle,
  variantName,
  initiallyReviewed,
}: {
  tenantId: string
  subOrderNumber: string
  listingId: string
  itemTitle: string
  variantName?: string
  initiallyReviewed?: boolean
}) {
  const { tokens } = useAccountAuth()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(Boolean(initiallyReviewed))
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) return <span className="mk-status" data-tone="good">Reviewed</span>

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tokens?.accessToken) return setError('Please sign in again to leave a review.')
    if (rating < 1) return setError('Choose a star rating.')
    setBusy(true)
    setError(null)
    try {
      await submitReview({
        tenantId,
        accessToken: tokens.accessToken,
        subOrderNumber,
        listingId,
        variantName,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      })
      setDone(true)
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your review.'
      if (/already reviewed/i.test(message)) setDone(true)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="sf-btn sf-btn--link mk-review-btn" onClick={() => setOpen(true)}>
        Write a review
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label={`Review ${itemTitle}`} size="sm">
        <form className="mk-form mk-review-form" onSubmit={(e) => void onSubmit(e)}>
          <h2 className="mk-review-form__title">Review {itemTitle}</h2>
          <fieldset className="mk-stars">
            <legend className="sf-label">Your rating</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="mk-stars__star" data-on={n <= rating || undefined}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="sf-visually-hidden"
                />
                <span aria-hidden>★</span>
                <span className="sf-visually-hidden">
                  {n} star{n === 1 ? '' : 's'}
                </span>
              </label>
            ))}
          </fieldset>
          <Field label="Headline (optional)" htmlFor={`rv-title-${listingId}`}>
            <Input id={`rv-title-${listingId}`} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Your review (optional)" htmlFor={`rv-body-${listingId}`}>
            <Textarea
              id={`rv-body-${listingId}`}
              rows={4}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Field>
          {error ? (
            <p className="mk-alert" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" block disabled={busy}>
            {busy ? 'Saving…' : 'Submit review'}
          </Button>
        </form>
      </Modal>
    </>
  )
}
