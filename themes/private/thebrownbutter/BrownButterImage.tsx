'use client'

import { useEffect, useState } from 'react'
import { BB_IMG_FALLBACK } from './catalog'

export function BrownButterImage({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  const [url, setUrl] = useState(src || BB_IMG_FALLBACK)
  useEffect(() => {
    setUrl(src || BB_IMG_FALLBACK)
  }, [src])
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className ?? 'card-img'}
      src={url}
      alt={alt}
      width={800}
      height={800}
      decoding="async"
      onError={() => setUrl(BB_IMG_FALLBACK)}
    />
  )
}
