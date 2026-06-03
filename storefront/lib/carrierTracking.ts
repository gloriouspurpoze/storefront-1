export type OrderCarrier =
  | 'manual'
  | 'delhivery'
  | 'bluedart'
  | 'dtdc'
  | 'indiapost'
  | 'shiprocket'
  | 'other'

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
      /* ignore */
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
    case 'shiprocket':
      return `https://shiprocket.co/tracking/${encoded}`
    default:
      return null
  }
}

export function carrierLabel(carrier?: OrderCarrier | null): string {
  if (!carrier) return 'Courier'
  const map: Record<OrderCarrier, string> = {
    manual: 'Courier',
    delhivery: 'Delhivery',
    bluedart: 'Blue Dart',
    dtdc: 'DTDC',
    indiapost: 'India Post',
    shiprocket: 'Shiprocket',
    other: 'Other',
  }
  return map[carrier] ?? carrier
}
