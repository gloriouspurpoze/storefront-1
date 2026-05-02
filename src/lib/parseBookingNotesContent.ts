/**
 * Parses booking notes that mix prose, bracket headings, and HTTPS image URLs
 * (Cloudinary, booking_evidence, etc.) for admin / ops UIs.
 */

export type ParsedNotesBlock =
  | { type: 'heading'; title: string }
  | { type: 'text'; content: string }
  | { type: 'images'; urls: string[] }

const BRACKET_HEADING = /^\[[^\]]+\]$/

export function isLikelyImageUrl(line: string): boolean {
  const s = line.trim()
  if (!/^https?:\/\//i.test(s)) return false
  if (/\.(png|jpe?g|gif|webp|bmp|heic)(\?|#|$)/i.test(s)) return true
  if (/cloudinary\.com/i.test(s) && /\/image\//i.test(s)) return true
  if (/booking_evidence/i.test(s)) return true
  if (/\/upload\//i.test(s) && /cloudinary/i.test(s)) return true
  return false
}

function expandCompoundLines(lines: string[]): string[] {
  const out: string[] = []
  const compound = /^(\[[^\]]+\])\s+(https?:\/\/\S+)\s*$/i
  for (const line of lines) {
    const m = line.trim().match(compound)
    if (m) {
      out.push(m[1], m[2])
    } else {
      out.push(line)
    }
  }
  return out
}

export function parseBookingNotesContent(raw: string | undefined | null): ParsedNotesBlock[] {
  if (raw == null || !String(raw).trim()) return []

  const blocks: ParsedNotesBlock[] = []
  const lines = expandCompoundLines(String(raw).split(/\r?\n/))
  let textLines: string[] = []
  const pendingImages: string[] = []

  const flushText = () => {
    const content = textLines.join('\n').trim()
    if (content) blocks.push({ type: 'text', content })
    textLines = []
  }

  const flushImages = () => {
    if (pendingImages.length > 0) {
      blocks.push({ type: 'images', urls: [...pendingImages] })
      pendingImages.length = 0
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushText()
      flushImages()
      continue
    }

    if (BRACKET_HEADING.test(trimmed)) {
      flushImages()
      flushText()
      blocks.push({ type: 'heading', title: trimmed.slice(1, -1).trim() })
      continue
    }

    if (isLikelyImageUrl(trimmed)) {
      flushText()
      pendingImages.push(trimmed)
      continue
    }

    flushImages()
    textLines.push(trimmed)
  }

  flushImages()
  flushText()
  return blocks
}
