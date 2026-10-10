'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { fetchCustomerCheckouts, type CustomerCheckout, type MarketplacePagination } from '@/lib/marketplace-api'
import { Button, ButtonLink } from '@/ui'
import { CheckoutOrderCard } from './CheckoutOrderCard'
import './marketplace.css'

/** Account → Orders for marketplace tenants: one card per checkout, split by seller parcel. */
export function MarketplaceOrdersClient({ tenantId }: { tenantId: string }) {
  const { tokens, isReady } = useAccountAuth()
  const [checkouts, setCheckouts] = useState<CustomerCheckout[]>([])
  const [pagination, setPagination] = useState<MarketplacePagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) return
    if (!tokens?.accessToken) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchCustomerCheckouts({ tenantId, accessToken: tokens.accessToken, page })
      .then((res) => {
        if (cancelled) return
        setCheckouts((prev) => (page === 1 ? res.checkouts : [...prev, ...res.checkouts]))
        setPagination(res.pagination)
        setError(null)
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load orders.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [isReady, tokens?.accessToken, tenantId, page])

  if (loading && checkouts.length === 0) return <p className="mk-summary__note">Loading your orders…</p>
  if (error) return <p className="mk-alert">{error}</p>
  if (!checkouts.length) {
    return (
      <div className="mk-success">
        <h2>No orders yet</h2>
        <p>When you buy from sellers on the marketplace, your orders show up here.</p>
        <div className="mk-success__actions">
          <ButtonLink href="/products">Start shopping</ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div>
      {checkouts.map((c) => (
        <CheckoutOrderCard key={c.checkoutNumber} checkout={c} tenantId={tenantId} />
      ))}
      {pagination && page < pagination.totalPages ? (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={loading}>
            {loading ? 'Loading…' : 'Load older orders'}
          </Button>
        </div>
      ) : null}
      <p className="mk-summary__note" style={{ marginTop: '1rem' }}>
        Questions about a parcel? Visit the seller&apos;s shop or <Link href="/contact">contact us</Link>.
      </p>
    </div>
  )
}
