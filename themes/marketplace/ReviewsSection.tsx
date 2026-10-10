'use client'

import { useEffect, useState } from 'react'
import { fetchReviews, type MarketplaceReview, type MarketplaceReviewPage } from '@/lib/marketplace-api'
import { Button, Rating } from '@/ui'
import './marketplace.css'

/** Verified-purchase reviews with a rating summary (PDP: product, shop page: seller). */
export function ReviewsSection({
  tenantId,
  scope,
  slug,
  title = scope === 'product' ? 'Customer reviews' : 'Reviews of this shop',
}: {
  tenantId: string
  scope: 'product' | 'seller'
  slug: string
  title?: string
}) {
  const [data, setData] = useState<MarketplaceReviewPage | null>(null)
  const [extra, setExtra] = useState<MarketplaceReview[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchReviews({ tenantId, scope, slug, page })
      .then((res) => {
        if (cancelled) return
        if (page === 1) setData(res)
        else setExtra((prev) => [...prev, ...res.reviews])
      })
      .catch(() => !cancelled && page === 1 && setData(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [tenantId, scope, slug, page])

  if (!data) return null
  const { summary } = data
  const reviews = [...data.reviews, ...extra]

  return (
    <section id="reviews" className="sf-section mk-reviews" aria-labelledby="reviews-title">
      <div className="sf-section-head">
        <h2 id="reviews-title" className="sf-heading">
          {title}
        </h2>
      </div>
      {summary.count === 0 ? (
        <p className="mk-summary__note">
          No reviews yet. Reviews come from buyers after their order is delivered.
        </p>
      ) : (
        <div className="mk-reviews__layout">
          <div className="mk-reviews__summary">
            <p className="mk-reviews__average">{summary.average.toFixed(1)}</p>
            <Rating value={summary.average} count={summary.count} />
            <ul className="mk-reviews__bars">
              {summary.distribution.map((d) => (
                <li key={d.stars}>
                  <span>{d.stars}★</span>
                  <span className="mk-reviews__bar" aria-hidden>
                    <span style={{ width: `${summary.count ? (d.count / summary.count) * 100 : 0}%` }} />
                  </span>
                  <span>{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ul className="mk-reviews__list">
              {reviews.map((r) => (
                <li key={r.id} className="mk-review">
                  <div className="mk-review__head">
                    <Rating value={r.rating} />
                    {r.title ? <strong>{r.title}</strong> : null}
                  </div>
                  {r.comment ? <p className="mk-review__body">{r.comment}</p> : null}
                  <p className="mk-review__meta">
                    {r.author} · Verified purchase
                    {r.variantName ? ` · ${r.variantName}` : ''} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </li>
              ))}
            </ul>
            {page < data.pagination.totalPages ? (
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                {loading ? 'Loading…' : 'Show more reviews'}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
