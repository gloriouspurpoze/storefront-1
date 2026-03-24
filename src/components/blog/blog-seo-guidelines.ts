/**
 * Industry-aligned content & SEO guardrails (Google SERP display, readability, structure).
 * These are editorial heuristics — not confirmed ranking factors.
 *
 * References: typical title ~50–60 chars / ~600px, meta ~155–160 chars; one H1; H2 sections;
 * short paragraphs for mobile; compressed images for CWV.
 */

/** Pillar / long-form article word target */
export const PILLAR_WORD_TARGET = 1500

// --- SERP title (`<title>` / SEO title field) ---
/** Below this, titles often look thin in SERPs */
export const SEO_TITLE_MIN_CHARS = 25
/** ~50–60 characters is the usual “safe” desktop snippet band */
export const SEO_TITLE_OPTIMAL_MAX_CHARS = 60
/** Hard cap — Google often truncates heavily beyond ~60–70 */
export const SEO_TITLE_HARD_MAX_CHARS = 70

// --- Meta description ---
export const META_DESC_MIN_CHARS = 120
/** ~155–158 is a common target before ellipsis */
export const META_DESC_OPTIMAL_MAX_CHARS = 158
/** Google historically ~920px / ~155–160 chars — enforce hard max in the editor */
export const META_DESC_HARD_MAX_CHARS = 160

// --- On-page blog title (often becomes H1 on the live site) ---
export const BLOG_TITLE_SOFT_MAX_CHARS = 70

// --- Headings (article body HTML) ---
/** Ignore strict H1 rules until there is real body content */
export const HEADING_RULES_MIN_WORDS = 250
/** Long-form: expect real section structure */
export const LONGFORM_MIN_WORDS_FOR_SUBHEADINGS = 400
/** Exactly one H1 inside the article body (template may add another on site — writers still use one in Quill) */
export const H1_TARGET_COUNT = 1
/** Minimum H2 count for long guides (H3 can supplement; we still require 2+ “major” breaks) */
export const H2_MIN_FOR_LONGFORM = 2
/** Avoid “micro-section” spam */
export const H2_SOFT_MAX_COUNT = 18
export const H3_SOFT_MAX_COUNT = 28
/** Many H4–H6 often means skipped levels or over-nesting */
export const H456_SOFT_MAX_COUNT = 22

// --- Paragraphs (words per `<p>`) ---
/** Split paragraphs around this length for mobile scanability (Yoast-style ~150; we use slightly stricter web copy) */
export const LONG_PARAGRAPH_WORD_THRESHOLD = 120
/** Checklist “green” if at most this many oversized paragraphs */
export const LONG_PARAGRAPH_MAX_ALLOWED = 2

// --- Images ---
/** Upload cap for in-editor / featured uploads (before CDN optimization) */
export const BLOG_IMAGE_MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB
/** Shown as guidance — aim under this after compression */
export const BLOG_IMAGE_RECOMMENDED_MAX_BYTES = 500 * 1024 // 500 KB

// --- SERP preview truncation (UI only) ---
export const SERP_TITLE_PREVIEW_CHARS = 60
export const SERP_SNIPPET_PREVIEW_CHARS = 160

export function isSeoTitleLengthOk(len: number): boolean {
  return len >= SEO_TITLE_MIN_CHARS && len <= SEO_TITLE_HARD_MAX_CHARS
}

export function isSeoTitleOptimalBand(len: number): boolean {
  return len >= SEO_TITLE_MIN_CHARS && len <= SEO_TITLE_OPTIMAL_MAX_CHARS
}

export function isMetaDescriptionLengthOk(len: number): boolean {
  return len >= META_DESC_MIN_CHARS && len <= META_DESC_HARD_MAX_CHARS
}

export function isMetaDescriptionOptimalBand(len: number): boolean {
  return len >= META_DESC_MIN_CHARS && len <= META_DESC_OPTIMAL_MAX_CHARS
}

/** Minimum combined H2+H3 “section” headings for long guides (~1 per ~380 words, floor at 2). */
export function suggestedMinSectionHeadings(wordCount: number): number {
  if (wordCount < LONGFORM_MIN_WORDS_FOR_SUBHEADINGS) return 0
  return Math.max(H2_MIN_FOR_LONGFORM, Math.min(14, Math.ceil(wordCount / 380)))
}

export function computeBlogSeoScore(params: {
  displayTitle: string
  seoTitle: string
  meta: string
  keyword: string
  plainFromHtml: string
  countPhraseOccurrences: (haystack: string, phrase: string) => number
}): { score: number; hints: string[] } {
  const hints: string[] = []
  let points = 0
  const max = 100

  const serpTitle = params.seoTitle.trim() || params.displayTitle.trim()
  const titleLen = serpTitle.length
  if (isSeoTitleOptimalBand(titleLen)) {
    points += 25
  } else if (isSeoTitleLengthOk(titleLen)) {
    points += 20
    if (titleLen > SEO_TITLE_OPTIMAL_MAX_CHARS) {
      hints.push(
        `SEO title is ${titleLen} characters — Google often truncates after ~${SEO_TITLE_OPTIMAL_MAX_CHARS}. Tighten to the key benefit + brand.`,
      )
    }
  } else {
    hints.push(
      `SEO title (or blog title): use ${SEO_TITLE_MIN_CHARS}–${SEO_TITLE_OPTIMAL_MAX_CHARS} characters for best SERP display (max ${SEO_TITLE_HARD_MAX_CHARS}).`,
    )
    points += titleLen > 0 ? 8 : 0
  }

  const metaLen = params.meta.trim().length
  if (isMetaDescriptionOptimalBand(metaLen)) {
    points += 25
  } else if (isMetaDescriptionLengthOk(metaLen)) {
    points += 20
    if (metaLen > META_DESC_OPTIMAL_MAX_CHARS) {
      hints.push(
        `Meta is ${metaLen} characters — snippets often cut around ${META_DESC_OPTIMAL_MAX_CHARS}–${META_DESC_HARD_MAX_CHARS}. Lead with the value in the first ~120 chars.`,
      )
    }
  } else {
    hints.push(
      `Meta description: target ${META_DESC_MIN_CHARS}–${META_DESC_OPTIMAL_MAX_CHARS} characters (hard max ${META_DESC_HARD_MAX_CHARS} in this editor).`,
    )
    points += metaLen > 0 ? 8 : 0
  }

  const kw = params.keyword.trim().toLowerCase()
  if (kw) {
    const serp = serpTitle.toLowerCase()
    const display = params.displayTitle.toLowerCase()
    const m = params.meta.toLowerCase()
    const body = params.plainFromHtml.toLowerCase()
    if (serp.includes(kw)) {
      points += 20
    } else if (display.includes(kw)) {
      points += 12
      hints.push('Keyword is in the blog title but not in the SEO title — add it to the SEO title for stronger SERP alignment.')
    } else {
      hints.push(`Include primary keyword (“${params.keyword.trim()}”) in the SEO or blog title.`)
    }
    if (m.includes(kw)) points += 15
    else hints.push('Include the primary keyword in the meta description.')
    const firstChunk = body.slice(0, 600)
    const wc = params.plainFromHtml.trim().split(/\s+/).filter(Boolean).length
    const occurrences = params.countPhraseOccurrences(params.plainFromHtml, params.keyword)
    const densityPct = wc > 0 ? (occurrences / wc) * 100 : 0
    if (firstChunk.includes(kw)) points += 10
    else hints.push('Use the primary keyword early in the content.')
    if (densityPct > 2.5 || occurrences > 18) {
      points = Math.max(0, points - 12)
      hints.push(
        `Primary phrase appears very often (~${occurrences}×, ~${densityPct.toFixed(1)}% of words) — likely reads as keyword stuffing. Use synonyms and write for people.`,
      )
    } else if (densityPct > 1.8 && wc > 500) {
      hints.push('Keyword density is on the high side — read the post aloud; if it sounds repetitive, vary phrasing.')
    }
    if (occurrences >= 2 && densityPct <= 2.5 && occurrences <= 18) {
      points += 5
    } else if (occurrences < 2 && wc > 80) {
      hints.push('Use the primary keyword naturally a few times in the body (headings or opening sections work well).')
    }
  } else {
    hints.push('Set a primary keyword to unlock keyword-based SEO checks.')
    points += 15
  }

  return { score: Math.min(max, Math.round(points)), hints }
}
