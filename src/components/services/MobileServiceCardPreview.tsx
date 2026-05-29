import React from 'react'
import { Flame, Heart, ShoppingCart, Star } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SERVICE_CARD_IMAGE_SPEC } from '../../constants/serviceImageSpec'

export interface MobileServiceCardPreviewProps {
  imageUrl?: string
  name?: string
  description?: string
  price?: number | string
  /** MRP / list price — shown struck through when greater than `price`. */
  originalPrice?: number | string | null
  discountPercentage?: number | null
  /**
   * Real average rating from the service. Pass `undefined` (or `0`) to hide
   * the rating chip — never fabricate a value here so admins see the same
   * empty state the customer would.
   */
  rating?: number | null
  popular?: boolean
  emergency?: boolean
  priceType?: 'fixed' | 'hourly' | 'starting'
  className?: string
  /** Show phone frame chrome */
  framed?: boolean
}

function formatPrice(price: number | string | undefined): string {
  if (price == null || price === '') return '₹—'
  const n = typeof price === 'number' ? price : parseFloat(String(price))
  if (Number.isNaN(n)) return '₹—'
  return `₹${n.toLocaleString('en-IN')}`
}

export const MobileServiceCardPreview: React.FC<MobileServiceCardPreviewProps> = ({
  imageUrl,
  name = 'Service name',
  description,
  price,
  originalPrice,
  discountPercentage,
  rating,
  popular = false,
  emergency = false,
  priceType,
  className,
  framed = true,
}) => {
  const ratingNum = typeof rating === 'number' && rating > 0 ? rating : null
  const displayRating = ratingNum != null ? ratingNum.toFixed(1) : null
  const tagline =
    description?.trim() ||
    'Short description appears here on the customer app card.'

  const offerNum =
    typeof price === 'number' ? price : parseFloat(String(price ?? ''))
  const mrpNum =
    originalPrice != null && originalPrice !== ''
      ? typeof originalPrice === 'number'
        ? originalPrice
        : parseFloat(String(originalPrice))
      : NaN
  const showMrp = Number.isFinite(mrpNum) && mrpNum > 0 && mrpNum > offerNum
  const pct =
    discountPercentage != null && discountPercentage > 0
      ? Math.round(discountPercentage)
      : showMrp
        ? Math.round(((mrpNum - offerNum) / mrpNum) * 100)
        : 0

  const card = (
    <div
      className="w-full max-w-[260px] overflow-hidden rounded-2xl border border-[#00142F]/10 bg-white shadow-md"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div
        className="relative w-full overflow-hidden bg-[#EEF1F6]"
        style={{ aspectRatio: String(SERVICE_CARD_IMAGE_SPEC.aspectRatio) }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <span className="text-[#8B95A5]">No image yet</span>
            <span className="text-[10px]">{SERVICE_CARD_IMAGE_SPEC.aspectLabel} crop</span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#00142F]/15 via-transparent to-[#00142F]/5"
          aria-hidden
        />
        {pct > 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#FE9D16] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {pct}% OFF
          </span>
        ) : null}
        {emergency ? (
          <span
            className={`absolute left-2 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 shadow-sm ${
              pct > 0 ? 'top-8' : 'top-2'
            }`}
          >
            Insta Help
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#00142F]/10 bg-white shadow-sm"
          tabIndex={-1}
          aria-hidden
        >
          <Heart className="h-4 w-4 text-[#00142F]" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          {popular ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#00142F] px-2 py-0.5 text-[10px] font-bold text-white">
              <Flame className="h-3 w-3" aria-hidden />
              Popular
            </span>
          ) : (
            <span />
          )}
          {displayRating ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-[#F4F6F9] px-2 py-0.5 text-[10px] font-semibold text-[#00142F]">
              <Star className="h-3 w-3 fill-[#FE9D16] text-[#FE9D16]" aria-hidden />
              {displayRating}
            </span>
          ) : (
            <span className="text-[10px] text-[#8B95A5]">No ratings yet</span>
          )}
        </div>

        <p className="line-clamp-2 text-sm font-bold leading-tight text-[#00142F]">{name}</p>
        <p className="line-clamp-1 text-[11px] text-[#4B5563]">{tagline}</p>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline gap-1.5">
              {priceType === 'starting' && (
                <span className="text-[10px] text-[#8B95A5]">from</span>
              )}
              <span className="text-base font-bold text-[#00142F]">{formatPrice(price)}</span>
              {showMrp ? (
                <span className="text-xs text-[#8B95A5] line-through">{formatPrice(mrpNum)}</span>
              ) : null}
            </div>
            {showMrp && pct > 0 ? (
              <span className="text-[10px] font-medium text-emerald-700">
                You save {formatPrice(Math.round(mrpNum - offerNum))}
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#00142F] px-3 py-1.5 text-xs font-medium text-white">
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
            Add
          </span>
        </div>
      </div>
    </div>
  )

  if (!framed) {
    return <div className={className}>{card}</div>
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        Customer app preview
      </p>
      <div className="rounded-[28px] border-[6px] border-[#00142F] bg-[#00142F] p-2 shadow-lg">
        <div className="overflow-hidden rounded-[20px] bg-[#F4F6F9] px-2 pb-3 pt-2">
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-[#00142F]/20" aria-hidden />
          {card}
        </div>
      </div>
      <p className="mt-2 max-w-[280px] text-center text-[11px] text-muted-foreground">
        Matches Home carousel cards — image uses cover crop ({SERVICE_CARD_IMAGE_SPEC.aspectLabel}).
      </p>
    </div>
  )
}
