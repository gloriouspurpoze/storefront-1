import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  formatDayOrderingHours,
  getOrderingHoursFromConfig,
  ORDERING_DAY_KEYS,
  ORDERING_DAY_LABELS,
} from '@/lib/orderingHours'
import { getShippingPolicyFromConfig } from '@/lib/shippingPolicy'

function summarizeStoreHours(config: StorefrontConfig | null): string {
  const hours = getOrderingHoursFromConfig(config)
  const openDays = ORDERING_DAY_KEYS.filter((d) => !hours[d].closed)
  if (openDays.length === 0) return 'Currently closed'

  const timeLabel = formatDayOrderingHours(hours[openDays[0]])
  const allSameHours = openDays.every(
    (d) =>
      formatDayOrderingHours(hours[d]) === timeLabel &&
      hours[d].openTime === hours[openDays[0]].openTime &&
      hours[d].closeTime === hours[openDays[0]].closeTime,
  )

  if (openDays.length === 7 && allSameHours) return `Daily · ${timeLabel}`
  if (openDays.length === 6 && hours.sunday.closed && !hours.monday.closed && allSameHours) {
    return `Mon – Sat · ${timeLabel}`
  }

  const first = ORDERING_DAY_LABELS[openDays[0]].slice(0, 3)
  const last = ORDERING_DAY_LABELS[openDays[openDays.length - 1]].slice(0, 3)
  return `${first} – ${last} · ${timeLabel}`
}

function formatDeliverySummary(config: StorefrontConfig | null): string {
  const policy = getShippingPolicyFromConfig(config)
  if (policy.summary) return policy.summary
  if (policy.zones?.length) {
    return policy.zones
      .map((z) => {
        const fee = z.fee?.trim()
        if (fee) return `${z.label} ${fee}`
        return z.details ? `${z.label} · ${z.details}` : z.label
      })
      .join(' · ')
  }
  return 'Mira Road free · Mumbai ₹70 · Outside 2–7 days'
}

export function BrownButterFooter({
  config,
  contactPhone,
}: {
  config: StorefrontConfig | null
  contactPhone?: string
}) {
  const pickup = config?.branding?.address || 'Near Tanwar Hospital, Mira Road'
  const whatsapp = config?.branding?.socials?.whatsapp || contactPhone
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : undefined

  return (
    <div className="store-footer">
      <div className="footer-row">
        <div className="footer-icon">🕐</div>
        <div className="footer-text">
          <div className="footer-label">Store hours</div>
          <div className="footer-value">{summarizeStoreHours(config)}</div>
        </div>
      </div>
      <div className="footer-row">
        <div className="footer-icon">📍</div>
        <div className="footer-text">
          <div className="footer-label">Pickup location</div>
          <div className="footer-value">{pickup}</div>
        </div>
      </div>
      <div className="footer-row">
        <div className="footer-icon">🚚</div>
        <div className="footer-text">
          <div className="footer-label">Delivery</div>
          <div className="footer-value">{formatDeliverySummary(config)}</div>
        </div>
      </div>
      {contactPhone ? (
        <div className="footer-row">
          <div className="footer-icon">💬</div>
          <div className="footer-text">
            <div className="footer-label">Questions?</div>
            <div className="footer-value">{contactPhone}</div>
          </div>
          {waHref ? (
            <a className="footer-wa-btn" href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
