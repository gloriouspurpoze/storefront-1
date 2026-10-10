'use client'

import { useEffect, useState } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { fetchCustomerCheckout, type CustomerCheckout } from '@/lib/marketplace-api'
import { ButtonLink, IconCheck } from '@/ui'
import { CheckoutOrderCard } from './CheckoutOrderCard'
import './marketplace.css'

/** Post-payment page: confirms the order and shows how it split into per-seller parcels. */
export function CheckoutSuccessClient({ tenantId, checkoutNumber }: { tenantId: string; checkoutNumber: string }) {
  const { tokens, isReady } = useAccountAuth()
  const [checkout, setCheckout] = useState<CustomerCheckout | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isReady || !checkoutNumber) return
    if (!tokens?.accessToken) {
      setFailed(true)
      return
    }
    let cancelled = false
    fetchCustomerCheckout({ tenantId, accessToken: tokens.accessToken, checkoutNumber })
      .then((c) => !cancelled && setCheckout(c))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [isReady, tokens?.accessToken, tenantId, checkoutNumber])

  return (
    <div className="sf-container" style={{ paddingBottom: 'var(--sf-section-y)' }}>
      <div className="mk-success">
        <span className="mk-status" data-tone="good">
          <IconCheck size={16} /> Payment received
        </span>
        <h1>Thank you for your order</h1>
        <p>
          {checkoutNumber ? (
            <>
              Order <strong>{checkoutNumber}</strong> is confirmed.{' '}
            </>
          ) : null}
          Each seller packs and ships their items separately — you&apos;ll get updates as every parcel moves.
        </p>
        <div className="mk-success__actions">
          <ButtonLink href="/account/orders">View my orders</ButtonLink>
          <ButtonLink href="/products" variant="secondary">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
      {checkout ? <CheckoutOrderCard checkout={checkout} /> : null}
      {failed && !checkout ? (
        <p className="mk-summary__note" style={{ textAlign: 'center' }}>
          Your order details will appear under My orders in a moment.
        </p>
      ) : null}
    </div>
  )
}
