'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  resolveProductGalleryUrls,
  type PublicProduct,
} from '@/lib/storefront-api'

export function ProductImageGallery({
  product,
}: {
  product: Pick<PublicProduct, 'name' | 'imageUrl' | 'imageUrls'>
}) {
  const urls = resolveProductGalleryUrls(product)
  const [active, setActive] = useState(0)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const labelId = useId()

  if (urls.length === 0) {
    return (
      <div className="sf-pdp-gallery">
        <div className="sf-pdp-gallery__main">
          <div className="sf-pdp-gallery-fallback">{product.name.charAt(0)}</div>
        </div>
      </div>
    )
  }

  const safeIndex = Math.min(active, urls.length - 1)
  const mainUrl = urls[safeIndex]!
  const showThumbs = urls.length > 1

  function selectThumb(index: number) {
    setActive(index)
  }

  function onThumbKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!showThumbs) return
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = (index + 1) % urls.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = (index - 1 + urls.length) % urls.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      next = urls.length - 1
    } else {
      return
    }
    setActive(next)
    thumbRefs.current[next]?.focus()
  }

  return (
    <div className="sf-pdp-gallery" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="sr-only">
        {product.name} images
      </span>
      <div className="sf-pdp-gallery__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mainUrl} alt={product.name} />
      </div>

      {showThumbs ? (
        <div
          className="sf-pdp-gallery__thumbs"
          role="tablist"
          aria-label={`${product.name} photo thumbnails`}
        >
          {urls.map((url, i) => {
            const selected = i === safeIndex
            return (
              <button
                key={`${url}-${i}`}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el
                }}
                role="tab"
                aria-selected={selected}
                aria-label={`View photo ${i + 1} of ${urls.length}`}
                tabIndex={selected ? 0 : -1}
                className={`sf-pdp-gallery__thumb${selected ? ' sf-pdp-gallery__thumb--active' : ''}`}
                onClick={() => selectThumb(i)}
                onKeyDown={(e) => onThumbKeyDown(e, i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
