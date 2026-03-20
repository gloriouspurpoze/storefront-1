/**
 * Keyword, originality, and writing-quality helpers for BlogEditor (client-side).
 * Plagiarism against the web requires a third-party API; we only analyze the draft text here.
 */
import DOMPurify from 'dompurify'

export interface KeywordMetricRow {
  phrase: string
  count: number
  densityPercent: number
  inSeoTitle: boolean
  inBlogTitle: boolean
  inMeta: boolean
}

export function normalizeKeywordPhrase(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function countPhraseOccurrences(haystack: string, phrase: string): number {
  const p = normalizeKeywordPhrase(phrase)
  if (!p || !haystack) return 0
  const h = haystack.toLowerCase()
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\b`, 'gi')
  return (h.match(re) || []).length
}

export function keywordMetricsForPhrases(
  phrases: string[],
  plainBody: string,
  blogTitle: string,
  seoTitleEffective: string,
  meta: string,
  wordCount: number,
): KeywordMetricRow[] {
  const body = plainBody.toLowerCase()
  const bt = blogTitle.toLowerCase()
  const st = seoTitleEffective.toLowerCase()
  const mt = meta.toLowerCase()
  const seen = new Set<string>()
  const rows: KeywordMetricRow[] = []

  for (const raw of phrases) {
    const phrase = raw.trim()
    if (!phrase) continue
    const key = normalizeKeywordPhrase(phrase)
    if (seen.has(key)) continue
    seen.add(key)

    const count = countPhraseOccurrences(body, phrase)
    const densityPercent = wordCount > 0 ? Math.round((count / wordCount) * 1000) / 10 : 0
    rows.push({
      phrase,
      count,
      densityPercent,
      inSeoTitle: st.includes(key) || countPhraseOccurrences(st, phrase) > 0,
      inBlogTitle: bt.includes(key) || countPhraseOccurrences(bt, phrase) > 0,
      inMeta: mt.includes(key) || countPhraseOccurrences(mt, phrase) > 0,
    })
  }
  return rows
}

export interface RepeatedSentence {
  snippet: string
  count: number
}

/** Flags sentences (by normalized text) that appear more than once — catches pasted duplication inside the draft. */
export function findRepeatedSentences(plainText: string, minLength = 50): RepeatedSentence[] {
  const parts = plainText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= minLength)
  const map = new Map<string, number>()
  for (const p of parts) {
    const key = p.toLowerCase().replace(/\s+/g, ' ')
    map.set(key, (map.get(key) || 0) + 1)
  }
  const out: RepeatedSentence[] = []
  map.forEach((count, key) => {
    if (count >= 2) {
      const snippet = key.length > 100 ? `${key.slice(0, 97)}…` : key
      out.push({ snippet, count })
    }
  })
  return out.sort((a, b) => b.count - a.count).slice(0, 8)
}

export function countLongParagraphs(html: string, minWords = 150): number {
  if (typeof window === 'undefined' || !html.trim()) return 0
  const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p'] })
  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const ps = doc.body.querySelectorAll('p')
  let n = 0
  ps.forEach((p) => {
    const words = (p.textContent || '').trim().split(/\s+/).filter(Boolean).length
    if (words >= minWords) n += 1
  })
  return n
}

export function buildWriterSuggestions(params: {
  wordCount: number
  h2: number
  h3: number
  fre: number
  longParagraphs: number
  repeatedSentences: number
  internalLinks: number
  seoHintSamples: string[]
  checklistFails: string[]
}): string[] {
  const s: string[] = []
  if (params.wordCount > 0 && params.wordCount < 400) {
    s.push('Content is quite short for a guide — expand with examples, steps, or FAQs unless this is intentionally brief.')
  }
  if (params.h2 + params.h3 < 2 && params.wordCount > 400) {
    s.push('Add more subheadings (H2/H3) so readers can scan long sections.')
  }
  if (params.fre > 0 && params.fre < 40 && params.wordCount > 200) {
    s.push('Readability is fairly low — shorten sentences and swap jargon for plain language where possible.')
  }
  if (params.longParagraphs > 0) {
    s.push(`Split ${params.longParagraphs} very long paragraph(s) (150+ words) for easier reading on mobile.`)
  }
  if (params.repeatedSentences > 0) {
    s.push(`Remove or rewrite repeated sentences (${params.repeatedSentences} duplicate block(s)) — often from copy-paste.`)
  }
  if (params.internalLinks === 0 && params.wordCount > 350) {
    s.push('Add internal links to related articles or service pages where they naturally fit.')
  }
  for (const h of params.seoHintSamples.slice(0, 4)) {
    if (!s.includes(h)) s.push(h)
  }
  for (const c of params.checklistFails.slice(0, 3)) {
    if (!s.includes(c)) s.push(c)
  }
  return s.slice(0, 12)
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildExportPlainDocument(title: string, seoTitleEff: string, meta: string, slug: string, plainBody: string): string {
  return [
    title,
    '',
    `SEO title: ${seoTitleEff}`,
    `Slug: ${slug}`,
    `Meta: ${meta}`,
    '',
    '---',
    '',
    plainBody,
  ].join('\n')
}

export function buildExportHtmlDocument(
  title: string,
  seoTitleEff: string,
  meta: string,
  sanitizedBodyHtml: string,
  featuredUrl: string,
): string {
  const hero = featuredUrl
    ? `<figure class="hero"><img src="${featuredUrl.replace(/"/g, '&quot;')}" alt="" /></figure>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(seoTitleEff || title)}</title>
  <meta name="description" content="${escapeHtml(meta)}"/>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1e293b; }
    .hero img { width: 100%; border-radius: 8px; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${escapeHtml(meta)}</p>
  ${hero}
  <article>${sanitizedBodyHtml}</article>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
