/**
 * Google Maps URLs for POS / ops — no API calls; embed optionally uses Maps Embed API key.
 */

export type ServiceAddressParts = {
  line: string
  city: string
  state: string
  zip: string
  country: string
}

/** Single-line query for search / embed (Google Geocoder-quality input). */
export function buildMapsSearchQuery(a: ServiceAddressParts): string {
  const parts = [a.line, a.city, a.state, a.zip, a.country]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

/** Opens in browser / Google Maps app — no API key. */
export function googleMapsSearchUrl(query: string): string {
  const q = query.trim()
  if (!q) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/**
 * iframe src for embedded preview. Requires a browser-restricted Maps Embed API key.
 * @see https://developers.google.com/maps/documentation/embed/get-started
 */
export function googleMapsEmbedPlaceUrl(query: string, apiKey: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query.trim())}`
}
