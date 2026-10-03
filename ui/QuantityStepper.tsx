'use client'

import { cx } from './cx'
import { IconMinus, IconPlus } from './icons'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size,
  label = 'Quantity',
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'sm'
  label?: string
  className?: string
}) {
  return (
    <div className={cx('sf-qty', size === 'sm' && 'sf-qty--sm', className)} role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <IconMinus size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <IconPlus size={16} />
      </button>
    </div>
  )
}
