import { formatMoney } from '@/lib/format'
import { cx } from './cx'

/** Price with optional compare-at (struck) price and "% off" label. */
export function Price({
  amount,
  compareAt,
  currency,
  size,
  showOff = true,
  className,
}: {
  amount: number
  compareAt?: number | null
  currency: string
  size?: 'lg'
  showOff?: boolean
  className?: string
}) {
  const onSale = typeof compareAt === 'number' && compareAt > amount
  const off = onSale ? Math.round(((compareAt! - amount) / compareAt!) * 100) : 0
  return (
    <span className={cx('sf-price', onSale && 'sf-price--sale', size === 'lg' && 'sf-price--lg', className)}>
      <span className="sf-price__now">{formatMoney(amount, currency)}</span>
      {onSale && (
        <>
          <s className="sf-price__was">
            <span className="sf-visually-hidden">Was </span>
            {formatMoney(compareAt!, currency)}
          </s>
          {showOff && off > 0 && <span className="sf-price__off">{off}% off</span>}
        </>
      )}
    </span>
  )
}

export function discountPercent(amount: number, compareAt?: number | null): number {
  if (typeof compareAt !== 'number' || compareAt <= amount) return 0
  return Math.round(((compareAt - amount) / compareAt) * 100)
}
