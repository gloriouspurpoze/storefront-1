import Link from 'next/link'
import type { CustomerCheckout } from '@/lib/marketplace-api'
import { carrierLabel, resolveTrackingUrl, type OrderCarrier } from '@/lib/carrierTracking'
import { formatMoney } from '@/lib/format'
import { SellerAvatar } from './SellerCard'
import { subOrderStatusView } from './orderStatus'
import { WriteReviewButton } from './WriteReviewButton'
import './marketplace.css'

/** One marketplace order: the parent checkout and a card per seller parcel. */
export function CheckoutOrderCard({
  checkout,
  detailHref,
  tenantId,
}: {
  checkout: CustomerCheckout
  detailHref?: string
  /** Pass to enable "Write a review" on delivered items. */
  tenantId?: string
}) {
  const placed = new Date(checkout.createdAt)
  return (
    <article className="mk-order">
      <header className="mk-order__head">
        <span>
          Order <span className="mk-order__number">{checkout.checkoutNumber}</span>
        </span>
        <span>{Number.isNaN(placed.getTime()) ? '' : placed.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
        <span>
          <strong>{formatMoney(checkout.totalInr, 'INR')}</strong> · {checkout.subOrders.length}{' '}
          {checkout.subOrders.length === 1 ? 'seller' : 'sellers'}
        </span>
        {detailHref ? <Link href={detailHref}>View details</Link> : null}
      </header>
      {checkout.subOrders.map((so) => {
        const status = subOrderStatusView(so.status)
        const carrier = so.carrier as OrderCarrier | undefined
        const trackUrl = resolveTrackingUrl({ carrier, trackingNumber: so.trackingNumber })
        return (
          <section key={so.subOrderNumber} className="mk-suborder" aria-label={`Parcel from ${so.seller.name}`}>
            <div className="mk-suborder__head">
              {so.seller.slug ? (
                <Link href={`/store/${so.seller.slug}`} className="mk-suborder__seller">
                  <SellerAvatar seller={{ displayName: so.seller.name, logoUrl: so.seller.logoUrl }} size={28} />
                  {so.seller.name}
                </Link>
              ) : (
                <span className="mk-suborder__seller">{so.seller.name}</span>
              )}
              <span className="mk-status" data-tone={status.tone}>
                {status.label}
              </span>
            </div>
            <ul className="mk-suborder__items">
              {so.items.map((it, i) => (
                <li key={i}>
                  <span>
                    {it.title} × {it.quantity}
                    {tenantId && so.canReview && it.listingId ? (
                      <>
                        {' '}
                        <WriteReviewButton
                          tenantId={tenantId}
                          subOrderNumber={so.subOrderNumber}
                          listingId={it.listingId}
                          itemTitle={it.title}
                          variantName={it.variantName}
                          initiallyReviewed={it.reviewed}
                        />
                      </>
                    ) : null}
                  </span>
                  <span>{formatMoney(it.lineTotalInr, 'INR')}</span>
                </li>
              ))}
              <li>
                <span>Shipping</span>
                <span>{formatMoney(so.shippingInr, 'INR')}</span>
              </li>
            </ul>
            {so.trackingNumber ? (
              <p className="mk-suborder__track">
                {carrierLabel(carrier)} · tracking{' '}
                {trackUrl ? (
                  <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                    {so.trackingNumber}
                  </a>
                ) : (
                  <strong>{so.trackingNumber}</strong>
                )}
              </p>
            ) : null}
          </section>
        )
      })}
      {checkout.shippingAddress?.address ? (
        <footer className="mk-suborder mk-summary__note">
          Delivering to {checkout.shippingAddress.name ? `${checkout.shippingAddress.name}, ` : ''}
          {checkout.shippingAddress.address}, {checkout.shippingAddress.city} {checkout.shippingAddress.zipCode}
        </footer>
      ) : null}
    </article>
  )
}
