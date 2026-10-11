'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import { formatMoney } from '@/lib/format'
import { runMarketplaceCheckout } from '@/lib/marketplace-api'
import { resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import {
  deliveryDetailsToShippingAddress,
  hasShippableDeliveryDetails,
  validateShippingAddress,
} from '@/lib/storefrontShippingAddress'
import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import { ButtonLink, Field, IconBag, Input } from '@/ui'
import { cartLineKey } from '@/lib/productVariants'
import { cartLineProductName, groupLinesBySeller, useCart } from './cart'
import type { ThemeTenant } from './types'
import { useMarketplaceQuote } from './useMarketplaceQuote'
import './marketplace.css'

/**
 * Split checkout: one Razorpay payment, then the API creates a sub-order per seller.
 * The delivery address travels with the payment so every seller ships to the right place.
 */
export function MarketplaceCheckoutClient({ tenant }: { tenant: ThemeTenant }) {
  const router = useRouter()
  const { lines, clear } = useCart()
  const { quote, error: quoteError } = useMarketplaceQuote(tenant.id, lines)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [delivery, setDelivery] = useState<DeliveryDetailsValue>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prefill = useCheckoutCustomerPrefill()
  const groups = groupLinesBySeller(lines)

  useEffect(() => {
    if (!prefill.isReady) return
    if (prefill.email && !email) setEmail(prefill.email)
    if (prefill.name && !name) setName(prefill.name)
    if (prefill.phone && !phone) setPhone(prefill.phone)
    setDelivery((prev) =>
      hasShippableDeliveryDetails(prev) || !hasShippableDeliveryDetails(prefill.deliveryDetails)
        ? prev
        : { ...prev, ...prefill.deliveryDetails },
    )
  }, [prefill.isReady, prefill.email, prefill.name, prefill.phone, prefill.deliveryDetails, email, name, phone])

  const onPay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy || !lines.length) return
    setError(null)

    const contact = resolveCheckoutContactForSubmit({ formEmail: email, formName: name, formPhone: phone, authUser: prefill.user })
    if (!contact.ok) return setError(contact.message)
    if (!contact.phone) return setError('Please add a phone number so sellers can reach you about delivery.')
    const addressCheck = validateShippingAddress(delivery)
    if (!addressCheck.ok) return setError(addressCheck.message)
    if (quoteError) return setError(quoteError)

    setBusy(true)
    try {
      const result = await runMarketplaceCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ listingId: l.productId, quantity: l.quantity, ...(l.variantId ? { variantId: l.variantId } : {}) })),
        customer: { email: contact.email, name: contact.name, phone: contact.phone },
        shippingAddress: deliveryDetailsToShippingAddress(delivery, contact),
      })
      clear()
      router.push(`/checkout/success?n=${encodeURIComponent(result.checkoutNumber)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.'
      // Closing the Razorpay sheet is not an error worth shouting about.
      setError(/cancel|dismiss/i.test(message) ? 'Payment was cancelled — your cart is saved.' : message)
      setBusy(false)
    }
  }

  if (!lines.length) {
    return (
      <RequireStorefrontAuth allowGuest returnPath="/checkout">
        <div className="mk-success">
          <IconBag size={32} />
          <h2>Nothing to check out</h2>
          <p>Your cart is empty.</p>
          <div className="mk-success__actions">
            <ButtonLink href="/products">Browse products</ButtonLink>
          </div>
        </div>
      </RequireStorefrontAuth>
    )
  }

  return (
    <RequireStorefrontAuth allowGuest returnPath="/checkout">
      <div className="mk-cart">
        <form className="mk-form" onSubmit={(e) => void onPay(e)} noValidate>
          <p>
            <Link href="/cart">← Back to cart</Link>
          </p>
          <section className="mk-form__section">
            <h2>Contact</h2>
            <div className="mk-form__row">
              <Field label="Full name" htmlFor="mk-name">
                <Input id="mk-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Phone" htmlFor="mk-phone" hint="Sellers use this for delivery updates.">
                <Input
                  id="mk-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
            {!prefill.lockedEmail ? (
              <Field label="Email" htmlFor="mk-email">
                <Input
                  id="mk-email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            ) : (
              <p className="mk-summary__note">Order updates go to {prefill.email}.</p>
            )}
          </section>

          <section className="mk-form__section">
            <h2>Delivery address</h2>
            <DeliveryDetailsSection
              showPreferredDate={false}
              showPreferredTime={false}
              value={delivery}
              onChange={setDelivery}
              variant="plain"
            />
          </section>

          {error ? (
            <p className="mk-alert" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="sf-btn sf-btn--block sf-btn--lg" disabled={busy || !quote} aria-busy={busy}>
            {busy ? 'Processing…' : quote ? `Pay ${formatMoney(quote.totalInr, 'INR')}` : 'Calculating total…'}
          </button>
          <p className="mk-summary__note">Secure payment via Razorpay. Prices and shipping are verified on our server.</p>
        </form>

        <aside className="mk-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          {groups.map((g) => {
            const qg = quote?.sellerGroups.find((x) => x.sellerSlug === g.sellerSlug)
            return (
              <div key={g.sellerSlug}>
                <p className="mk-sold-by__label">From {g.sellerName}</p>
                {g.lines.map((l) => (
                  <div key={cartLineKey(l.productId, l.variantId)} className="mk-summary__row">
                    <span>
                      {cartLineProductName(l)}
                      {l.variantName ? ` (${l.variantName})` : ''} × {l.quantity}
                    </span>
                    <span>{formatMoney(l.price * l.quantity, l.currency)}</span>
                  </div>
                ))}
                <div className="mk-summary__row mk-summary__note">
                  <span>Shipping</span>
                  <span>{qg ? formatMoney(qg.shippingInr, 'INR') : '…'}</span>
                </div>
              </div>
            )
          })}
          <div className="mk-summary__row mk-summary__row--total">
            <span>Total</span>
            <span>{quote ? formatMoney(quote.totalInr, 'INR') : '…'}</span>
          </div>
          {quoteError ? <p className="mk-alert">{quoteError}</p> : null}
        </aside>
      </div>
    </RequireStorefrontAuth>
  )
}
