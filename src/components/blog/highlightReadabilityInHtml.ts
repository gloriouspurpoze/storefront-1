/**
 * Highlights readability pain points inside sanitized HTML (preview / coaching only — not saved to posts).
 * Long sentences: wraps text segments over a word threshold in <mark>.
 * Dense blocks: adds a class to <p> and <li> over a word threshold.
 */

import { LONG_PARAGRAPH_WORD_THRESHOLD } from './blog-seo-guidelines'

export const READABILITY_SENTENCE_MARK_CLASS = 'blog-readability-long-sentence'
export const READABILITY_PARAGRAPH_CLASS = 'blog-readability-long-paragraph'

/** Aligns with Flesch coaching copy (“~18–20 words”). */
export const READABILITY_LONG_SENTENCE_WORDS = 20

const REPEAT_MARK_CLASS = 'blog-repeat-gram'

const SENTENCE_MARK_STYLE =
  'background-color:#c9e0fc;color:#0e3191;border-radius:3px;padding:0 2px;box-decoration-break:clone;-webkit-box-decoration-break:clone'

/** Rough sentence chunks (period / ? / !); good enough for coaching overlays. */
function segmentRoughSentences(text: string): string[] {
  if (!text) return []
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  return matches && matches.length > 0 ? matches : [text]
}

function wrapLongSentencesInTextNode(textNode: Text, maxWords: number): void {
  const doc = textNode.ownerDocument
  if (!doc || !textNode.parentNode || !textNode.data) return

  const text = textNode.data
  const segments = segmentRoughSentences(text)
  let anyLong = false
  for (const s of segments) {
    const wc = s.trim().split(/\s+/).filter(Boolean).length
    if (wc > maxWords) {
      anyLong = true
      break
    }
  }
  if (!anyLong) return

  const frag = doc.createDocumentFragment()
  for (const seg of segments) {
    const wc = seg.trim().split(/\s+/).filter(Boolean).length
    if (wc > maxWords) {
      const mark = doc.createElement('mark')
      mark.setAttribute('class', READABILITY_SENTENCE_MARK_CLASS)
      mark.setAttribute('style', SENTENCE_MARK_STYLE)
      mark.setAttribute('title', `Long sentence (~${wc} words) — split or shorten to lift Flesch score`)
      mark.appendChild(doc.createTextNode(seg))
      frag.appendChild(mark)
    } else {
      frag.appendChild(doc.createTextNode(seg))
    }
  }
  textNode.parentNode.replaceChild(frag, textNode)
}

export function highlightReadabilityIssuesInHtml(
  sanitizedHtml: string,
  options?: {
    maxWordsPerSentence?: number
    longParagraphWords?: number
  },
): string {
  const maxWords = options?.maxWordsPerSentence ?? READABILITY_LONG_SENTENCE_WORDS
  const longPara = options?.longParagraphWords ?? LONG_PARAGRAPH_WORD_THRESHOLD

  if (typeof window === 'undefined' || !sanitizedHtml.trim()) return sanitizedHtml

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="blog-rr-root">${sanitizedHtml}</div>`, 'text/html')
  const root = doc.getElementById('blog-rr-root')
  if (!root) return sanitizedHtml

  root.querySelectorAll('p, li').forEach((el) => {
    if (el.closest(`mark.${READABILITY_SENTENCE_MARK_CLASS}`)) return
    const raw = el.textContent?.replace(/\s+/g, ' ').trim() || ''
    if (!raw) return
    const wc = raw.split(/\s+/).filter(Boolean).length
    if (wc >= longPara) {
      el.classList.add(READABILITY_PARAGRAPH_CLASS)
      const prev = el.getAttribute('title')
      const tip = `Dense block (~${wc} words) — split, add subheads, or use a list`
      el.setAttribute('title', prev ? `${prev} · ${tip}` : tip)
    }
  })

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = (node as Text).parentElement
      if (!el) return NodeFilter.FILTER_REJECT
      if (el.closest(`mark.${READABILITY_SENTENCE_MARK_CLASS}`)) return NodeFilter.FILTER_REJECT
      if (el.closest(`mark.${REPEAT_MARK_CLASS}`)) return NodeFilter.FILTER_REJECT
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
    wrapLongSentencesInTextNode(tn, maxWords)
  }

  return root.innerHTML
}
