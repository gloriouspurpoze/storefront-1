'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { buildStorefrontLoginUrl } from '@/lib/storefrontLoginUrls'
import { fetchWishlistProducts, type WishlistProduct } from '@/lib/storefrontWishlist'
import { WishlistHeartButton } from './WishlistHeartButton'
import { useWishlist } from './useWishlist'
import './wishlist.css'

/** Saved products for guests (localStorage) and signed-in customers (server list). */
export function WishlistPageClient({ enabled, loginReturnTo = '/wishlist' }: { enabled: boolean; loginReturnTo?: string }) {
  const wishlist = useWishlist(enabled)
  const [products, setProducts] = useState<WishlistProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const idsKey = wishlist.ids.join(',')

  // Cache fetched cards so un-hearting on this page doesn't refetch / flash.
  const [cache, setCache] = useState<Record<string, WishlistProduct>>({})

  useEffect(() => {
    if (!wishlist.ready || !wishlist.tenantId) return
    const ids = idsKey ? idsKey.split(',') : []
    const missing = ids.filter((id) => !cache[id])
    if (!missing.length) {
      setProducts(ids.map((id) => cache[id]).filter(Boolean))
      return
    }
    let cancelled = false
    fetchWishlistProducts(wishlist.tenantId, missing)
      .then((rows) => {
        if (cancelled) return
        const nextCache = { ...cache }
        for (const p of rows) nextCache[p.id.toLowerCase()] = p
        setCache(nextCache)
        setProducts(ids.map((id) => nextCache[id]).filter(Boolean))
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your wishlist')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist.ready, wishlist.tenantId, idsKey])

  const loginHref = useMemo(() => buildStorefrontLoginUrl(loginReturnTo), [loginReturnTo])

  if (!wishlist.enabled) {
    return <p className="sf-wishlist-empty">The wishlist isn&apos;t available for this store.</p>
  }

  if (!wishlist.ready || products === null) {
    return error ? (
      <p className="sf-wishlist-empty">{error}</p>
    ) : (
      <p className="sf-wishlist-empty" aria-busy="true">
        Loading your wishlist…
      </p>
    )
  }

  return (
    <div>
      {wishlist.mode === 'guest' ? (
        <p className="sf-wishlist-note">
          Saved on this device. <Link href={loginHref}>Sign in</Link> to keep your wishlist across devices.
        </p>
      ) : null}

      {products.length === 0 ? (
        <div className="sf-wishlist-empty">
          <p>Your wishlist is empty. Tap the heart on any product to save it here.</p>
          <Link href="/products">Browse products</Link>
        </div>
      ) : (
        <ul className="sf-wishlist-page__grid">
          {products.map((p) => (
            <li key={p.id} className="sf-wishlist-anchor">
              <article className="sf-wishlist-card">
                <Link href={`/products/${p.slug}`} className="sf-wishlist-card__media">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} />
                  ) : (
                    <span className="sf-wishlist-card__fallback">{p.name.charAt(0)}</span>
                  )}
                </Link>
                <div className="sf-wishlist-card__body">
                  <Link href={`/products/${p.slug}`} className="sf-wishlist-card__name">
                    {p.name}
                  </Link>
                  <p className="sf-wishlist-card__price">
                    {p.hasVariants ? 'From ' : ''}
                    {formatMoney(p.price, p.currency)}
                    {!p.hasVariants && p.originalPrice && p.originalPrice > p.price ? (
                      <s>{formatMoney(p.originalPrice, p.currency)}</s>
                    ) : null}
                  </p>
                  {!p.inStock ? <span className="sf-wishlist-card__oos">Out of stock</span> : null}
                  <Link href={`/products/${p.slug}`} className="sf-wishlist-card__cta">
                    {p.inStock ? (p.hasVariants ? 'Choose options' : 'View & add to cart') : 'View product'}
                  </Link>
                </div>
              </article>
              <WishlistHeartButton productId={p.id} productName={p.name} enabled={enabled} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
