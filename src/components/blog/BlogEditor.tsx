/**
 * BlogEditor — blog form + real-time (debounced) content analysis.
 *
 * Dependencies (install if missing):
 *   npm install react-quill-new quill dompurify
 *   npm install -D @types/dompurify
 *
 * Optional: `readability-score` or `text-readability` on npm — this file uses an
 * inline Flesch Reading Ease implementation instead to avoid extra runtime deps.
 *
 * Styles: Tailwind utility classes (project must include `src` in tailwind content).
 *
 * CMS wiring: used from `/cms/blogs/new` and `/cms/blogs/:postId/edit`; saves via `BlogService`.
 *
 * Writer kit: keyword table + secondary keywords, originality (in-draft repeats + copy for external plagiarism tools),
 * export .txt/.html, print/PDF, reader preview, consolidated suggestions (see `blog-writer-utils.ts`).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import { BlogService, type BlogPlagiarismAnalysis } from '../../services/api/blog.service'
import { useToast } from '../ui'
import type { BlogPostStatus } from '../../types/cms.types'
import {
  buildExportHtmlDocument,
  buildExportPlainDocument,
  buildWriterSuggestions,
  countLongParagraphs,
  countPhraseOccurrences,
  downloadTextFile,
  findRepeatedSentences,
  keywordMetricsForPhrases,
} from './blog-writer-utils'
import { highlightRepeatPhrasesInHtml } from './highlightRepeatPhrases'

// --- Slugify (URL-safe segment from title) -----------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Syllable estimate (English heuristic for readability) -------------------

function countSyllablesInWord(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const vowels = w.match(/[aeiouy]+/g)
  let count = vowels ? vowels.length : 1
  if (w.endsWith('e')) count = Math.max(1, count - 1)
  return Math.max(1, count)
}

// --- Flesch Reading Ease (0–100, higher = easier) ---------------------------

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0 || sentences.length === 0) return 0
  const syllables = words.reduce((acc, w) => acc + countSyllablesInWord(w), 0)
  const avgWordsPerSentence = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

function fleschLabel(score: number): string {
  if (score >= 90) return 'Very easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly difficult'
  if (score >= 30) return 'Difficult'
  return 'Very difficult'
}

// --- Parse Quill HTML for structure metrics ----------------------------------

interface ParsedContentStats {
  wordCount: number
  h2: number
  h3: number
  imageCount: number
  imagesMissingAlt: number
  internalLinkCount: number
  externalLinkCount: number
  plainText: string
}

function parseContentHtml(html: string, internalHosts: string[]): ParsedContentStats {
  const empty: ParsedContentStats = {
    wordCount: 0,
    h2: 0,
    h3: 0,
    imageCount: 0,
    imagesMissingAlt: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    plainText: '',
  }
  if (!html || !html.trim()) return empty

  const safe = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style'],
  })

  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const body = doc.body

  const h2 = body.querySelectorAll('h2').length
  const h3 = body.querySelectorAll('h3').length
  const imgs = body.querySelectorAll('img')
  let imagesMissingAlt = 0
  imgs.forEach((img) => {
    const alt = img.getAttribute('alt')
    if (alt === null || alt.trim() === '') imagesMissingAlt += 1
  })

  const links = body.querySelectorAll('a[href]')
  let internal = 0
  let external = 0
  links.forEach((a) => {
    const href = (a.getAttribute('href') || '').trim()
    if (!href || href.startsWith('#')) return
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      internal += 1
      return
    }
    try {
      const u = new URL(href, window.location.origin)
      const isInternal =
        internalHosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ||
        u.origin === window.location.origin
      if (isInternal) internal += 1
      else external += 1
    } catch {
      external += 1
    }
  })

  const plainText = body.textContent?.replace(/\s+/g, ' ').trim() || ''
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0

  return {
    wordCount,
    h2,
    h3,
    imageCount: imgs.length,
    imagesMissingAlt,
    internalLinkCount: internal,
    externalLinkCount: external,
    plainText,
  }
}

// --- SEO score (0–100, heuristic) --------------------------------------------

function computeSeoScore(params: {
  /** Visible headline (H1 / post title). */
  displayTitle: string
  /** Optional `<title>` / SERP override; empty means same as display title. */
  seoTitle: string
  meta: string
  keyword: string
  plainFromHtml: string
}): { score: number; hints: string[] } {
  const hints: string[] = []
  let points = 0
  const max = 100

  const serpTitle = params.seoTitle.trim() || params.displayTitle.trim()
  const titleLen = serpTitle.length
  if (titleLen >= 30 && titleLen <= 65) {
    points += 25
  } else {
    hints.push('SEO title (or blog title if blank): aim for ~30–65 characters for SERP display.')
    points += titleLen > 0 ? 10 : 0
  }

  const metaLen = params.meta.trim().length
  if (metaLen >= 120 && metaLen <= 165) {
    points += 25
  } else {
    hints.push('Meta description: target ~120–160 characters.')
    points += metaLen > 0 ? 10 : 0
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
    const occurrences = countPhraseOccurrences(params.plainFromHtml, params.keyword)
    const densityPct = wc > 0 ? (occurrences / wc) * 100 : 0
    if (firstChunk.includes(kw)) points += 10
    else hints.push('Use the primary keyword early in the content.')
    // Natural use (Google: helpful content > repetition). Soft band ~0.5–2% density is a common editor guideline.
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

// --- Quill toolbar -----------------------------------------------------------

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
}

const QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'indent',
  'blockquote',
  'code-block',
  'link',
  'image',
]

const WORD_TARGET = 1500
const DEBOUNCE_MS = 350

// --- Component ---------------------------------------------------------------

export interface BlogEditorProps {
  /** When set, loads the post and updates via PUT; otherwise creates via POST. */
  postId?: string | null
  onCancel?: () => void
  onSaved?: () => void
}

export function BlogEditor({ postId = null, onCancel, onSaved }: BlogEditorProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredFilePreview, setFeaturedFilePreview] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [cmsCategories, setCmsCategories] = useState<{ _id: string; name: string }[]>([])
  const [tagsInput, setTagsInput] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('pillar topic')
  const [secondaryKeywordsInput, setSecondaryKeywordsInput] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [plagiarismScanning, setPlagiarismScanning] = useState(false)
  const [plagiarismResult, setPlagiarismResult] = useState<BlogPlagiarismAnalysis | null>(null)
  const [plagiarismError, setPlagiarismError] = useState<string | null>(null)
  /** In preview: wrap server-reported 5-gram repeats in <mark> */
  const [previewHighlightRepeats, setPreviewHighlightRepeats] = useState(true)
  const [siteHost, setSiteHost] = useState('') // e.g. "example.com" for internal link detection
  const [status, setStatus] = useState<BlogPostStatus>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [scheduledLocal, setScheduledLocal] = useState('') // datetime-local value
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')

  const [hasOriginalData, setHasOriginalData] = useState(false)
  const [hasDownloadableAsset, setHasDownloadableAsset] = useState(false)
  const [hasInternalLinksDeclared, setHasInternalLinksDeclared] = useState(false)

  const [debouncedPayload, setDebouncedPayload] = useState({
    html: '',
    title: '',
    seoTitle: '',
    meta: '',
    keyword: '',
    secondaryKeywords: '',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const featuredBlobUrlRef = useRef<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const onTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      if (!slugTouched) setSlug(slugify(value))
    },
    [slugTouched],
  )

  // Debounce heavy analysis inputs (full snapshot) for performance
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedPayload({
        html: contentHtml,
        title,
        seoTitle,
        meta: metaDescription,
        keyword: primaryKeyword,
        secondaryKeywords: secondaryKeywordsInput,
      })
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [contentHtml, title, seoTitle, metaDescription, primaryKeyword, secondaryKeywordsInput])

  // CMS blog categories (same source as Blog Management)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await BlogService.getCategories()
        if (cancelled) return
        setCmsCategories(
          list
            .filter((c) => c.isActive !== false)
            .map((c) => ({ _id: c._id, name: c.name })),
        )
      } catch {
        if (!cancelled) setCmsCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Load existing post when editing (route: /cms/blogs/:id/edit)
  useEffect(() => {
    if (!postId) {
      setLoadState('idle')
      return
    }
    let cancelled = false
    setLoadState('loading')
    ;(async () => {
      try {
        const post = await BlogService.getPostById(postId)
        if (cancelled) return
        setTitle(post.title)
        setSlug(post.slug)
        setSlugTouched(true)
        const loadedSeoTitle = post.seo?.title?.trim()
        const postTitle = post.title?.trim() ?? ''
        setSeoTitle(loadedSeoTitle && loadedSeoTitle !== postTitle ? loadedSeoTitle : '')
        setMetaDescription(post.seo?.description ?? post.excerpt ?? '')
        setFeaturedImageUrl(post.featuredImage ?? '')
        if (featuredBlobUrlRef.current) {
          URL.revokeObjectURL(featuredBlobUrlRef.current)
          featuredBlobUrlRef.current = null
        }
        setFeaturedFilePreview(null)
        setCategoryId(
          typeof post.category === 'object' && post.category?._id ? post.category._id : '',
        )
        setTagsInput((post.tags ?? []).join(', '))
        setContentHtml(post.content ?? '')
        const allKw = post.seo?.keywords ?? []
        if (allKw[0]) setPrimaryKeyword(allKw[0])
        else setPrimaryKeyword('pillar topic')
        const tagsLower = new Set((post.tags ?? []).map((t) => t.toLowerCase()))
        setSecondaryKeywordsInput(
          allKw.slice(1).filter((k) => k && !tagsLower.has(k.toLowerCase())).join(', '),
        )
        setStatus(post.status)
        setIsFeatured(post.isFeatured ?? false)
        setAllowComments(post.allowComments ?? true)
        if (post.scheduledPublishAt) {
          const d = new Date(post.scheduledPublishAt)
          const pad = (n: number) => String(n).padStart(2, '0')
          setScheduledLocal(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
          )
        } else setScheduledLocal('')
        setLoadState('idle')
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadState('error')
          const msg =
            (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            (e as Error)?.message ??
            'Failed to load post'
          toast({ title: 'Error', description: msg, variant: 'destructive' })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId, toast])

  useEffect(() => {
    if (!previewOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewOpen])

  const internalHosts = useMemo(() => {
    const h = siteHost.trim()
    return h ? [h] : []
  }, [siteHost])

  const stats = useMemo(() => parseContentHtml(debouncedPayload.html, internalHosts), [debouncedPayload.html, internalHosts])

  const readingTimeMinutes = useMemo(() => {
    const wpm = 200
    return Math.max(1, Math.ceil(stats.wordCount / wpm))
  }, [stats.wordCount])

  const fre = useMemo(() => fleschReadingEase(stats.plainText), [stats.plainText])

  const seo = useMemo(
    () =>
      computeSeoScore({
        displayTitle: debouncedPayload.title,
        seoTitle: debouncedPayload.seoTitle,
        meta: debouncedPayload.meta,
        keyword: debouncedPayload.keyword,
        plainFromHtml: stats.plainText,
      }),
    [debouncedPayload.title, debouncedPayload.seoTitle, debouncedPayload.meta, debouncedPayload.keyword, stats.plainText],
  )

  const effectiveSeoTitle = seoTitle.trim() || title.trim()
  const seoTitleLen = seoTitle.length
  const metaLen = metaDescription.length
  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  )

  const featuredPresent = Boolean(featuredImageUrl.trim() || featuredFilePreview)

  const debouncedSerpTitle = debouncedPayload.seoTitle.trim() || debouncedPayload.title.trim()

  const keywordPhraseList = useMemo(() => {
    const primary = debouncedPayload.keyword.trim()
    const secondary = debouncedPayload.secondaryKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const merged = primary ? [primary, ...secondary] : secondary
    return merged.slice(0, 12)
  }, [debouncedPayload.keyword, debouncedPayload.secondaryKeywords])

  const keywordRows = useMemo(
    () =>
      keywordMetricsForPhrases(
        keywordPhraseList,
        stats.plainText,
        debouncedPayload.title,
        debouncedSerpTitle,
        debouncedPayload.meta,
        stats.wordCount,
      ),
    [
      keywordPhraseList,
      stats.plainText,
      stats.wordCount,
      debouncedPayload.title,
      debouncedSerpTitle,
      debouncedPayload.meta,
    ],
  )

  const repeatedSentenceGroups = useMemo(() => findRepeatedSentences(stats.plainText), [stats.plainText])
  const longParagraphCount = useMemo(
    () => countLongParagraphs(debouncedPayload.html),
    [debouncedPayload.html],
  )

  const linkWorthyWarnings: string[] = []
  if (!hasOriginalData) linkWorthyWarnings.push('No original data / research indicated.')
  if (!hasDownloadableAsset) linkWorthyWarnings.push('No downloadable asset (template, PDF, etc.) indicated.')
  if (!hasInternalLinksDeclared) linkWorthyWarnings.push('Editor has not confirmed internal links to related content.')
  if (stats.internalLinkCount === 0 && stats.plainText.length > 200) {
    linkWorthyWarnings.push('No internal links detected in HTML (add links to your site where relevant).')
  }

  const checklist = useMemo(() => {
    const serp = seoTitle.trim() || title.trim()
    const kw = primaryKeyword.trim().toLowerCase()
    const keywordInTitle =
      !kw ||
      serp.toLowerCase().includes(kw) ||
      title.toLowerCase().includes(kw)
    const primaryRow = keywordRows[0]
    const primaryNatural =
      !debouncedPayload.keyword.trim() ||
      (primaryRow != null && primaryRow.densityPercent <= 2.5 && primaryRow.count <= 18)
    const secondaryList = debouncedPayload.secondaryKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const secondaryCountOk = secondaryList.length <= 10
    const items: { id: string; label: string; ok: boolean }[] = [
      {
        id: 't',
        label: 'SEO title length ~30–65 chars (blog title counts if SEO title is empty)',
        ok: serp.length >= 30 && serp.length <= 65,
      },
      { id: 'm', label: 'Meta description ~120–160 characters', ok: metaLen >= 120 && metaLen <= 160 },
      { id: 'w', label: `Word count ≥ ${WORD_TARGET} (pillar target)`, ok: stats.wordCount >= WORD_TARGET },
      { id: 'h', label: 'At least 2 subheadings (H2/H3)', ok: stats.h2 + stats.h3 >= 2 },
      { id: 'i', label: 'Featured image (URL or upload)', ok: featuredPresent },
      { id: 'k', label: 'Primary keyword in SEO or blog title', ok: keywordInTitle },
      {
        id: 'kn',
        label: 'Primary keyword looks natural in body (not stuffed; ~≤2.5% density)',
        ok: primaryNatural,
      },
      {
        id: 'ks',
        label: 'Secondary keywords focused (about 3–10 supporting phrases)',
        ok: secondaryCountOk,
      },
      { id: 'l', label: 'Link-worthiness checkboxes (data, asset, internal)', ok: hasOriginalData && hasDownloadableAsset && hasInternalLinksDeclared },
      { id: 'r', label: 'Readability: Flesch ≥ 45 (adjust for audience)', ok: fre >= 45 },
      { id: 'a', label: 'All images have alt text (when images exist)', ok: stats.imageCount === 0 || stats.imagesMissingAlt === 0 },
    ]
    const done = items.filter((i) => i.ok).length
    return { items, done, total: items.length, pct: Math.round((done / items.length) * 100) }
  }, [
    title,
    seoTitle,
    metaLen,
    stats.wordCount,
    stats.h2,
    stats.h3,
    stats.imageCount,
    stats.imagesMissingAlt,
    featuredPresent,
    primaryKeyword,
    hasOriginalData,
    hasDownloadableAsset,
    hasInternalLinksDeclared,
    fre,
    keywordRows,
    debouncedPayload.keyword,
    debouncedPayload.secondaryKeywords,
  ])

  /** One headline %: checklist, SEO, content/readability; adds scan originality when a run exists. */
  const overallCompletion = useMemo(() => {
    const wordProgress =
      stats.wordCount <= 0 ? 0 : Math.min(100, Math.round((stats.wordCount / WORD_TARGET) * 100))
    const freOk = Number.isFinite(fre) && fre > 0
    const readProgress =
      stats.wordCount <= 0 ? 0 : !freOk ? 0 : fre >= 45 ? 100 : Math.min(100, Math.round((fre / 45) * 100))
    const contentBlend = Math.round((wordProgress + readProgress) / 2)
    const os = plagiarismResult?.originalityScore
    const originality =
      plagiarismResult != null && typeof os === 'number' && Number.isFinite(os)
        ? Math.min(100, Math.max(0, os))
        : null
    if (originality != null) {
      const raw =
        0.45 * checklist.pct + 0.3 * seo.score + 0.12 * contentBlend + 0.13 * originality
      return Math.min(100, Math.max(0, Math.round(raw)))
    }
    const raw = 0.5 * checklist.pct + 0.35 * seo.score + 0.15 * contentBlend
    return Math.min(100, Math.max(0, Math.round(raw)))
  }, [checklist.pct, seo.score, stats.wordCount, fre, plagiarismResult])

  const checklistFails = useMemo(
    () => checklist.items.filter((i) => !i.ok).map((i) => i.label),
    [checklist],
  )

  const writerSuggestions = useMemo(
    () =>
      buildWriterSuggestions({
        wordCount: stats.wordCount,
        h2: stats.h2,
        h3: stats.h3,
        fre,
        longParagraphs: longParagraphCount,
        repeatedSentences: repeatedSentenceGroups.length,
        internalLinks: stats.internalLinkCount,
        seoHintSamples: seo.hints,
        checklistFails,
      }),
    [
      stats.wordCount,
      stats.h2,
      stats.h3,
      stats.internalLinkCount,
      fre,
      longParagraphCount,
      repeatedSentenceGroups.length,
      seo.hints,
      checklistFails,
    ],
  )

  /** Extra nudges for natural copy (not duplicate of SEO hints when possible). */
  const naturalKeywordHints = useMemo(() => {
    const h: string[] = []
    const pk = debouncedPayload.keyword.trim()
    const row = keywordRows[0]
    if (pk && row) {
      if (row.densityPercent > 2.5) {
        h.push(
          `Primary phrase is ~${row.densityPercent}% of words — Google’s helpful-content signals favor natural language; cut repeats and use “also called…” or related terms.`,
        )
      } else if (row.densityPercent > 1.8 && stats.wordCount > 600) {
        h.push('Primary keyword shows up often — if any paragraph feels written for robots, rewrite for a human reader.')
      }
      if (row.count > 18) {
        h.push('Very high repetition of the exact primary phrase — vary wording; one clear topic per post is enough.')
      }
    }
    const secondaryList = debouncedPayload.secondaryKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (secondaryList.length > 10) {
      h.push('Many secondaries — market practice is ~3–8 tight related phrases (synonyms, questions, subtopics), not a long keyword list.')
    }
    return h
  }, [debouncedPayload.keyword, debouncedPayload.secondaryKeywords, keywordRows, stats.wordCount])

  const allWriterSuggestions = useMemo(
    () => [...naturalKeywordHints, ...writerSuggestions],
    [naturalKeywordHints, writerSuggestions],
  )

  const previewPurifyConfig = useMemo(
    () => ({
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img',
        'mark',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'title'],
    }),
    [],
  )

  const previewArticleHtml = useMemo(() => {
    const base = DOMPurify.sanitize(contentHtml, previewPurifyConfig)
    const grams = plagiarismResult?.repeatedFiveGrams
    if (!previewHighlightRepeats || !grams?.length) return base
    try {
      const hi = highlightRepeatPhrasesInHtml(
        base,
        grams.map((g) => g.phrase),
      )
      return DOMPurify.sanitize(hi, previewPurifyConfig)
    } catch {
      return base
    }
  }, [contentHtml, previewPurifyConfig, plagiarismResult, previewHighlightRepeats])

  const runBackendPlagiarismScan = async () => {
    const html = contentHtml.trim()
    if (!html || html === '<p><br></p>') {
      toast({ title: 'Nothing to scan', description: 'Add content in the editor first.', variant: 'destructive' })
      return
    }
    setPlagiarismScanning(true)
    setPlagiarismError(null)
    try {
      const analysis = await BlogService.scanPlagiarism({
        html,
        title: title.trim() || undefined,
      })
      setPlagiarismResult(analysis)
      toast({
        title: 'Scan complete',
        description: `Originality score ${analysis.originalityScore}/100 (server analysis).`,
      })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e as Error)?.message ??
        'Scan failed'
      setPlagiarismError(msg)
      toast({ title: 'Scan failed', description: msg, variant: 'destructive' })
    } finally {
      setPlagiarismScanning(false)
    }
  }

  const copyPlainTextForExternalCheck = () => {
    const text = stats.plainText
    if (!text) {
      toast({ title: 'Nothing to copy', description: 'Add content first.', variant: 'destructive' })
      return
    }
    void navigator.clipboard.writeText(text).then(
      () => toast({ title: 'Copied', description: 'Plain text copied — paste into your plagiarism tool.' }),
      () => toast({ title: 'Copy failed', description: 'Select and copy manually from preview.', variant: 'destructive' }),
    )
  }

  const exportSlugBase = (slug.trim() || slugify(title) || 'blog-post').replace(/[^a-z0-9-]/gi, '-')

  const handleExportTxt = () => {
    const plain = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const doc = buildExportPlainDocument(title, effectiveSeoTitle, metaDescription, slug.trim() || slugify(title), plain)
    downloadTextFile(`${exportSlugBase}.txt`, doc)
    toast({ title: 'Exported', description: `${exportSlugBase}.txt downloaded` })
  }

  const handleExportHtml = () => {
    const safeBody = DOMPurify.sanitize(contentHtml, {
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    })
    const html = buildExportHtmlDocument(
      title,
      effectiveSeoTitle,
      metaDescription,
      safeBody,
      featuredImageUrl.trim(),
    )
    downloadTextFile(`${exportSlugBase}.html`, html, 'text/html;charset=utf-8')
    toast({ title: 'Exported', description: `${exportSlugBase}.html downloaded` })
  }

  const handlePrintPdf = () => {
    const safeBody = DOMPurify.sanitize(contentHtml, {
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    })
    const docHtml = buildExportHtmlDocument(
      title,
      effectiveSeoTitle,
      metaDescription,
      safeBody,
      featuredImageUrl.trim(),
    )
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) {
      toast({ title: 'Pop-up blocked', description: 'Allow pop-ups to print, or use Export HTML.', variant: 'destructive' })
      return
    }
    w.document.write(docHtml)
    w.document.close()
    w.onload = () => {
      setTimeout(() => {
        w.focus()
        w.print()
      }, 200)
    }
  }

  const handleFeaturedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (featuredBlobUrlRef.current) URL.revokeObjectURL(featuredBlobUrlRef.current)
    featuredBlobUrlRef.current = URL.createObjectURL(file)
    setFeaturedFilePreview(featuredBlobUrlRef.current)
  }

  const handleSave = async (statusOverride?: BlogPostStatus) => {
    const effectiveStatus = statusOverride ?? status
    if (!title.trim()) {
      toast({ title: 'Validation', description: 'Title is required', variant: 'destructive' })
      return
    }
    const textOnly = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!textOnly.length) {
      toast({ title: 'Validation', description: 'Content is required', variant: 'destructive' })
      return
    }
    const trimmedUrl = featuredImageUrl.trim()
    if (featuredFilePreview && !trimmedUrl) {
      toast({
        title: 'Featured image',
        description: 'Paste a public image URL (e.g. from Media Library). A local file preview alone cannot be saved to the API.',
        variant: 'destructive',
      })
      return
    }
    if (effectiveStatus === 'scheduled' && !scheduledLocal) {
      toast({
        title: 'Validation',
        description: 'Choose a date and time for scheduled posts.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    setSaveMessage('')
    try {
      const excerpt = metaDescription.trim().slice(0, 300)
      const tagList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      const kw = primaryKeyword.trim()
      const scheduledPublishAt =
        effectiveStatus === 'scheduled' && scheduledLocal
          ? new Date(scheduledLocal).toISOString()
          : undefined

      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        excerpt,
        content: contentHtml,
        category: categoryId || undefined,
        tags: tagList,
        status: effectiveStatus,
        isFeatured,
        allowComments,
        featuredImage: trimmedUrl || undefined,
        scheduledPublishAt,
        seo: {
          title: seoTitle.trim() || title.trim(),
          description: metaDescription.trim() || excerpt,
          keywords: Array.from(
            new Set(
              [
                kw,
                ...secondaryKeywordsInput
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
                ...tagList,
              ].filter(Boolean),
            ),
          ),
          ogImage: trimmedUrl || undefined,
        },
      }

      if (postId) {
        await BlogService.updatePost(postId, payload)
      } else {
        await BlogService.createPost(payload)
      }
      if (statusOverride) setStatus(statusOverride)
      toast({ title: 'Saved', description: postId ? 'Blog post updated.' : 'Blog post created.' })
      onSaved?.()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e as Error)?.message ??
        'Save failed'
      setSaveMessage(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const quickSaveDraft = () => void handleSave('draft')
  const quickPublish = () => void handleSave('published')

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-slate-600">
        Loading post…
      </div>
    )
  }

  if (loadState === 'error' && postId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-700">Could not load this post.</p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to blog posts
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-start gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{postId ? 'Edit post' : 'New post'}</h1>
              <p className="text-sm text-slate-600">Analysis updates after you pause typing ({DEBOUNCE_MS}ms debounce).</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleExportTxt}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Export .txt
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Export .html
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Print / PDF
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            {status === 'scheduled' && (
              <input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={submitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={quickSaveDraft}
                disabled={submitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={quickPublish}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </div>
        </header>

        {saveMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{saveMessage}</div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall completion</p>
              <p className="mt-0.5 text-sm text-slate-600">
                {plagiarismResult ? (
                  <>
                    Weighted blend: 45% checklist · 30% SEO · 12% word target &amp; readability · 13% scan originality
                  </>
                ) : (
                  <>
                    Weighted blend: 50% checklist · 35% SEO · 15% word target &amp; readability. Run a plagiarism scan to
                    fold originality into this score.
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline gap-2 sm:text-right">
              <span className="text-3xl font-bold tabular-nums text-indigo-700">{overallCompletion}</span>
              <span className="text-lg font-semibold text-indigo-600">%</span>
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: form + editor */}
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium">Blog title</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="How to …"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">SEO title (optional)</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Leave blank to use the blog title in search results"
                maxLength={70}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>Used for &lt;title&gt; and SERP; often shorter than the on-page headline.</span>
                <span>
                  {seoTitleLen > 0 ? `${seoTitleLen}` : `→ ${effectiveSeoTitle.length}`} / 70
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">URL slug</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                placeholder="auto-from-title"
              />
              <p className="mt-1 text-xs text-slate-500">Generated from the title until you edit this field.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Meta description</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={320}
                placeholder="Search result snippet…"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>Ideal ~120–160 characters</span>
                <span>
                  {metaLen} / 320
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Featured image URL</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Or upload</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFeaturedFile} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
                >
                  Choose file…
                </button>
              </div>
            </div>
            {(featuredImageUrl || featuredFilePreview) && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img
                  src={featuredFilePreview || featuredImageUrl}
                  alt="Featured preview"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Uncategorized</option>
                {cmsCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                Featured post
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
                Allow comments
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="seo, content, product (comma-separated)"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Primary keyword</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="One main topic / search intent for this post"
              />
              <p className="mt-1 text-xs text-slate-500">
                <strong>Market norm:</strong> one primary per article (the topic you want to rank for). Use it in title, meta, intro, and headings
                where it reads naturally — not in every sentence. Sidebar flags density &gt; ~2.5% as likely stuffing.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Secondary keywords</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={2}
                value={secondaryKeywordsInput}
                onChange={(e) => setSecondaryKeywordsInput(e.target.value)}
                placeholder="Synonyms, long-tails, related questions (comma-separated)"
              />
              <p className="mt-1 text-xs text-slate-500">
                <strong>Typical range:</strong> about 3–8 supporting phrases. They help topical depth and internal linking ideas; avoid a long laundry
                list. Saved with tags into SEO keywords; coverage table is debounced.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Internal link hostname (optional)</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={siteHost}
                onChange={(e) => setSiteHost(e.target.value)}
                placeholder="yoursite.com — used to classify absolute URLs as internal"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Content</label>
              <div className="blog-quill rounded-lg border border-slate-300 [&_.ql-container]:min-h-[320px] [&_.ql-editor]:min-h-[280px] [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
                <ReactQuill theme="snow" value={contentHtml} onChange={setContentHtml} modules={QUILL_MODULES} formats={QUILL_FORMATS} placeholder="Write pillar content…" />
              </div>
            </div>
          </div>

          {/* Right: analysis */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Keyword coverage</h2>
              <p className="mt-1 text-xs text-slate-500">Counts &amp; density in body (debounced). Title/meta flags use SEO + blog title.</p>
              <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-700">Natural &amp; Google:</strong> There is no official “max keywords” from Google. Rankings follow
                relevance, quality, and helpful content — stuffing hurts. Aim for one clear topic (primary), a handful of related phrases (secondaries),
                and copy that sounds fine when read aloud. This panel uses ~≤2.5% primary density in the body as a practical anti-stuffing guardrail
                (common in SEO plugins; not a ranking formula).
              </div>
              {keywordRows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Add a primary or secondary keyword.</p>
              ) : (
                <div className="mt-3 max-h-56 overflow-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1 pr-2 font-medium">Phrase</th>
                        <th className="py-1 pr-2 font-medium">#</th>
                        <th className="py-1 pr-2 font-medium">%</th>
                        <th className="py-1 font-medium">T/M</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordRows.map((row) => (
                        <tr
                          key={row.phrase}
                          className={`border-b border-slate-100 ${row.densityPercent > 2.5 ? 'bg-amber-50' : ''}`}
                        >
                          <td className="py-1 pr-2 text-slate-800">{row.phrase}</td>
                          <td className="py-1 pr-2">{row.count}</td>
                          <td className="py-1 pr-2">
                            {row.densityPercent}%
                            {row.densityPercent > 2.5 && (
                              <span className="ml-1 text-amber-800" title="High density — may read as keyword stuffing">
                                ⚠
                              </span>
                            )}
                          </td>
                          <td className="py-1 text-slate-600">
                            {(row.inSeoTitle || row.inBlogTitle) && <span title="In title">T </span>}
                            {row.inMeta && <span title="In meta">M</span>}
                            {!row.inSeoTitle && !row.inBlogTitle && !row.inMeta && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pre-publish checklist</h2>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${checklist.pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {checklist.done}/{checklist.total} complete ({checklist.pct}%)
              </p>
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <span className={item.ok ? 'text-emerald-600' : 'text-slate-400'}>{item.ok ? '✓' : '○'}</span>
                    <span className={item.ok ? 'text-slate-700' : 'text-slate-500'}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Content metrics</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Words</dt>
                  <dd className="font-medium">
                    {stats.wordCount}
                    <span className="ml-1 text-xs font-normal text-slate-500">(target &gt;{WORD_TARGET})</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Reading time</dt>
                  <dd className="font-medium">~{readingTimeMinutes} min</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">H2 / H3</dt>
                  <dd className="font-medium">
                    {stats.h2} / {stats.h3}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Images</dt>
                  <dd className="font-medium">{stats.imageCount}</dd>
                </div>
                <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                  {stats.imageCount === 0
                    ? 'Add images where they clarify the story; set descriptive alt text in the image dialog.'
                    : stats.imagesMissingAlt > 0
                      ? `${stats.imagesMissingAlt} image(s) missing alt text — add alt in Quill when inserting images.`
                      : 'All images have alt text.'}
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <dt className="text-slate-600">Internal / external links</dt>
                  <dd className="font-medium">
                    {stats.internalLinkCount} / {stats.externalLinkCount}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Readability</h2>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stats.wordCount ? fre : '—'} <span className="text-base font-normal text-slate-500">/ 100</span>
              </p>
              <p className="text-sm text-slate-600">{stats.wordCount ? fleschLabel(fre) : 'Add content to score.'}</p>
              <p className="mt-2 text-xs text-slate-500">Flesch Reading Ease (approximation from extracted text).</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">SEO score</h2>
              <p className="mt-2 text-2xl font-semibold text-indigo-700">{seo.score}</p>
              {seo.hints.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {seo.hints.slice(0, 6).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Suggestions for writer</h2>
              <p className="mt-1 text-xs text-slate-500">Editorial + SEO + structure (not a grammar checker).</p>
              {allWriterSuggestions.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">Looking good — no major automated flags.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-slate-700">
                  {allWriterSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Originality &amp; plagiarism</h2>
              <p className="mt-2 text-xs text-slate-600">
                <strong>Server scan</strong> runs on your backend — repetition &amp; vocabulary signals only (no web crawl, no third-party).
                For matching against the public web, use an external tool below.
              </p>
              <button
                type="button"
                onClick={() => void runBackendPlagiarismScan()}
                disabled={plagiarismScanning}
                className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {plagiarismScanning ? 'Scanning on server…' : 'Scan draft (server)'}
              </button>
              {plagiarismError && (
                <p className="mt-2 text-xs text-red-700">{plagiarismError}</p>
              )}
              {plagiarismResult && (
                <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-800">Originality score</span>
                    <span className="text-2xl font-bold text-indigo-700">{plagiarismResult.originalityScore}</span>
                  </div>
                  <p className="text-slate-600">
                    Words {plagiarismResult.wordCount} · Sentences {plagiarismResult.sentenceCount} · Lexical diversity{' '}
                    {plagiarismResult.lexicalDiversity}
                  </p>
                  {plagiarismResult.signals.length > 0 && (
                    <ul className="list-disc space-y-1 pl-4 text-amber-900">
                      {plagiarismResult.signals.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  {plagiarismResult.duplicateSamples.length > 0 && (
                    <div>
                      <p className="font-medium text-slate-700">Duplicate sentences (server)</p>
                      <ul className="mt-1 max-h-20 space-y-1 overflow-y-auto italic text-slate-600">
                        {plagiarismResult.duplicateSamples.slice(0, 4).map((d, i) => (
                          <li key={i}>
                            ×{d.occurrences} {d.snippet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {plagiarismResult.repeatedFiveGrams && plagiarismResult.repeatedFiveGrams.length > 0 && (
                    <div className="border-t border-slate-200 pt-2">
                      <p className="font-medium text-slate-700">Repeated 5-word phrases</p>
                      <p className="mt-0.5 text-slate-500">
                        These are highlighted in <strong>Preview</strong> (amber) when the toggle is on. Matches stay inside one HTML text block
                        (won&apos;t span e.g. bold across elements).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewHighlightRepeats(true)
                          setPreviewOpen(true)
                        }}
                        className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-800 hover:bg-indigo-100"
                      >
                        Open preview with highlights
                      </button>
                      <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto font-mono text-[11px] leading-snug text-slate-800">
                        {plagiarismResult.repeatedFiveGrams.map((g, i) => (
                          <li key={i}>
                            <span className="text-slate-500">×{g.count}</span> {g.phrase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="border-t border-slate-200 pt-2 text-slate-500">{plagiarismResult.disclaimer}</p>
                </div>
              )}
              <button
                type="button"
                onClick={copyPlainTextForExternalCheck}
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Copy body text for external check
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Suggested tools (your policy may vary):{' '}
                <a href="https://www.copyscape.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  Copyscape
                </a>
                {' · '}
                <a href="https://quetext.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  Quetext
                </a>
              </p>
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-950">
                <strong>In-draft repeats:</strong>{' '}
                {repeatedSentenceGroups.length === 0
                  ? 'No duplicate sentences detected in this draft.'
                  : `${repeatedSentenceGroups.length} sentence(s) appear more than once — review for accidental copy-paste.`}
              </div>
              {repeatedSentenceGroups.length > 0 && (
                <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-xs text-slate-600">
                  {repeatedSentenceGroups.slice(0, 5).map((r, i) => (
                    <li key={i} className="italic">
                      ×{r.count} {r.snippet}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Link-worthiness</h2>
              <p className="mb-3 text-xs text-slate-600">Tick what applies — editors often know context Quill cannot see.</p>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={hasOriginalData} onChange={(e) => setHasOriginalData(e.target.checked)} />
                <span>Original data, research, or first-hand reporting</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={hasDownloadableAsset} onChange={(e) => setHasDownloadableAsset(e.target.checked)} />
                <span>Downloadable asset (checklist, template, PDF, etc.)</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={hasInternalLinksDeclared} onChange={(e) => setHasInternalLinksDeclared(e.target.checked)} />
                <span>Internal links to related guides or product pages</span>
              </label>
              {linkWorthyWarnings.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 border-t border-slate-100 pt-3 pl-4 text-xs text-amber-800">
                  {linkWorthyWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Post preview"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative my-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-800">Reader preview</span>
              <div className="flex flex-wrap items-center gap-3">
                {plagiarismResult && (plagiarismResult.repeatedFiveGrams?.length ?? 0) > 0 && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={previewHighlightRepeats}
                      onChange={(e) => setPreviewHighlightRepeats(e.target.checked)}
                    />
                    Highlight repeated phrases (amber)
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {featuredImageUrl.trim() && (
                <img
                  src={featuredImageUrl.trim()}
                  alt=""
                  className="mb-6 max-h-64 w-full rounded-lg object-cover"
                />
              )}
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title || 'Untitled'}</h1>
              <p className="mt-2 text-sm text-slate-500">{metaDescription || 'No meta description'}</p>
              <div
                className="blog-preview-content mt-8 max-w-none text-slate-800 [&_a]:text-indigo-600 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_mark]:rounded [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify (+ optional mark from scan)
                dangerouslySetInnerHTML={{ __html: previewArticleHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogEditor
