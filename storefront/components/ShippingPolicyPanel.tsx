'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  DEFAULT_SHIPPING_POLICY_SUMMARY,
  getShippingPolicyFromConfig,
  hasShippingPolicyContent,
} from '@/lib/shippingPolicy'

export function ShippingPolicyPanel({
  config,
  onClose,
  showFullPageLink = true,
  className,
}: {
  config?: StorefrontConfig | null
  onClose?: () => void
  showFullPageLink?: boolean
  className?: string
}) {
  const policy = getShippingPolicyFromConfig(config)
  const hasCustom = hasShippingPolicyContent(policy)
  const summary = policy.summary || DEFAULT_SHIPPING_POLICY_SUMMARY

  return (
    <div className={className}>
      <div className="sf-ordering-hours-table__title">Shipping policy</div>
      {policy.processingNote ? (
        <p className="sf-menu-drawer__policy-copy">{policy.processingNote}</p>
      ) : null}
      <p className="sf-menu-drawer__policy-copy">{summary}</p>
      {policy.body ? (
        <div className="sf-menu-drawer__policy-copy" style={{ whiteSpace: 'pre-wrap' }}>
          {policy.body}
        </div>
      ) : null}
      {policy.zones && policy.zones.length > 0 ? (
        <div className="sf-menu-drawer__detail-rows">
          {policy.zones.map((zone, i) => (
            <div key={`${zone.label}-${i}`} className="sf-menu-drawer__detail-row">
              <div className="sf-menu-drawer__detail-label">{zone.label}</div>
              <div className="sf-menu-drawer__detail-value">{zone.details}</div>
              {zone.fee ? <div className="sf-menu-drawer__detail-value">{zone.fee}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
      {showFullPageLink && (
        <p className="sf-menu-drawer__policy-copy">
          <Link
            href="/shipping-policy"
            onClick={onClose}
            className="sf-menu-drawer__policy-link"
          >
            Read full shipping policy →
          </Link>
        </p>
      )}
      {!hasCustom && !policy.zones?.length ? null : null}
    </div>
  )
}
