/** Relative luminance + WCAG-ish contrast helpers for tenant brand colors. */

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const raw = color.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(raw)
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }
  const full = /^#([0-9a-f]{6})$/i.exec(raw)
  if (full) {
    const n = parseInt(full[1], 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  return null
}

function channelLuminance(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance for a hex color; null if unparseable. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color)
  if (!rgb) return null
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b)
}

/**
 * Pick white or near-black label text so CTA copy stays ≥ ~4.5:1 on `bg`.
 * Unparseable colors fall back to white (typical on dark brand primaries).
 */
export function contrastTextOn(bg: string, dark = '#111111', light = '#ffffff'): string {
  const L = relativeLuminance(bg)
  if (L == null) return light
  // Threshold ~0.179 ≈ mid luminance where white vs black swap for 4.5:1 on many hues
  return L > 0.179 ? dark : light
}

/** True when two hex colors are too close in luminance (monochrome CTA risk). */
export function colorsTooSimilar(a: string, b: string, delta = 0.12): boolean {
  const La = relativeLuminance(a)
  const Lb = relativeLuminance(b)
  if (La == null || Lb == null) return false
  return Math.abs(La - Lb) < delta
}
