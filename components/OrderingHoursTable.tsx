import {
  formatDayOrderingHours,
  getOrderingHoursFromConfig,
  ORDERING_DAY_KEYS,
  ORDERING_DAY_LABELS,
  type OrderingHoursConfig,
} from '@/lib/orderingHours'
import type { StorefrontConfig } from '@/lib/storefront-api'

export function OrderingHoursTable({
  hours: hoursProp,
  config,
  className = '',
}: {
  hours?: OrderingHoursConfig
  config?: StorefrontConfig | null
  className?: string
}) {
  const hours = hoursProp ?? getOrderingHoursFromConfig(config)

  return (
    <div className={`sf-ordering-hours-table ${className}`.trim()}>
      <div className="sf-ordering-hours-table__title">Ordering hours</div>
      <dl className="sf-ordering-hours-table__rows">
        {ORDERING_DAY_KEYS.map((day) => (
          <div key={day} className="sf-ordering-hours-table__row">
            <dt>{ORDERING_DAY_LABELS[day]}</dt>
            <dd>{formatDayOrderingHours(hours[day])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
