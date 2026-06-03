import type { OrderCarrier } from '../services/api/orders.service'

export const ORDER_CARRIER_OPTIONS: Array<{ value: OrderCarrier; label: string }> = [
  { value: 'manual', label: 'Manual / other link' },
  { value: 'delhivery', label: 'Delhivery' },
  { value: 'bluedart', label: 'Blue Dart' },
  { value: 'dtdc', label: 'DTDC' },
  { value: 'indiapost', label: 'India Post' },
  { value: 'shiprocket', label: 'Shiprocket' },
  { value: 'other', label: 'Other' },
]

/** Build a public tracking URL from carrier + AWB when no custom URL is stored. */
export function resolveTrackingUrl(params: {
  carrier?: OrderCarrier | null
  trackingNumber?: string | null
  trackingUrl?: string | null
}): string | null {
  const custom = params.trackingUrl?.trim()
  if (custom) {
    try {
      const u = new URL(custom)
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
    } catch {
      /* fall through */
    }
  }

  const awb = params.trackingNumber?.trim()
  if (!awb) return null

  const encoded = encodeURIComponent(awb)
  switch (params.carrier) {
    case 'delhivery':
      return `https://www.delhivery.com/track/package/${encoded}`
    case 'bluedart':
      return `https://www.bluedart.com/web/guest/trackdartresult?trackNo=${encoded}`
    case 'dtdc':
      return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encoded}`
    case 'indiapost':
      return `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx`
    case 'shiprocket':
      return `https://shiprocket.co/tracking/${encoded}`
    default:
      return null
  }
}

export function carrierLabel(carrier?: OrderCarrier | null): string {
  if (!carrier) return '—'
  return ORDER_CARRIER_OPTIONS.find((o) => o.value === carrier)?.label ?? carrier
}
