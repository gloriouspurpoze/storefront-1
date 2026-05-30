/**
 * Wraps repeated phrase matches (from originality / 5-gram scan) in <mark> inside sanitized HTML.
 * Only matches within a single text node (won't span e.g. bold across elements).
 */

const MARK_CLASS = 'blog-repeat-gram'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Build case-insensitive regex for a space-separated phrase; allows punctuation between words. */
export function phraseToFlexibleRegex(phrase: string): RegExp {
  const words = phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return /$^/
  const between = '[\\s\\u00A0\\.,;:!?\'"()\\-\\[\\]/&]+'
  const inner = words.map((w) => `\\b${escapeRegExp(w)}\\b`).join(between)
  return new RegExp(`(${inner})`, 'gi')
}

function applyHighlightsToTextNode(textNode: Text, regexes: RegExp[]): void {
  const doc = textNode.ownerDocument
  if (!doc || !textNode.parentNode || !textNode.data) return

  let remaining = textNode.data
  const frag = doc.createDocumentFragment()

  while (remaining.length > 0) {
    let bestIdx = -1
    let bestLen = 0
    let bestMatch = ''

    for (const re of regexes) {
      re.lastIndex = 0
      const m = re.exec(remaining)
      if (m && m.index !== undefined) {
        const idx = m.index
        const len = m[0].length
        if (bestIdx === -1 || idx < bestIdx || (idx === bestIdx && len > bestLen)) {
          bestIdx = idx
          bestLen = len
          bestMatch = m[0]
        }
      }
    }

    if (bestIdx < 0) {
      frag.appendChild(doc.createTextNode(remaining))
      break
    }

    if (bestIdx > 0) {
      frag.appendChild(doc.createTextNode(remaining.slice(0, bestIdx)))
    }

    const mark = doc.createElement('mark')
    mark.setAttribute('class', MARK_CLASS)
    mark.setAttribute(
      'style',
      'background-color:#f9d4d2;color:#5a1313;border-radius:3px;padding:0 3px;box-decoration-break:clone;-webkit-box-decoration-break:clone',
    )
    mark.setAttribute('title', 'Repeated phrase flagged by originality scan (5-word window)')
    mark.appendChild(doc.createTextNode(bestMatch))
    frag.appendChild(mark)

    remaining = remaining.slice(bestIdx + bestLen)
  }

  textNode.parentNode.replaceChild(frag, textNode)
}

/**
 * @param sanitizedHtml - already passed through DOMPurify once
 * @param phrases - lowercase phrases from server (e.g. repeated 5-grams)
 */
export function highlightRepeatPhrasesInHtml(sanitizedHtml: string, phrases: string[]): string {
  if (typeof window === 'undefined' || !sanitizedHtml.trim()) return sanitizedHtml

  const unique = Array.from(
    new Set(phrases.map((p) => p.trim().toLowerCase()).filter(Boolean)),
  ).sort((a, b) => b.length - a.length)
  if (unique.length === 0) return sanitizedHtml

  const regexes = unique.map((p) => phraseToFlexibleRegex(p))

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="blog-hl-root">${sanitizedHtml}</div>`, 'text/html')
  const root = doc.getElementById('blog-hl-root')
  if (!root) return sanitizedHtml

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = (node as Text).parentElement
      if (!el) return NodeFilter.FILTER_REJECT
      if (el.closest(`mark.${MARK_CLASS}`)) return NodeFilter.FILTER_REJECT
      if (el.closest('script, style')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes: Text[] = []
  let n: Node | null
  while ((n = walker.nextNode())) {
    textNodes.push(n as Text)
  }

  for (const tn of textNodes) {
    if (!tn.parentNode) continue
    applyHighlightsToTextNode(tn, regexes)
  }

  return root.innerHTML
}
