/**
 * BlogEditor — blog form with live word count, checklist, SEO score, and keyword table (same tick of React as your typing).
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
import type Quill from 'quill'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import { BlogService, type BlogPlagiarismAnalysis } from '../../services/api/blog.service'
import { UploadService } from '../../services/api/upload.service'
import { useToast } from '../ui'
import { useAppConfirm } from '../providers/AppDialogsProvider'
import type { BlogPostSeo, BlogPostStatus } from '../../types/cms.types'
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
import {
  BLOG_IMAGE_MAX_FILE_BYTES,
  BLOG_IMAGE_RECOMMENDED_MAX_BYTES,
  BLOG_TITLE_SOFT_MAX_CHARS,
  H1_TARGET_COUNT,
  H2_SOFT_MAX_COUNT,
  H3_SOFT_MAX_COUNT,
  H456_SOFT_MAX_COUNT,
  HEADING_RULES_MIN_WORDS,
  LONGFORM_MIN_WORDS_FOR_SUBHEADINGS,
  LONG_PARAGRAPH_MAX_ALLOWED,
  LONG_PARAGRAPH_WORD_THRESHOLD,
  META_DESC_HARD_MAX_CHARS,
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  PILLAR_WORD_TARGET,
  SEO_TITLE_HARD_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
  SERP_SNIPPET_PREVIEW_CHARS,
  SERP_TITLE_PREVIEW_CHARS,
  computeBlogSeoScore,
  isMetaDescriptionOptimalBand,
  isSeoTitleOptimalBand,
  suggestedMinSectionHeadings,
} from './blog-seo-guidelines'
import {
  defaultLeadMagnetSettings,
  buildBlogStructuredAppendixHtml,
  buildBlogRichResultsJsonLdPreview,
  buildFaqJsonLdString,
} from './blog-lead-magnet-utils'
import {
  READABILITY_LONG_SENTENCE_WORDS,
  highlightReadabilityIssuesInHtml,
} from './highlightReadabilityInHtml'
import { highlightRepeatPhrasesInHtml } from './highlightRepeatPhrases'
import {
  BLOG_BODY_PURIFY_ATTR,
  BLOG_BODY_PURIFY_TAGS,
  sanitizeBlogBodyHtml,
} from './blog-body-html'
import { registerQuillTableFormats } from './register-quill-table'

registerQuillTableFormats()

type FaqEditorRow = { id: string; question: string; answer: string }

type ProductOption = {
  id: string
  name: string
  slug?: string
}

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

/**
 * Flesch is driven mainly by average sentence length and syllables per word — these edits move the number fastest.
 */
function fleschImprovementHints(score: number): string[] {
  if (!Number.isFinite(score) || score <= 0) return []
  const tips: string[] = []
  if (score < 35) {
    tips.push(
      'Your copy reads as very dense. For a general homeowner audience, replace jargon with plain language and define unavoidable technical terms once near first use.',
    )
  }
  tips.push(
    'Shorten sentences: break chains joined by “which”, “that”, and semicolons. Aim for many sentences under ~18–20 words — average sentence length is the largest lever in the score.',
  )
  tips.push(
    'Choose shorter, everyday words when the meaning stays the same (the formula counts syllables per word).',
  )
  tips.push('Prefer active voice (“We repair AC units”) over passive (“AC units are repaired by us”).')
  tips.push('Split long paragraphs so each block is one idea; pair with H2/H3 subheads so scanners can skip to what they need.')
  tips.push('Turn dense steps into numbered or bulleted lists — one short line per step reads faster than one long paragraph.')
  if (score < 45) {
    tips.push(
      'Read the opening aloud: if you gasp mid-sentence, split it. Fixing the first 200 words often lifts the whole score.',
    )
  }
  return tips
}

/** Traffic-light style for on-page SEO score (editorial heuristic, not a Google metric). */
function seoScorePresentation(score: number): { label: string; bar: string; text: string } {
  const s = Math.min(100, Math.max(0, Math.round(score)))
  if (s >= 80) return { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-700' }
  if (s >= 50) return { label: 'Needs polish', bar: 'bg-amber-500', text: 'text-amber-700' }
  return { label: 'Weak', bar: 'bg-red-500', text: 'text-red-700' }
}

// --- Parse Quill HTML for structure metrics ----------------------------------

interface ParsedContentStats {
  wordCount: number
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  h6: number
  imageCount: number
  imagesMissingAlt: number
  internalLinkCount: number
  externalLinkCount: number
  plainText: string
}

function parseContentHtml(html: string, internalHosts: string[]): ParsedContentStats {
  const empty: ParsedContentStats = {
    wordCount: 0,
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
    imageCount: 0,
    imagesMissingAlt: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    plainText: '',
  }
  if (!html || !html.trim()) return empty

  const safe = sanitizeBlogBodyHtml(html)

  const doc = new DOMParser().parseFromString(safe, 'text/html')
  const body = doc.body

  const h1 = body.querySelectorAll('h1').length
  const h2 = body.querySelectorAll('h2').length
  const h3 = body.querySelectorAll('h3').length
  const h4 = body.querySelectorAll('h4').length
  const h5 = body.querySelectorAll('h5').length
  const h6 = body.querySelectorAll('h6').length
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
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    imageCount: imgs.length,
    imagesMissingAlt,
    internalLinkCount: internal,
    externalLinkCount: external,
    plainText,
  }
}

// --- Quill formats (toolbar modules built in BlogEditor with Cloudinary handlers) ---

const QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'blockquote',
  'code-block',
  'link',
  'image',
  'video',
  'table',
]

/** Folder for in-article uploads + library picker (same as other CMS image fields). */
const BLOG_BODY_CLOUDINARY_FOLDER = 'homeservice'
const CLOUDINARY_LIBRARY_LIMIT = 80
function formatImageSizeCap(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

// --- Component ---------------------------------------------------------------

export interface BlogEditorProps {
  /** When set, loads the post and updates via PUT; otherwise creates via POST. */
  postId?: string | null
  onCancel?: () => void
  onSaved?: () => void
}

export function BlogEditor({ postId = null, onCancel, onSaved }: BlogEditorProps) {
  const { toast } = useToast()
  const confirm = useAppConfirm()
  /** Set from Quill toolbar handlers (ReactQuill may not forward ref). */
  const quillEditorRef = useRef<Quill | null>(null)
  /** Preserve index when file/Cloudinary dialogs steal focus from the editor. */
  const quillInsertIndexRef = useRef(0)
  const [cloudinaryPickerOpen, setCloudinaryPickerOpen] = useState(false)
  /** What the Cloudinary library dialog applies to when an image is chosen. */
  const [cloudinaryPickerFor, setCloudinaryPickerFor] = useState<'editor' | 'featured' | null>(null)
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string }>>([])
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false)
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null)
  const [bodyImageAltDialogOpen, setBodyImageAltDialogOpen] = useState(false)
  const [pendingBodyImageUrl, setPendingBodyImageUrl] = useState<string | null>(null)
  const [bodyImageAltDraft, setBodyImageAltDraft] = useState('')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [blogCanonicalUrl, setBlogCanonicalUrl] = useState('')
  const [blogOgTitle, setBlogOgTitle] = useState('')
  const [blogOgType, setBlogOgType] = useState('article')
  const [blogTwitterCard, setBlogTwitterCard] = useState<'summary' | 'summary_large_image'>('summary_large_image')
  const [blogRobotsMeta, setBlogRobotsMeta] = useState('')
  /**
   * Explicit "Allow search engines to index this post" toggle. Mirrors the
   * consumer-site `blogQualityGate` (`post.index !== false`). Defaults to true
   * so existing drafts stay indexable; flip to false for thin or evergreen-
   * legal drafts (we sync `seo.robots` to "noindex, nofollow" in the payload).
   */
  const [blogAllowIndexing, setBlogAllowIndexing] = useState(true)
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredImageAlt, setFeaturedImageAlt] = useState('')
  const [featuredUploading, setFeaturedUploading] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [cmsCategories, setCmsCategories] = useState<{ _id: string; name: string }[]>([])
  const [tagsInput, setTagsInput] = useState('')
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([])
  const [relatedProductSearch, setRelatedProductSearch] = useState('')
  const [relatedProductOptions, setRelatedProductOptions] = useState<ProductOption[]>([])
  const [relatedProductLoading, setRelatedProductLoading] = useState(false)
  const [linkedProductNames, setLinkedProductNames] = useState<Record<string, string>>({})
  const [relatedServiceIds, setRelatedServiceIds] = useState<string[]>([])
  const [relatedServiceSearch, setRelatedServiceSearch] = useState('')
  const [relatedServiceOptions, setRelatedServiceOptions] = useState<ProductOption[]>([])
  const [relatedServiceLoading, setRelatedServiceLoading] = useState(false)
  const [linkedServiceNames, setLinkedServiceNames] = useState<Record<string, string>>({})
  type EditorWorkspaceTab = 'basics' | 'content' | 'faq'
  const [editorWorkspaceTab, setEditorWorkspaceTab] = useState<EditorWorkspaceTab>('basics')
  const [linkPickerQuery, setLinkPickerQuery] = useState('')
  const [linkPickerLoading, setLinkPickerLoading] = useState(false)
  const [linkPickerResults, setLinkPickerResults] = useState<{
    products: { _id: string; name: string; slug?: string }[]
    services: { _id: string; name: string; slug?: string }[]
  }>({ products: [], services: [] })
  const [contentHtml, setContentHtml] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('pillar topic')
  const [secondaryKeywordsInput, setSecondaryKeywordsInput] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [plagiarismScanning, setPlagiarismScanning] = useState(false)
  const [plagiarismResult, setPlagiarismResult] = useState<BlogPlagiarismAnalysis | null>(null)
  const [plagiarismError, setPlagiarismError] = useState<string | null>(null)
  /** In preview: wrap server-reported 5-gram repeats in <mark> */
  const [previewHighlightRepeats, setPreviewHighlightRepeats] = useState(true)
  /** In preview + sidebar: long sentences & dense blocks (Flesch coaching) */
  const [previewHighlightReadability, setPreviewHighlightReadability] = useState(true)
  const [siteHost, setSiteHost] = useState('') // e.g. "example.com" for internal link detection
  const [status, setStatus] = useState<BlogPostStatus>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [scheduledLocal, setScheduledLocal] = useState('') // datetime-local value
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')

  const [hasOriginalData, setHasOriginalData] = useState(false)
  const [hasDownloadableAsset, setHasDownloadableAsset] = useState(false)
  const [hasInternalLinksDeclared, setHasInternalLinksDeclared] = useState(false)

  const [faqRows, setFaqRows] = useState<FaqEditorRow[]>([])
  const [leadMagnet, setLeadMagnet] = useState(defaultLeadMagnetSettings)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  /** Viewport position for a small “toolbar above” hint next to the caret (fixed px). */
  const [editorCaretHint, setEditorCaretHint] = useState<{ top: number; left: number } | null>(null)
  const [importHtmlOpen, setImportHtmlOpen] = useState(false)
  const [importHtmlDraft, setImportHtmlDraft] = useState('')
  const [importHtmlStripStyles, setImportHtmlStripStyles] = useState(false)
  /** ReactQuill instance — used for clipboard patch + import HTML. */
  const reactQuillRef = useRef<InstanceType<typeof ReactQuill> | null>(null)

  const onTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      if (!slugTouched) setSlug(slugify(value))
    },
    [slugTouched],
  )

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

  // Related products: lightweight search against catalog
  useEffect(() => {
    const q = relatedProductSearch.trim()
    const controller = new AbortController()

    const run = async () => {
      try {
        setRelatedProductLoading(true)
        const token = localStorage.getItem('token')
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
        const url = `${base}/products?${new URLSearchParams({
          page: '1',
          limit: '10',
          ...(q ? { search: q } : {}),
        }).toString()}`
        const res = await fetch(url, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        })
        const json = await res.json()
        const items = (json?.data?.products || json?.products || []) as any[]
        setRelatedProductOptions(
          items.map((p) => ({
            id: String(p.id || p._id),
            name: String(p.name || 'Unnamed product'),
            slug: p.slug ? String(p.slug) : undefined,
          })),
        )
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setRelatedProductOptions([])
      } finally {
        setRelatedProductLoading(false)
      }
    }

    const t = window.setTimeout(() => void run(), 350)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [relatedProductSearch])

  // Related platform services (bookable catalog) for stored cross-links
  useEffect(() => {
    const q = relatedServiceSearch.trim()
    const controller = new AbortController()

    const run = async () => {
      try {
        setRelatedServiceLoading(true)
        const token = localStorage.getItem('token')
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
        const url = `${base}/platform-services?${new URLSearchParams({
          page: '1',
          limit: '12',
          ...(q ? { search: q } : {}),
        }).toString()}`
        const res = await fetch(url, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        })
        const json = await res.json()
        const data = json?.data ?? json
        const items = (data?.services ?? []) as any[]
        setRelatedServiceOptions(
          items.map((s) => ({
            id: String(s.id ?? s._id),
            name: String(s.display_name ?? s.displayName ?? s.name ?? 'Service'),
            slug: s.slug ? String(s.slug) : undefined,
          })),
        )
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setRelatedServiceOptions([])
      } finally {
        setRelatedServiceLoading(false)
      }
    }

    const t = window.setTimeout(() => void run(), 350)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [relatedServiceSearch])

  // Content tab: debounced combined catalog search (CMS admin endpoint)
  useEffect(() => {
    const q = linkPickerQuery.trim()
    let cancelled = false
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          setLinkPickerLoading(true)
          const res = await BlogService.getBlogLinkSuggestions(q, 14)
          if (cancelled) return
          setLinkPickerResults(res)
        } catch {
          if (!cancelled) setLinkPickerResults({ products: [], services: [] })
        } finally {
          if (!cancelled) setLinkPickerLoading(false)
        }
      })()
    }, 320)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [linkPickerQuery])

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
        const ext = post.seo as BlogPostSeo | undefined
        setBlogCanonicalUrl(ext?.canonicalUrl?.trim() ?? '')
        setBlogOgTitle(ext?.ogTitle?.trim() ?? '')
        setBlogOgType(ext?.ogType?.trim() || 'article')
        setBlogTwitterCard(
          ext?.twitterCard === 'summary' || ext?.twitterCard === 'summary_large_image'
            ? ext.twitterCard
            : 'summary_large_image',
        )
        setBlogRobotsMeta(ext?.robots?.trim() ?? '')
        // Hydrate index toggle from top-level `index`, fall back to `seo.index`,
        // then to parsing `seo.robots` (legacy posts only had the robots string).
        const indexFromTop = post.index
        const indexFromSeo = ext?.index
        const robotsLower = (ext?.robots ?? '').toLowerCase()
        const inferredFromRobots = !robotsLower.includes('noindex')
        setBlogAllowIndexing(
          typeof indexFromTop === 'boolean'
            ? indexFromTop
            : typeof indexFromSeo === 'boolean'
              ? indexFromSeo
              : inferredFromRobots,
        )
        setFeaturedImageUrl(post.featuredImage ?? '')
        setFeaturedImageAlt(post.featuredImageAlt?.trim() ?? '')
        setCategoryId(
          typeof post.category === 'object' && post.category?._id ? post.category._id : '',
        )
        setTagsInput((post.tags ?? []).join(', '))
        const rp = post.relatedProducts ?? []
        setRelatedProductIds(rp.map((p) => p._id).filter(Boolean))
        const pm: Record<string, string> = {}
        rp.forEach((p) => {
          if (p._id) pm[p._id] = p.name
        })
        setLinkedProductNames(pm)
        const rs = post.relatedServices ?? []
        setRelatedServiceIds(rs.map((s) => s._id).filter(Boolean))
        const sm: Record<string, string> = {}
        rs.forEach((s) => {
          if (s._id) sm[s._id] = s.name
        })
        setLinkedServiceNames(sm)
        setContentHtml(sanitizeBlogBodyHtml(post.content ?? ''))
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
        const faqLoaded = post.faqItems ?? []
        setFaqRows(
          faqLoaded.map((f, i) => ({
            id: `loaded-${i}`,
            question: f.question ?? '',
            answer: f.answer ?? '',
          })),
        )
        setLeadMagnet(
          post.leadMagnet
            ? {
                ...defaultLeadMagnetSettings(),
                headline: post.leadMagnet.headline ?? defaultLeadMagnetSettings().headline,
                subtext: post.leadMagnet.subtext ?? defaultLeadMagnetSettings().subtext,
                buttonLabel: post.leadMagnet.buttonLabel ?? defaultLeadMagnetSettings().buttonLabel,
                formActionUrl: post.leadMagnet.formActionUrl ?? '',
                sourceTag: post.leadMagnet.sourceTag ?? defaultLeadMagnetSettings().sourceTag,
                enabled: Boolean(post.leadMagnet.enabled),
              }
            : defaultLeadMagnetSettings(),
        )
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

  const quillModules = useMemo(
    () => ({
      table: true,
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'cloudinary', 'video', 'insertTable', 'importHtml'],
          ['clean'],
        ],
        handlers: {
          importHtml: function (this: { quill: Quill }) {
            quillEditorRef.current = this.quill
            setImportHtmlOpen(true)
          },
          insertTable: function (this: { quill: Quill }) {
            quillEditorRef.current = this.quill
            const mod = this.quill.getModule('table') as { insertTable?: (rows: number, cols: number) => void }
            if (!mod?.insertTable) {
              toast({
                title: 'Table tool unavailable',
                description: 'Refresh the page and try again.',
                variant: 'destructive',
              })
              return
            }
            mod.insertTable(3, 3)
          },
          image: function (this: { quill: Quill }) {
            quillEditorRef.current = this.quill
            const sel = this.quill.getSelection(true)
            const len = this.quill.getLength()
            quillInsertIndexRef.current = sel?.index ?? Math.max(0, len - 1)
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            input.click()
            input.onchange = async () => {
              const file = input.files?.[0]
              if (!file) return
              if (file.size > BLOG_IMAGE_MAX_FILE_BYTES) {
                toast({
                  title: 'Image too large',
                  description: `Max ${formatImageSizeCap(BLOG_IMAGE_MAX_FILE_BYTES)} per upload. Compress first (aim under ${formatImageSizeCap(BLOG_IMAGE_RECOMMENDED_MAX_BYTES)}).`,
                  variant: 'destructive',
                })
                return
              }
              try {
                const { url } = await UploadService.uploadImage(file, BLOG_BODY_CLOUDINARY_FOLDER)
                setPendingBodyImageUrl(url)
                setBodyImageAltDraft('')
                setBodyImageAltDialogOpen(true)
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Upload failed'
                toast({ title: 'Upload failed', description: msg, variant: 'destructive' })
              }
            }
          },
          cloudinary: function (this: { quill: Quill }) {
            quillEditorRef.current = this.quill
            const sel = this.quill.getSelection(true)
            const len = this.quill.getLength()
            quillInsertIndexRef.current = sel?.index ?? Math.max(0, len - 1)
            setCloudinaryPickerFor('editor')
            setCloudinaryPickerOpen(true)
          },
        },
      },
      clipboard: { matchVisual: false },
    }),
    [toast],
  )

  /** Sanitize pasted HTML before Quill converts it (Word/Docs + raw markup). */
  useEffect(() => {
    let restore: (() => void) | undefined
    const timer = window.setTimeout(() => {
      const rq = reactQuillRef.current
      if (!rq) return
      const quill = rq.getEditor()
      const clipboard = quill.getModule('clipboard') as {
        convert: (arg: { html?: string; text?: string }, formats?: object) => unknown
      }
      const originalConvert = clipboard.convert.bind(clipboard)
      clipboard.convert = (arg, formats) => {
        const next = { ...arg }
        if (typeof next.html === 'string' && next.html.length > 0) {
          next.html = sanitizeBlogBodyHtml(next.html)
        }
        return originalConvert(next, formats)
      }
      restore = () => {
        clipboard.convert = originalConvert
      }
    }, 0)
    return () => {
      window.clearTimeout(timer)
      restore?.()
    }
  }, [])

  const applyImportHtmlAtCursor = useCallback(() => {
    const quill = reactQuillRef.current?.getEditor() ?? quillEditorRef.current
    if (!quill) {
      toast({ title: 'Editor unavailable', description: 'Try again in a moment.', variant: 'destructive' })
      return
    }
    const raw = importHtmlDraft.trim()
    if (!raw) {
      toast({ title: 'Nothing to import', description: 'Paste HTML in the box first.', variant: 'destructive' })
      return
    }
    const clean = sanitizeBlogBodyHtml(raw, { stripInlineStyles: importHtmlStripStyles })
    const range = quill.getSelection(true)
    const idx = range?.index ?? Math.max(0, quill.getLength() - 1)
    quill.clipboard.dangerouslyPasteHTML(idx, clean, 'user')
    setImportHtmlOpen(false)
    setImportHtmlDraft('')
    toast({ title: 'HTML inserted', description: 'Sanitized and converted for the editor.' })
  }, [importHtmlDraft, importHtmlStripStyles, toast])

  const applyImportHtmlReplaceAll = useCallback(async () => {
    const quill = reactQuillRef.current?.getEditor() ?? quillEditorRef.current
    if (!quill) {
      toast({ title: 'Editor unavailable', description: 'Try again in a moment.', variant: 'destructive' })
      return
    }
    const raw = importHtmlDraft.trim()
    if (!raw) {
      toast({ title: 'Nothing to import', description: 'Paste HTML in the box first.', variant: 'destructive' })
      return
    }
    const ok = await confirm({
      title: 'Replace entire article body?',
      message:
        'Replace the entire article body with this HTML? This cannot be undone except by reverting the draft.',
      danger: true,
      confirmLabel: 'Replace',
    })
    if (!ok) return
    const clean = sanitizeBlogBodyHtml(raw, { stripInlineStyles: importHtmlStripStyles })
    const delta = quill.clipboard.convert({ html: clean, text: '' })
    quill.setContents(delta, 'user')
    setImportHtmlOpen(false)
    setImportHtmlDraft('')
    toast({ title: 'Body replaced', description: 'Sanitized HTML is now the article content.' })
  }, [importHtmlDraft, importHtmlStripStyles, toast, confirm])

  const closeImportHtml = useCallback(() => {
    setImportHtmlOpen(false)
    setImportHtmlDraft('')
    setImportHtmlStripStyles(false)
  }, [])

  useEffect(() => {
    if (!importHtmlOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImportHtml()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [importHtmlOpen, closeImportHtml])

  const closeCloudinaryPicker = useCallback(() => {
    setCloudinaryPickerOpen(false)
    setCloudinaryPickerFor(null)
  }, [])

  const handleCloudinaryLibraryPick = useCallback(
    (url: string) => {
      if (cloudinaryPickerFor === 'featured') {
        setFeaturedImageUrl(url)
        closeCloudinaryPicker()
        return
      }
      setPendingBodyImageUrl(url)
      setBodyImageAltDraft('')
      setBodyImageAltDialogOpen(true)
      closeCloudinaryPicker()
    },
    [cloudinaryPickerFor, closeCloudinaryPicker],
  )

  const confirmBodyImageAlt = useCallback(() => {
    const url = pendingBodyImageUrl
    const alt = bodyImageAltDraft.trim()
    if (!url) {
      setBodyImageAltDialogOpen(false)
      return
    }
    if (!alt) {
      toast({
        title: 'Alt text required',
        description: 'Describe the image for screen readers and SEO.',
        variant: 'destructive',
      })
      return
    }
    const editor = quillEditorRef.current
    if (!editor) {
      toast({ title: 'Editor unavailable', description: 'Click in the article body and try again.', variant: 'destructive' })
      return
    }
    const idx = quillInsertIndexRef.current
    editor.insertEmbed(idx, 'image', url, 'user')
    editor.formatText(idx, 1, { alt }, 'user')
    editor.setSelection(idx + 1, 0)
    setBodyImageAltDialogOpen(false)
    setPendingBodyImageUrl(null)
    setBodyImageAltDraft('')
    toast({ title: 'Image inserted', description: 'Alt text is saved with this image.' })
  }, [pendingBodyImageUrl, bodyImageAltDraft, toast])

  const cancelBodyImageAlt = useCallback(() => {
    setBodyImageAltDialogOpen(false)
    setPendingBodyImageUrl(null)
    setBodyImageAltDraft('')
  }, [])

  useEffect(() => {
    if (!bodyImageAltDialogOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelBodyImageAlt()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bodyImageAltDialogOpen, cancelBodyImageAlt])

  useEffect(() => {
    if (!cloudinaryPickerOpen) return
    let cancelled = false
    setCloudinaryLoading(true)
    setCloudinaryError(null)
    void UploadService.listImages(BLOG_BODY_CLOUDINARY_FOLDER, CLOUDINARY_LIBRARY_LIMIT)
      .then((images) => {
        if (!cancelled) {
          setCloudinaryImages(images.map((img) => ({ url: img.url, publicId: img.publicId })))
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setCloudinaryError(e instanceof Error ? e.message : 'Failed to load images')
          setCloudinaryImages([])
        }
      })
      .finally(() => {
        if (!cancelled) setCloudinaryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cloudinaryPickerOpen])

  /** Parsed article body (structure, links, images, plain text) — always matches current editor HTML. */
  const liveContentStats = useMemo(
    () => parseContentHtml(contentHtml, internalHosts),
    [contentHtml, internalHosts],
  )
  const liveWordCount = liveContentStats.wordCount

  const readingTimeMinutes = useMemo(() => {
    const wpm = 200
    return Math.max(1, Math.ceil(liveWordCount / wpm))
  }, [liveWordCount])

  const fre = useMemo(() => fleschReadingEase(liveContentStats.plainText), [liveContentStats.plainText])

  const seo = useMemo(
    () =>
      computeBlogSeoScore({
        displayTitle: title,
        seoTitle,
        meta: metaDescription,
        keyword: primaryKeyword,
        plainFromHtml: liveContentStats.plainText,
        countPhraseOccurrences,
      }),
    [title, seoTitle, metaDescription, primaryKeyword, liveContentStats.plainText],
  )

  const seoPresentation = useMemo(() => seoScorePresentation(seo.score), [seo.score])

  const effectiveSeoTitle = seoTitle.trim() || title.trim()
  const seoTitleLen = seoTitle.length
  const metaLen = metaDescription.length
  const titleLen = title.length
  const blogTitleWordCount = title.trim() ? title.trim().split(/\s+/).filter(Boolean).length : 0

  const publicSiteOrigin = (process.env.REACT_APP_PUBLIC_SITE_ORIGIN || 'https://www.profixer.in/blog').replace(
    /\/$/,
    '',
  )
  const computedPublicPageUrl = useMemo(() => {
    const pathSlug = (slug.trim() || slugify(title)).replace(/^\/+/, '')
    const path = pathSlug ? `/blog/${pathSlug}` : '/blog/…'
    return `${publicSiteOrigin}${path}`
  }, [slug, title, publicSiteOrigin])

  const serpPreview = useMemo(() => {
    const canonicalTrim = blogCanonicalUrl.trim()
    const url = /^https?:\/\//i.test(canonicalTrim) ? canonicalTrim : computedPublicPageUrl
    const rawTitle = effectiveSeoTitle.trim() || title.trim()
    const titleShown =
      rawTitle.length === 0
        ? 'Add a title — it appears in search results'
        : rawTitle.length <= SERP_TITLE_PREVIEW_CHARS
          ? rawTitle
          : `${rawTitle.slice(0, SERP_TITLE_PREVIEW_CHARS - 1)}…`
    const rawSnip = metaDescription.replace(/\s+/g, ' ').trim()
    const snipShown =
      rawSnip.length === 0
        ? 'Add a meta description — Google often shows it as the snippet under the blue title.'
        : rawSnip.length <= SERP_SNIPPET_PREVIEW_CHARS
          ? rawSnip
          : `${rawSnip.slice(0, SERP_SNIPPET_PREVIEW_CHARS - 1)}…`
    const tabRaw = effectiveSeoTitle.trim() || title.trim()
    const tabTitleShown =
      tabRaw.length === 0 ? '…' : tabRaw.length <= 58 ? tabRaw : `${tabRaw.slice(0, 56)}…`

    return {
      url,
      titleShown,
      snipShown,
      tabTitleShown,
      titleCharCount: rawTitle.length,
      snippetCharCount: rawSnip.length,
    }
  }, [slug, title, effectiveSeoTitle, metaDescription, publicSiteOrigin, blogCanonicalUrl, computedPublicPageUrl])

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  )

  const featuredPresent = Boolean(featuredImageUrl.trim())

  const keywordPhraseList = useMemo(() => {
    const primary = primaryKeyword.trim()
    const secondary = secondaryKeywordsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const merged = primary ? [primary, ...secondary] : secondary
    return merged.slice(0, 12)
  }, [primaryKeyword, secondaryKeywordsInput])

  const keywordRows = useMemo(() => {
    const serp = seoTitle.trim() || title.trim()
    return keywordMetricsForPhrases(
      keywordPhraseList,
      liveContentStats.plainText,
      title,
      serp,
      metaDescription,
      liveWordCount,
    )
  }, [keywordPhraseList, liveContentStats.plainText, title, seoTitle, metaDescription, liveWordCount])

  const repeatedSentenceGroups = useMemo(
    () => findRepeatedSentences(liveContentStats.plainText),
    [liveContentStats.plainText],
  )
  const longParagraphCount = useMemo(
    () => countLongParagraphs(contentHtml, LONG_PARAGRAPH_WORD_THRESHOLD),
    [contentHtml],
  )

  const linkWorthyWarnings: string[] = []
  if (!hasOriginalData) linkWorthyWarnings.push('No original data / research indicated.')
  if (!hasDownloadableAsset) linkWorthyWarnings.push('No downloadable asset (template, PDF, etc.) indicated.')
  if (!hasInternalLinksDeclared) linkWorthyWarnings.push('Editor has not confirmed internal links to related content.')
  if (liveContentStats.internalLinkCount === 0 && liveContentStats.plainText.length > 200) {
    linkWorthyWarnings.push('No internal links detected in HTML (add links to your site where relevant).')
  }

  const checklist = useMemo(() => {
    const serp = seoTitle.trim() || title.trim()
    const kw = primaryKeyword.trim().toLowerCase()
    const faqPairs = faqRows.filter((r) => r.question.trim() && r.answer.trim()).length
    const canonicalTrim = blogCanonicalUrl.trim()
    const canonicalHttpsOk = !canonicalTrim || /^https:\/\//i.test(canonicalTrim)
    const keywordInTitle =
      !kw ||
      serp.toLowerCase().includes(kw) ||
      title.toLowerCase().includes(kw)
    const primaryRow = keywordRows[0]
    const primaryNatural =
      !primaryKeyword.trim() ||
      (primaryRow != null && primaryRow.densityPercent <= 2.5 && primaryRow.count <= 18)
    const secondaryList = secondaryKeywordsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const secondaryCountOk =
      secondaryList.length <= 10 && (secondaryList.length === 0 || secondaryList.length >= 3)

    const minSections = suggestedMinSectionHeadings(liveWordCount)
    const sectionHeadingsOk =
      liveWordCount < LONGFORM_MIN_WORDS_FOR_SUBHEADINGS ||
      liveContentStats.h2 + liveContentStats.h3 >= minSections
    const h1Ok =
      liveWordCount < HEADING_RULES_MIN_WORDS || liveContentStats.h1 === H1_TARGET_COUNT
    const headingCapsOk =
      liveContentStats.h2 <= H2_SOFT_MAX_COUNT &&
      liveContentStats.h3 <= H3_SOFT_MAX_COUNT &&
      liveContentStats.h4 + liveContentStats.h5 + liveContentStats.h6 <= H456_SOFT_MAX_COUNT

    const items: { id: string; label: string; ok: boolean }[] = [
      {
        id: 't',
        label: `SEO / SERP title in optimal band ${SEO_TITLE_MIN_CHARS}–${SEO_TITLE_OPTIMAL_MAX_CHARS} chars (hard max ${SEO_TITLE_HARD_MAX_CHARS}; blog title if SEO title empty)`,
        ok: serp.length > 0 && isSeoTitleOptimalBand(serp.length),
      },
      {
        id: 'bt',
        label: `Blog title ≤ ${BLOG_TITLE_SOFT_MAX_CHARS} chars (on-page / template H1 elsewhere)`,
        ok: title.trim().length > 0 && title.trim().length <= BLOG_TITLE_SOFT_MAX_CHARS,
      },
      {
        id: 'm',
        label: `Meta description in optimal band ${META_DESC_MIN_CHARS}–${META_DESC_OPTIMAL_MAX_CHARS} chars (hard max ${META_DESC_HARD_MAX_CHARS})`,
        ok: metaLen > 0 && isMetaDescriptionOptimalBand(metaLen),
      },
      {
        id: 'canon',
        label: 'Canonical URL: optional; if set, use absolute HTTPS (avoids mixed signals vs slug changes)',
        ok: canonicalHttpsOk,
      },
      {
        id: 'faqschema',
        label: 'FAQ JSON-LD: 0 or ≥2 complete Q&A pairs (single pair is usually skipped for FAQ rich results)',
        ok: faqPairs === 0 || faqPairs >= 2,
      },
      { id: 'w', label: `Word count ≥ ${PILLAR_WORD_TARGET} (pillar target, live)`, ok: liveWordCount >= PILLAR_WORD_TARGET },
      {
        id: 'h1',
        label: `Exactly ${H1_TARGET_COUNT} H1 in article body (when ≥ ${HEADING_RULES_MIN_WORDS} words)`,
        ok: h1Ok,
      },
      {
        id: 'hsec',
        label:
          liveWordCount >= LONGFORM_MIN_WORDS_FOR_SUBHEADINGS
            ? `H2+H3 sections ≥ ${minSections} for this length (~1 per ~380 words)`
            : `H2+H3 sections (need ≥ ${minSections} when ≥ ${LONGFORM_MIN_WORDS_FOR_SUBHEADINGS} words)`,
        ok: sectionHeadingsOk,
      },
      {
        id: 'hcap',
        label: `Heading caps: H2 ≤ ${H2_SOFT_MAX_COUNT}, H3 ≤ ${H3_SOFT_MAX_COUNT}, H4–H6 total ≤ ${H456_SOFT_MAX_COUNT}`,
        ok: headingCapsOk,
      },
      {
        id: 'p',
        label: `Paragraphs: ≤ ${LONG_PARAGRAPH_MAX_ALLOWED} blocks over ${LONG_PARAGRAPH_WORD_THRESHOLD} words (mobile scanability)`,
        ok: longParagraphCount <= LONG_PARAGRAPH_MAX_ALLOWED,
      },
      { id: 'i', label: 'Featured image (URL, upload, or Cloudinary)', ok: featuredPresent },
      {
        id: 'ifa',
        label: 'Featured image alt text (required when a hero image is set)',
        ok: !featuredPresent || featuredImageAlt.trim().length > 0,
      },
      { id: 'k', label: 'Primary keyword in SEO or blog title', ok: keywordInTitle },
      {
        id: 'kn',
        label: 'Primary keyword looks natural in body (not stuffed; ~≤2.5% density)',
        ok: primaryNatural,
      },
      {
        id: 'ks',
        label: 'Secondary keywords: optional; if listed, use 3–10 phrases (max 10)',
        ok: secondaryCountOk,
      },
      { id: 'l', label: 'Link-worthiness checkboxes (data, asset, internal)', ok: hasOriginalData && hasDownloadableAsset && hasInternalLinksDeclared },
      { id: 'r', label: 'Readability: Flesch ≥ 45 (adjust for audience)', ok: fre >= 45 },
      {
        id: 'a',
        label: 'All images have alt text (when images exist)',
        ok: liveContentStats.imageCount === 0 || liveContentStats.imagesMissingAlt === 0,
      },
    ]
    const done = items.filter((i) => i.ok).length
    return { items, done, total: items.length, pct: Math.round((done / items.length) * 100) }
  }, [
    title,
    seoTitle,
    metaLen,
    liveWordCount,
    liveContentStats.h1,
    liveContentStats.h2,
    liveContentStats.h3,
    liveContentStats.h4,
    liveContentStats.h5,
    liveContentStats.h6,
    liveContentStats.imageCount,
    liveContentStats.imagesMissingAlt,
    longParagraphCount,
    featuredPresent,
    featuredImageAlt,
    primaryKeyword,
    hasOriginalData,
    hasDownloadableAsset,
    hasInternalLinksDeclared,
    fre,
    keywordRows,
    secondaryKeywordsInput,
    faqRows,
    blogCanonicalUrl,
  ])

  /** One headline %: checklist, SEO, content/readability; adds scan originality when a run exists. */
  const overallCompletion = useMemo(() => {
    const wordProgress =
      liveWordCount <= 0 ? 0 : Math.min(100, Math.round((liveWordCount / PILLAR_WORD_TARGET) * 100))
    const freOk = Number.isFinite(fre) && fre > 0
    const readProgress =
      liveWordCount <= 0 ? 0 : !freOk ? 0 : fre >= 45 ? 100 : Math.min(100, Math.round((fre / 45) * 100))
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
  }, [checklist.pct, seo.score, liveWordCount, fre, plagiarismResult])

  const writerSuggestions = useMemo(
    () =>
      buildWriterSuggestions({
        wordCount: liveWordCount,
        h2: liveContentStats.h2,
        h3: liveContentStats.h3,
        fre,
        longParagraphs: longParagraphCount,
        repeatedSentences: repeatedSentenceGroups.length,
        internalLinks: liveContentStats.internalLinkCount,
      }),
    [
      liveWordCount,
      liveContentStats.h2,
      liveContentStats.h3,
      liveContentStats.internalLinkCount,
      fre,
      longParagraphCount,
      repeatedSentenceGroups.length,
    ],
  )

  /** Extra nudges for natural copy (not duplicate of SEO hints when possible). */
  const naturalKeywordHints = useMemo(() => {
    const h: string[] = []
    const pk = primaryKeyword.trim()
    const row = keywordRows[0]
    if (pk && row) {
      if (row.densityPercent > 2.5) {
        h.push(
          `Primary phrase is ~${row.densityPercent}% of words — Google’s helpful-content signals favor natural language; cut repeats and use “also called…” or related terms.`,
        )
      } else if (row.densityPercent > 1.8 && liveWordCount > 600) {
        h.push('Primary keyword shows up often — if any paragraph feels written for robots, rewrite for a human reader.')
      }
      if (row.count > 18) {
        h.push('Very high repetition of the exact primary phrase — vary wording; one clear topic per post is enough.')
      }
    }
    const secondaryList = secondaryKeywordsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (secondaryList.length > 10) {
      h.push('Many secondaries — market practice is ~3–8 tight related phrases (synonyms, questions, subtopics), not a long keyword list.')
    }
    return h
  }, [primaryKeyword, secondaryKeywordsInput, keywordRows, liveWordCount])

  const faqItemsResolved = useMemo(
    () =>
      faqRows
        .map((r) => ({ question: r.question.trim(), answer: r.answer.trim() }))
        .filter((r) => r.question && r.answer),
    [faqRows],
  )

  const structuredBlockPurifyConfig = useMemo(
    () => ({
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_TAGS: [
        ...BLOG_BODY_PURIFY_TAGS,
        'mark',
        'section',
        'dl',
        'dt',
        'dd',
        'details',
        'summary',
        'div',
        'form',
        'label',
        'input',
        'button',
      ],
      ALLOWED_ATTR: [
        ...BLOG_BODY_PURIFY_ATTR,
        'id',
        'for',
        'type',
        'name',
        'value',
        'method',
        'action',
        'autocomplete',
        'required',
        'aria-labelledby',
        'aria-label',
        'role',
        'open',
        'target',
        'rel',
      ],
    }),
    [],
  )

  const previewStructuredAppendix = useMemo(
    () =>
      DOMPurify.sanitize(
        buildBlogStructuredAppendixHtml(faqItemsResolved, leadMagnet),
        structuredBlockPurifyConfig,
      ),
    [faqItemsResolved, leadMagnet, structuredBlockPurifyConfig],
  )

  const previewFaqJsonLd = useMemo(() => buildFaqJsonLdString(faqItemsResolved), [faqItemsResolved])

  const previewRichResultsJsonLd = useMemo(
    () =>
      buildBlogRichResultsJsonLdPreview({
        headline: title.trim() || 'Untitled',
        description: (metaDescription.trim() || title.trim()).slice(0, 500),
        pageUrl: serpPreview.url,
        imageUrl: featuredImageUrl.trim() || undefined,
        faqItems: faqItemsResolved,
      }),
    [title, metaDescription, serpPreview.url, featuredImageUrl, faqItemsResolved],
  )

  const previewPurifyConfig = useMemo(
    () => ({
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_TAGS: [...BLOG_BODY_PURIFY_TAGS, 'mark'],
      ALLOWED_ATTR: [...BLOG_BODY_PURIFY_ATTR, 'target', 'rel'],
    }),
    [],
  )

  const readabilityCoachActive =
    liveWordCount > 0 && Number.isFinite(fre) && fre > 0 && fre < 60

  const readabilityLivePreviewHtml = useMemo(() => {
    if (!readabilityCoachActive || !previewHighlightReadability) return ''
    const base = DOMPurify.sanitize(contentHtml, previewPurifyConfig)
    try {
      return DOMPurify.sanitize(
        highlightReadabilityIssuesInHtml(base, { maxWordsPerSentence: READABILITY_LONG_SENTENCE_WORDS }),
        previewPurifyConfig,
      )
    } catch {
      return ''
    }
  }, [contentHtml, previewPurifyConfig, readabilityCoachActive, previewHighlightReadability])

  const previewArticleHtml = useMemo(() => {
    const base = DOMPurify.sanitize(contentHtml, previewPurifyConfig)
    const grams = plagiarismResult?.repeatedFiveGrams
    let inner = base
    if (previewHighlightRepeats && grams?.length) {
      try {
        inner = DOMPurify.sanitize(
          highlightRepeatPhrasesInHtml(
            base,
            grams.map((g) => g.phrase),
          ),
          previewPurifyConfig,
        )
      } catch {
        inner = base
      }
    }
    if (readabilityCoachActive && previewHighlightReadability) {
      try {
        inner = DOMPurify.sanitize(
          highlightReadabilityIssuesInHtml(inner, { maxWordsPerSentence: READABILITY_LONG_SENTENCE_WORDS }),
          previewPurifyConfig,
        )
      } catch {
        /* keep inner */
      }
    }
    if (!previewStructuredAppendix) return inner
    return `${inner}<div class="mt-8 border-t border-slate-200 pt-6">${previewStructuredAppendix}</div>`
  }, [
    contentHtml,
    previewPurifyConfig,
    plagiarismResult,
    previewHighlightRepeats,
    previewHighlightReadability,
    previewStructuredAppendix,
    readabilityCoachActive,
  ])

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
    const text = liveContentStats.plainText
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
    const safeBody = sanitizeBlogBodyHtml(contentHtml)
    const appendixSafe = DOMPurify.sanitize(
      buildBlogStructuredAppendixHtml(faqItemsResolved, leadMagnet),
      structuredBlockPurifyConfig,
    )
    const html = buildExportHtmlDocument(
      title,
      effectiveSeoTitle,
      metaDescription,
      safeBody,
      featuredImageUrl.trim(),
      {
        appendixHtml: appendixSafe || undefined,
        faqJsonLd: previewFaqJsonLd,
        featuredImageAlt: featuredImageAlt.trim(),
      },
    )
    downloadTextFile(`${exportSlugBase}.html`, html, 'text/html;charset=utf-8')
    toast({ title: 'Exported', description: `${exportSlugBase}.html downloaded` })
  }

  const handlePrintPdf = () => {
    const safeBody = sanitizeBlogBodyHtml(contentHtml)
    const appendixSafe = DOMPurify.sanitize(
      buildBlogStructuredAppendixHtml(faqItemsResolved, leadMagnet),
      structuredBlockPurifyConfig,
    )
    const docHtml = buildExportHtmlDocument(
      title,
      effectiveSeoTitle,
      metaDescription,
      safeBody,
      featuredImageUrl.trim(),
      {
        appendixHtml: appendixSafe || undefined,
        faqJsonLd: previewFaqJsonLd,
        featuredImageAlt: featuredImageAlt.trim(),
      },
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

  const handleFeaturedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const input = e.target
    if (!file) return
    if (file.size > BLOG_IMAGE_MAX_FILE_BYTES) {
      toast({
        title: 'Image too large',
        description: `Max ${formatImageSizeCap(BLOG_IMAGE_MAX_FILE_BYTES)} for featured images. Compress to ~${formatImageSizeCap(BLOG_IMAGE_RECOMMENDED_MAX_BYTES)} or less for faster LCP.`,
        variant: 'destructive',
      })
      input.value = ''
      return
    }
    setFeaturedUploading(true)
    try {
      const { url } = await UploadService.uploadImage(file, BLOG_BODY_CLOUDINARY_FOLDER)
      setFeaturedImageUrl(url)
      toast({ title: 'Featured image uploaded', description: 'Stored on Cloudinary.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' })
    } finally {
      setFeaturedUploading(false)
      input.value = ''
    }
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
    const mustEnforceImageAlt =
      effectiveStatus === 'published' || effectiveStatus === 'scheduled'
    if (mustEnforceImageAlt) {
      const imgStats = parseContentHtml(contentHtml, internalHosts)
      if (imgStats.imageCount > 0 && imgStats.imagesMissingAlt > 0) {
        toast({
          title: 'Images need alt text',
          description: `${imgStats.imagesMissingAlt} image(s) in the article are missing non-empty alt text. Fix them in the editor, then publish or schedule.`,
          variant: 'destructive',
        })
        return
      }
      if (trimmedUrl && !featuredImageAlt.trim()) {
        toast({
          title: 'Featured image',
          description: 'Add alt text for the featured image before publishing or scheduling.',
          variant: 'destructive',
        })
        return
      }
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
      const safeContent = sanitizeBlogBodyHtml(contentHtml)
      const excerpt = metaDescription.trim().slice(0, 300)
      const tagList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      const kw = primaryKeyword.trim()
      const scheduledPublishAt =
        effectiveStatus === 'scheduled' && scheduledLocal
          ? new Date(scheduledLocal).toISOString()
          : undefined

      // Reconcile the explicit `index` toggle with the freeform `robots`
      // field. The toggle is the source of truth; we synthesize a `robots`
      // string when the editor left it blank so legacy consumers without
      // explicit-index awareness still respect the editor's intent.
      const robotsTrimmed = blogRobotsMeta.trim()
      const robotsLower = robotsTrimmed.toLowerCase()
      const robotsResolved = blogAllowIndexing
        ? // When indexable, only emit robots if editor explicitly wrote something
          // that isn't a `noindex` (we never want to send "index, noindex" garbage).
          robotsTrimmed && !robotsLower.includes('noindex')
          ? robotsTrimmed
          : undefined
        : // When de-indexing, force noindex,nofollow if the editor didn't already write it.
          robotsTrimmed && robotsLower.includes('noindex')
          ? robotsTrimmed
          : 'noindex, nofollow'

      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        excerpt,
        content: safeContent,
        category: categoryId || undefined,
        tags: tagList,
        status: effectiveStatus,
        isFeatured,
        allowComments,
        index: blogAllowIndexing,
        relatedProductIds,
        relatedServiceIds,
        featuredImage: trimmedUrl || undefined,
        featuredImageAlt: featuredImageAlt.trim() || undefined,
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
          ...(blogCanonicalUrl.trim() ? { canonicalUrl: blogCanonicalUrl.trim() } : {}),
          ...(blogOgTitle.trim() ? { ogTitle: blogOgTitle.trim() } : {}),
          ...(blogOgType.trim() ? { ogType: blogOgType.trim() } : {}),
          ...(blogTwitterCard ? { twitterCard: blogTwitterCard } : {}),
          ...(robotsResolved ? { robots: robotsResolved } : {}),
          index: blogAllowIndexing,
        },
        faqItems: faqItemsResolved,
        leadMagnet: {
          enabled: leadMagnet.enabled,
          headline: leadMagnet.headline.trim(),
          subtext: leadMagnet.subtext.trim(),
          buttonLabel: leadMagnet.buttonLabel.trim(),
          formActionUrl: leadMagnet.formActionUrl.trim(),
          sourceTag: leadMagnet.sourceTag.trim(),
        },
      }

      if (postId) {
        await BlogService.updatePost(postId, payload)
      } else {
        await BlogService.createPost(payload)
      }
      if (safeContent !== contentHtml) {
        setContentHtml(safeContent)
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

  const insertInternalLinkAtCaret = useCallback(
    (kind: 'product' | 'service', item: { name: string; slug?: string }) => {
      const quill = reactQuillRef.current?.getEditor() ?? quillEditorRef.current
      if (!quill) {
        toast({
          title: 'Editor not ready',
          description: 'Open the Content tab and click inside the article body, then insert again.',
          variant: 'destructive',
        })
        return
      }
      const slug = (item.slug || '').trim() || 'item'
      const href =
        kind === 'product'
          ? `/store/product/${encodeURIComponent(slug)}`
          : `/services/${encodeURIComponent(slug)}`
      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const label = (item.name || slug).trim()
      const html = `<a href="${esc(href)}" rel="noopener noreferrer">${esc(label)}</a>`
      const sel = quill.getSelection(true)
      const index = sel ? sel.index : Math.max(0, quill.getLength() - 1)
      quill.focus()
      quill.clipboard.dangerouslyPasteHTML(index, html, 'user')
      toast({ title: 'Link inserted', description: label })
    },
    [toast],
  )

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/90 text-slate-900">
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
              <p className="text-sm text-slate-600">
                Editorial workspace for <strong className="font-medium text-slate-800">my.profixer.in</strong> — live SEO score, technical metadata,
                structured data preview, and checklist aligned with how modern content teams ship URLs, snippets, and rich results.
              </p>
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

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="flex min-w-0 flex-col gap-3">
            <div
              className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1 shadow-sm"
              role="tablist"
              aria-label="Blog editor sections"
            >
              {(
                [
                  { id: 'basics' as const, label: 'Basics & SEO' },
                  { id: 'content' as const, label: 'Content & internal links' },
                  { id: 'faq' as const, label: 'FAQ & lead magnet' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={editorWorkspaceTab === tab.id}
                  onClick={() => setEditorWorkspaceTab(tab.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    editorWorkspaceTab === tab.id
                      ? 'bg-white text-indigo-900 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          <div className="space-y-6 rounded-xl border border-slate-200/90 bg-white p-6 shadow-md ring-1 ring-slate-100">
            <div className={editorWorkspaceTab !== 'basics' ? 'hidden' : 'space-y-6'}>
            <div className="rounded-lg border border-indigo-200/80 bg-gradient-to-r from-indigo-50/95 to-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-indigo-950">Industry publishing — ProFixer blog</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Primary URL preview defaults to <strong className="text-slate-800">https://www.profixer.in/blog</strong> (override with{' '}
                <code className="rounded bg-white px-1 font-mono text-[11px]">REACT_APP_PUBLIC_SITE_ORIGIN</code>). Extra{' '}
                <code className="rounded bg-white px-1 font-mono text-[11px]">seo.*</code> keys are safe to store; backends that do not persist them yet
                can ignore unknown fields.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Blog title</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="How to …"
                maxLength={BLOG_TITLE_SOFT_MAX_CHARS}
                aria-describedby="blog-title-stats"
              />
              <div
                id="blog-title-stats"
                className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:items-start sm:justify-between"
              >
                <span>
                  On-page headline (often the template H1). Aim for a tight phrase; many sites keep titles under ~{BLOG_TITLE_SOFT_MAX_CHARS}{' '}
                  characters and roughly <strong className="font-medium text-slate-600">6–12 words</strong> for readability in SERPs and social
                  cards.
                </span>
                <span className="shrink-0 tabular-nums text-slate-700">
                  <span className="font-medium">{blogTitleWordCount}</span> {blogTitleWordCount === 1 ? 'word' : 'words'}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {titleLen} / {BLOG_TITLE_SOFT_MAX_CHARS} chars
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">SEO title (optional)</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Leave blank to use the blog title in search results"
                maxLength={SEO_TITLE_HARD_MAX_CHARS}
              />
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:justify-between">
                <span>
                  &lt;title&gt; / SERP: industry band ~{SEO_TITLE_MIN_CHARS}–{SEO_TITLE_OPTIMAL_MAX_CHARS} chars (max {SEO_TITLE_HARD_MAX_CHARS}).
                </span>
                <span className="shrink-0 tabular-nums">
                  {seoTitleLen > 0 ? `${seoTitleLen}` : `→ ${effectiveSeoTitle.length}`} / {SEO_TITLE_HARD_MAX_CHARS}
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
                maxLength={META_DESC_HARD_MAX_CHARS}
                placeholder="Search result snippet…"
              />
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:justify-between">
                <span>
                  Google often shows ~{META_DESC_MIN_CHARS}–{META_DESC_OPTIMAL_MAX_CHARS} characters — put the hook in the first sentence.
                </span>
                <span className="shrink-0 tabular-nums">
                  {metaLen} / {META_DESC_HARD_MAX_CHARS}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/90 p-5 shadow-sm ring-1 ring-indigo-100/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-indigo-950">Technical SEO &amp; social metadata</h2>
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-slate-600">
                    Maps to extended <code className="rounded bg-white px-1 font-mono text-[11px]">seo</code> on the post. Your consumer app should emit{' '}
                    <code className="font-mono text-[11px]">link rel=&quot;canonical&quot;</code>, <code className="font-mono text-[11px]">meta name=&quot;robots&quot;</code>,{' '}
                    <code className="font-mono text-[11px]">og:*</code> / <code className="font-mono text-[11px]">twitter:*</code>, and JSON-LD from the same
                    document — that is how you avoid title/snippet/schema drift (a common enterprise audit finding).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBlogCanonicalUrl(computedPublicPageUrl)}
                  className="shrink-0 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800 shadow-sm hover:bg-indigo-50"
                >
                  Fill canonical from preview URL
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Canonical URL (optional)</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={blogCanonicalUrl}
                    onChange={(e) => setBlogCanonicalUrl(e.target.value)}
                    placeholder={`${publicSiteOrigin}/blog/your-slug`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Prefer HTTPS absolute URLs on the host you want indexed.</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Open Graph title override</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={blogOgTitle}
                    onChange={(e) => setBlogOgTitle(e.target.value)}
                    placeholder="Leave blank → SEO title / blog title"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Open Graph type</label>
                  <select
                    value={blogOgType}
                    onChange={(e) => setBlogOgType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="article">article</option>
                    <option value="website">website</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Twitter / X card</label>
                  <select
                    value={blogTwitterCard}
                    onChange={(e) => setBlogTwitterCard(e.target.value as 'summary' | 'summary_large_image')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="summary_large_image">summary_large_image (recommended with hero)</option>
                    <option value="summary">summary</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Allow search engines to index</label>
                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={blogAllowIndexing}
                        onChange={(e) => {
                          const next = e.target.checked
                          setBlogAllowIndexing(next)
                          // Keep the freeform robots field in step with the toggle so
                          // editors see consistent UI. Editors can still override later.
                          if (next) {
                            if (blogRobotsMeta.toLowerCase().includes('noindex')) {
                              setBlogRobotsMeta('')
                            }
                          } else {
                            setBlogRobotsMeta('noindex, nofollow')
                          }
                        }}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {blogAllowIndexing ? 'Indexable (included in /sitemaps/blog.xml)' : 'Hidden from search engines'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Maps to the consumer-site <code className="font-mono">blogQualityGate</code>:
                    when off, the post is excluded from the blog sitemap even if published.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Robots meta override (optional)</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={blogRobotsMeta}
                    onChange={(e) => setBlogRobotsMeta(e.target.value)}
                    placeholder="index, follow"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Advanced: write a custom directive (e.g. <code className="font-mono">noindex, follow</code> or{' '}
                    <code className="font-mono">max-snippet:-1, max-image-preview:large</code>). Leave empty to let the
                    toggle above drive the meta tag.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-800">Featured image</p>
              <p className="mb-3 text-xs text-slate-600">
                Upload limit {formatImageSizeCap(BLOG_IMAGE_MAX_FILE_BYTES)} per file (industry: compress heroes to ~{formatImageSizeCap(BLOG_IMAGE_RECOMMENDED_MAX_BYTES)} or less for Core Web Vitals / LCP).
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Image URL</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={featuredImageUrl}
                    onChange={(e) => setFeaturedImageUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Upload to Cloudinary</label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFeaturedFile} />
                  <button
                    type="button"
                    disabled={featuredUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {featuredUploading ? 'Uploading…' : 'Choose file…'}
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">From library</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCloudinaryPickerFor('featured')
                      setCloudinaryPickerOpen(true)
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                  >
                    Choose from Cloudinary
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-slate-800">
                  Featured image alt text
                  {featuredPresent && <span className="font-normal text-red-600"> *</span>}
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Describe the image for accessibility and SEO"
                  aria-required={featuredPresent}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Required when you publish or schedule and a featured image is set. Body images get alt text when you insert them.
                </p>
              </div>
            </div>
            {featuredImageUrl.trim() && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img
                  src={featuredImageUrl.trim()}
                  alt={featuredImageAlt.trim() || 'Featured image preview'}
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
              <label className="mb-1 block text-sm font-medium">Related products</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={relatedProductSearch}
                  onChange={(e) => setRelatedProductSearch(e.target.value)}
                  placeholder="Search products to link…"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
                  onClick={() => setRelatedProductSearch('')}
                >
                  Clear
                </button>
              </div>

              {relatedProductLoading && (
                <p className="mt-1 text-xs text-slate-500">Searching…</p>
              )}

              {relatedProductOptions.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                  {relatedProductOptions.map((p) => {
                    const selected = relatedProductIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          selected ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => {
                          setRelatedProductIds((prev) =>
                            selected ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                          )
                          setLinkedProductNames((prev) => {
                            if (selected) {
                              const { [p.id]: _, ...rest } = prev
                              return rest
                            }
                            return { ...prev, [p.id]: p.name }
                          })
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {selected ? 'Linked' : 'Link'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {relatedProductIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedProductIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs"
                    >
                      <span className="font-medium text-slate-700">{linkedProductNames[id] || id}</span>
                      <button
                        type="button"
                        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => {
                          setRelatedProductIds((prev) => prev.filter((x) => x !== id))
                          setLinkedProductNames((prev) => {
                            const { [id]: _, ...rest } = prev
                            return rest
                          })
                        }}
                        aria-label="Remove related product"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-1 text-xs text-slate-500">
                These are stored on the post and can be used to render “Related products” blocks on the public blog / product pages.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Related platform services</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={relatedServiceSearch}
                  onChange={(e) => setRelatedServiceSearch(e.target.value)}
                  placeholder="Search bookable services to link…"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
                  onClick={() => setRelatedServiceSearch('')}
                >
                  Clear
                </button>
              </div>
              {relatedServiceLoading && <p className="mt-1 text-xs text-slate-500">Searching…</p>}
              {relatedServiceOptions.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                  {relatedServiceOptions.map((s) => {
                    const selected = relatedServiceIds.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          selected ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => {
                          setRelatedServiceIds((prev) =>
                            selected ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                          )
                          setLinkedServiceNames((prev) => {
                            if (selected) {
                              const { [s.id]: _, ...rest } = prev
                              return rest
                            }
                            return { ...prev, [s.id]: s.name }
                          })
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{selected ? 'Linked' : 'Link'}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {relatedServiceIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedServiceIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs"
                    >
                      <span className="font-medium text-slate-700">{linkedServiceNames[id] || id}</span>
                      <button
                        type="button"
                        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => {
                          setRelatedServiceIds((prev) => prev.filter((x) => x !== id))
                          setLinkedServiceNames((prev) => {
                            const { [id]: _, ...rest } = prev
                            return rest
                          })
                        }}
                        aria-label="Remove related service"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Stored as <code className="rounded bg-white px-1 text-[11px]">relatedServices</code> for “Related services” modules and topical clustering with the catalog.
              </p>
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
                list. Saved with tags into SEO keywords; coverage table matches the live editor.
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
            </div>

            <div className={editorWorkspaceTab !== 'faq' ? 'hidden' : ''}>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h3 className="text-sm font-semibold text-slate-800">FAQ schema &amp; lead magnet</h3>
              <p className="mt-1 text-xs text-slate-600">
                Saved as <code className="rounded bg-white px-1 text-[11px]">faqItems</code> and{' '}
                <code className="rounded bg-white px-1 text-[11px]">leadMagnet</code> on the post. The consumer site should inject FAQ JSON‑LD in{' '}
                <code className="text-[11px]">&lt;head&gt;</code> and render the same Q&amp;A + form below the article. Preview shows the appendix and a
                copyable JSON‑LD block.
              </p>

              <div className="mt-3 space-y-3">
                {faqRows.map((row, idx) => (
                  <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">FAQ {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setFaqRows((rows) => rows.filter((r) => r.id !== row.id))}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="mb-1 block text-xs text-slate-600">Question</label>
                    <input
                      className="mb-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      value={row.question}
                      onChange={(e) =>
                        setFaqRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, question: e.target.value } : r)),
                        )
                      }
                      placeholder="e.g. What is included in the free guide?"
                    />
                    <label className="mb-1 block text-xs text-slate-600">Answer</label>
                    <textarea
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      rows={2}
                      value={row.answer}
                      onChange={(e) =>
                        setFaqRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, answer: e.target.value } : r)),
                        )
                      }
                      placeholder="Short answer shown on the page and in schema."
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFaqRows((rows) => [
                      ...rows,
                      {
                        id:
                          typeof crypto !== 'undefined' && 'randomUUID' in crypto
                            ? crypto.randomUUID()
                            : `faq-${Date.now()}`,
                        question: '',
                        answer: '',
                      },
                    ])
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Add FAQ
                </button>
              </div>

              <div className="mt-4 space-y-3 border-t border-indigo-100 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={leadMagnet.enabled}
                    onChange={(e) => setLeadMagnet((m) => ({ ...m, enabled: e.target.checked }))}
                  />
                  Enable lead magnet form
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-slate-600">Headline</label>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      value={leadMagnet.headline}
                      onChange={(e) => setLeadMagnet((m) => ({ ...m, headline: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-slate-600">Subtext</label>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      value={leadMagnet.subtext}
                      onChange={(e) => setLeadMagnet((m) => ({ ...m, subtext: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Button label</label>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      value={leadMagnet.buttonLabel}
                      onChange={(e) => setLeadMagnet((m) => ({ ...m, buttonLabel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Form action URL (POST)</label>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      value={leadMagnet.formActionUrl}
                      onChange={(e) => setLeadMagnet((m) => ({ ...m, formActionUrl: e.target.value }))}
                      placeholder="https://yoursite.com/api/leads"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-slate-600">Hidden field source</label>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      value={leadMagnet.sourceTag}
                      onChange={(e) => setLeadMagnet((m) => ({ ...m, sourceTag: e.target.value }))}
                      placeholder="blog-lead-magnet"
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className={editorWorkspaceTab !== 'content' ? 'hidden' : 'space-y-5'}>
            <section className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm ring-1 ring-emerald-100/60">
              <h3 className="text-sm font-semibold text-emerald-950">Insert internal links</h3>
              <p className="mt-1 text-xs text-slate-600">
                Combined search via <code className="rounded bg-white px-1 font-mono text-[11px]">GET /api/cms/admin/blogs/link-suggestions</code>. Inserts at the caret using <span className="font-mono text-[11px]">/store/product/&lt;slug&gt;</span> (storefront PDP on my.profixer.in) and <span className="font-mono text-[11px]">/services/&lt;slug&gt;</span> for services. Legacy <span className="font-mono text-[11px]">/products/&lt;slug&gt;</span> URLs redirect to the store on the consumer app.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={linkPickerQuery}
                  onChange={(e) => setLinkPickerQuery(e.target.value)}
                  placeholder="Search products & services…"
                  aria-label="Search catalog for internal links"
                />
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
                  onClick={() => setLinkPickerQuery('')}
                >
                  Clear
                </button>
              </div>
              {linkPickerLoading ? (
                <p className="mt-2 text-xs text-slate-500">Searching catalog…</p>
              ) : null}
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Products</p>
                  <ul className="mt-1 max-h-52 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white p-1 text-sm">
                    {linkPickerResults.products.length === 0 ? (
                      <li className="px-2 py-2 text-xs text-slate-500">No matches — try another query.</li>
                    ) : (
                      linkPickerResults.products.map((p) => (
                        <li key={p._id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{p.name}</span>
                          <button
                            type="button"
                            className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            onClick={() => insertInternalLinkAtCaret('product', p)}
                          >
                            Insert
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform services</p>
                  <ul className="mt-1 max-h-52 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white p-1 text-sm">
                    {linkPickerResults.services.length === 0 ? (
                      <li className="px-2 py-2 text-xs text-slate-500">No matches — try another query.</li>
                    ) : (
                      linkPickerResults.services.map((s) => (
                        <li key={s._id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{s.name}</span>
                          <button
                            type="button"
                            className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            onClick={() => insertInternalLinkAtCaret('service', s)}
                          >
                            Insert
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <div>
              <label className="mb-1 block text-sm font-medium">Content</label>
              <p className="mb-2 text-xs text-slate-500">
                Use one H1 in the body, then H2/H3 for sections (avoid skipping levels). The rich-text toolbar stays pinned at the top of the editor while you scroll — use it for headings, lists, links, images, and tables. Paste or import HTML from the toolbar (HTML markup button): content is sanitized (allowlisted tags) and converted for the editor. Images: upload max {formatImageSizeCap(BLOG_IMAGE_MAX_FILE_BYTES)} per file (compress to ~{formatImageSizeCap(BLOG_IMAGE_RECOMMENDED_MAX_BYTES)} when possible). Alt text is required on insert; publish/schedule also requires featured-image alt.{' '}
                <strong className="text-slate-700">Draft canvas</strong> uses a larger, readable type size here only; body copy on the public site follows your consumer theme. Inline “small” styles from pasted HTML are preserved; image max-height here is display-only.
              </p>
              <div className="blog-quill relative min-h-[min(72vh,720px)] rounded-lg border border-slate-300 [&_.ql-container]:min-h-[min(68vh,640px)] [&_.ql-editor]:min-h-[min(62vh,560px)] [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
                <style>{`
                  /* Comfortable drafting — does not rewrite saved HTML (Quill default ~13px feels tiny). */
                  .blog-quill .ql-container.ql-snow {
                    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 1.0625rem;
                    line-height: 1.65;
                  }
                  .blog-quill .ql-editor {
                    font-size: 1.0625rem;
                    line-height: 1.65;
                  }
                  .blog-quill .ql-editor h1 {
                    font-size: 1.875rem;
                    line-height: 1.25;
                    font-weight: 700;
                    margin: 1rem 0 0.5rem;
                  }
                  .blog-quill .ql-editor h2 {
                    font-size: 1.5rem;
                    line-height: 1.3;
                    font-weight: 700;
                    margin: 0.9rem 0 0.45rem;
                  }
                  .blog-quill .ql-editor h3 {
                    font-size: 1.25rem;
                    line-height: 1.35;
                    font-weight: 600;
                    margin: 0.75rem 0 0.4rem;
                  }
                  .blog-quill .ql-editor p,
                  .blog-quill .ql-editor li {
                    font-size: 1.0625rem;
                  }
                  .blog-quill .ql-editor p {
                    margin: 0.5rem 0;
                  }
                  .blog-quill .ql-toolbar.ql-snow {
                    position: sticky;
                    top: 0;
                    z-index: 25;
                    background: #f8fafc;
                    border-bottom: 1px solid #cbd5e1;
                  }
                  .blog-quill .ql-toolbar button.ql-cloudinary::before {
                    content: '☁';
                    font-size: 1.05rem;
                    line-height: 0;
                  }
                  .blog-quill .ql-toolbar button.ql-insertTable::before {
                    content: '▦';
                    font-size: 1rem;
                    line-height: 0;
                  }
                  .blog-quill .ql-toolbar button.ql-importHtml::before {
                    content: '</>';
                    font-size: 0.65rem;
                    font-weight: 700;
                    font-family: ui-monospace, monospace;
                    line-height: 0;
                  }
                  .blog-quill .ql-editor table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 0.75rem 0;
                  }
                  .blog-quill .ql-editor td,
                  .blog-quill .ql-editor th {
                    border: 1px solid #cbd5e1;
                    padding: 0.5rem 0.6rem;
                    min-width: 3rem;
                    vertical-align: top;
                  }
                  .blog-quill .ql-editor th {
                    background: #f1f5f9;
                    font-weight: 600;
                  }
                  /* Keep body images readable: override Cloudinary / pasted width×height */
                  .blog-quill .ql-editor img {
                    max-width: 100% !important;
                    width: auto !important;
                    height: auto !important;
                    max-height: min(52vh, 480px) !important;
                    object-fit: contain;
                    display: block;
                    margin: 0.75rem auto;
                    border-radius: 0.5rem;
                  }
                `}</style>
                <ReactQuill
                  ref={reactQuillRef}
                  theme="snow"
                  value={contentHtml}
                  onChange={setContentHtml}
                  onChangeSelection={(range, _source, editor) => {
                    if (!range || range.length > 0) {
                      setEditorCaretHint(null)
                      return
                    }
                    const b = editor.getBounds(range.index)
                    if (!b || typeof b.top !== 'number' || typeof b.left !== 'number') {
                      setEditorCaretHint(null)
                      return
                    }
                    setEditorCaretHint({ top: b.top, left: b.left })
                  }}
                  modules={quillModules}
                  formats={QUILL_FORMATS}
                  placeholder="Write pillar content…"
                />
                {editorCaretHint && (
                  <div
                    className="pointer-events-none fixed z-[60] max-w-[10.5rem] rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] leading-tight text-slate-600 shadow-md"
                    style={{
                      top: Math.max(6, editorCaretHint.top - 36),
                      left: Math.min(editorCaretHint.left, typeof window !== 'undefined' ? window.innerWidth - 140 : editorCaretHint.left),
                    }}
                    aria-hidden
                  >
                    ↑ Rich-text toolbar (sticky)
                  </div>
                )}
              </div>
              <div
                className={`mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  liveWordCount >= PILLAR_WORD_TARGET
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : 'border-amber-200 bg-amber-50/70'
                }`}
                aria-live="polite"
              >
                <span className="font-medium text-slate-700">Words (live)</span>
                <span className="tabular-nums">
                  <span className={liveWordCount >= PILLAR_WORD_TARGET ? 'text-lg font-bold text-emerald-800' : 'text-lg font-bold text-slate-900'}>
                    {liveWordCount.toLocaleString()}
                  </span>
                  <span className="text-slate-500"> / {PILLAR_WORD_TARGET.toLocaleString()}</span>
                </span>
                {liveWordCount < PILLAR_WORD_TARGET ? (
                  <span className="w-full text-xs font-medium text-amber-900 sm:w-auto sm:text-right">
                    {Math.max(0, PILLAR_WORD_TARGET - liveWordCount).toLocaleString()} words below pillar minimum — keep writing.
                  </span>
                ) : (
                  <span className="w-full text-xs font-medium text-emerald-800 sm:w-auto sm:text-right">Minimum length met.</span>
                )}
              </div>
            </div>
            </div>
          </div>
          </div>

          {/* Right column: workflow order (checklist → SEO → content → coach) */}
          <aside
            className="flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:self-start lg:overscroll-contain lg:pr-0.5"
            aria-label="SEO and content analysis"
          >
            <div className="shrink-0 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/95 to-white p-4 shadow-sm ring-1 ring-slate-100/80">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Live overview</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Word count, heuristic SEO score, checklist, and Flesch — same tick as the editor.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-white/95 px-2.5 py-2 shadow-sm">
                  <p className="text-[10px] font-medium text-slate-500">Words</p>
                  <p
                    className={`mt-0.5 text-base font-bold tabular-nums leading-tight ${liveWordCount >= PILLAR_WORD_TARGET ? 'text-emerald-700' : 'text-slate-900'}`}
                  >
                    {liveWordCount.toLocaleString()}
                    <span className="block text-[10px] font-normal text-slate-400">goal {PILLAR_WORD_TARGET.toLocaleString()}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-white/95 px-2.5 py-2 shadow-sm">
                  <p className="text-[10px] font-medium text-slate-500">SEO score</p>
                  <p className={`mt-0.5 text-base font-bold tabular-nums leading-tight ${seoPresentation.text}`}>{seo.score}</p>
                  <p className="text-[10px] text-slate-400">{seoPresentation.label}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-white/95 px-2.5 py-2 shadow-sm">
                  <p className="text-[10px] font-medium text-slate-500">Checklist</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums leading-tight text-indigo-700">{checklist.pct}%</p>
                  <p className="text-[10px] text-slate-400">
                    {checklist.done}/{checklist.total} OK
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-white/95 px-2.5 py-2 shadow-sm">
                  <p className="text-[10px] font-medium text-slate-500">Flesch</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums leading-tight text-slate-900">{liveWordCount ? fre : '—'}</p>
                  <p className="text-[10px] text-slate-400">{liveWordCount ? (fre >= 45 ? 'On target' : 'Lift score') : '—'}</p>
                </div>
              </div>
            </div>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pre-publish checklist</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    checklist.done === checklist.total ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {checklist.total - checklist.done} open
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${checklist.pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  {checklist.done}/{checklist.total}
                </span>{' '}
                passed · live fields + body · SEO title &amp; meta need optimal length for a green check.
              </p>
              <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums" aria-hidden>
                      {item.ok ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">○</span>}
                    </span>
                    <span className={item.ok ? 'text-slate-700' : 'text-slate-500'}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">SEO &amp; SERP</p>

            <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Search result preview</h2>
                <span className="text-[10px] text-slate-500">
                  ~{serpPreview.titleCharCount} · ~{serpPreview.snippetCharCount} chars
                </span>
              </div>
              <p className="mb-3 text-[11px] leading-snug text-slate-500">
                Google-style listing (desktop). Default origin is <strong className="font-medium text-slate-700">https://www.profixer.in/blog</strong>; override with{' '}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-slate-700">
                  REACT_APP_PUBLIC_SITE_ORIGIN
                </code>{' '}
                in <code className="rounded bg-white px-1 font-mono text-[10px]">.env</code>. When canonical is set (left column), this preview uses it for the green URL line.
              </p>
              <div
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                <div className="text-base leading-tight text-[#1a0dab] line-clamp-2">{serpPreview.titleShown}</div>
                <div className="mt-1 break-all text-xs leading-snug text-[#006621]">{serpPreview.url}</div>
                <div className="mt-1 line-clamp-3 text-xs leading-snug text-[#4d5156]">{serpPreview.snipShown}</div>
              </div>
              <div className="mt-3 flex flex-col gap-1 rounded-lg border border-dashed border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-600">
                <span className="font-semibold uppercase tracking-wide text-slate-400">Browser tab</span>
                <span
                  className="break-all font-mono text-[11px] text-slate-800"
                  title={effectiveSeoTitle.trim() || title.trim() || undefined}
                >
                  {serpPreview.tabTitleShown}
                </span>
                <span className="text-[10px] text-slate-400">SEO title or blog title.</span>
              </div>
              {(serpPreview.titleCharCount > SEO_TITLE_OPTIMAL_MAX_CHARS ||
                serpPreview.snippetCharCount > META_DESC_OPTIMAL_MAX_CHARS) && (
                <p className="mt-2 text-[11px] text-amber-800">
                  Titles often truncate after ~{SEO_TITLE_OPTIMAL_MAX_CHARS} characters; meta snippets near ~{META_DESC_OPTIMAL_MAX_CHARS}–
                  {META_DESC_HARD_MAX_CHARS}. Tighten copy so the important words appear early.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-indigo-100/90 bg-gradient-to-br from-white to-indigo-50/40 p-4 shadow-sm ring-1 ring-indigo-100/60">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-900/90">Technical SEO &amp; rich results</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Growth on <strong className="text-slate-800">my.profixer.in</strong> depends on consistent URLs, crawl directives, share cards, and valid structured data — not keyword density alone.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    !blogCanonicalUrl.trim() || /^https:\/\//i.test(blogCanonicalUrl.trim())
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-950'
                  }`}
                >
                  Canonical {!blogCanonicalUrl.trim() ? '(optional)' : /^https:\/\//i.test(blogCanonicalUrl.trim()) ? 'HTTPS' : 'check HTTPS'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    faqItemsResolved.length === 0 || faqItemsResolved.length >= 2
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-950'
                  }`}
                >
                  FAQ JSON-LD {faqItemsResolved.length === 0 ? 'off' : faqItemsResolved.length >= 2 ? `${faqItemsResolved.length} pairs` : 'use 0 or ≥2 pairs'}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  twitter:{blogTwitterCard}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">og:type {blogOgType}</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suggested head tags (consumer)</p>
              <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded border border-slate-200 bg-slate-50/90 p-2 font-mono text-[9px] leading-snug text-slate-800">
                {[
                  blogRobotsMeta.trim() ? `<meta name="robots" content="${blogRobotsMeta.trim()}" />` : `<!-- default: index,follow if omitted -->`,
                  `<link rel="canonical" href="${(blogCanonicalUrl.trim() || serpPreview.url).replace(/"/g, '&quot;')}" />`,
                  `<meta property="og:title" content="${(blogOgTitle.trim() || effectiveSeoTitle).replace(/"/g, '&quot;')}" />`,
                  `<meta property="og:description" content="${metaDescription.replace(/\s+/g, ' ').trim().slice(0, 200).replace(/"/g, '&quot;')}${metaDescription.length > 200 ? '…' : ''}" />`,
                  featuredImageUrl.trim()
                    ? `<meta property="og:image" content="${featuredImageUrl.trim().replace(/"/g, '&quot;')}" />`
                    : `<!-- og:image from featured image URL when set -->`,
                  `<meta property="og:type" content="${blogOgType.replace(/"/g, '&quot;')}" />`,
                  `<meta name="twitter:card" content="${blogTwitterCard}" />`,
                ].join('\n')}
              </pre>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">JSON-LD preview (BlogPosting ± FAQPage)</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                Elide <code className="rounded bg-white px-0.5 font-mono">datePublished</code> until the consumer sets it at go-live; keep FAQ and article in lockstep with visible HTML.
              </p>
              <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap break-all rounded border border-slate-200 bg-white p-2 font-mono text-[9px] text-slate-800">
                {`<script type="application/ld+json">\n${previewRichResultsJsonLd}\n</script>`}
              </pre>
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Keyword coverage</h2>
              <p className="mt-1 text-xs text-slate-500">
                Live body counts; title/meta columns use SEO title (or blog title) and meta. Match checklist bands: title {SEO_TITLE_MIN_CHARS}–
                {SEO_TITLE_OPTIMAL_MAX_CHARS} chars, meta {META_DESC_MIN_CHARS}–{META_DESC_OPTIMAL_MAX_CHARS}.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                <span className="font-medium text-slate-600">T/M:</span> <span title="In SEO or blog title">T</span> = title ·{' '}
                <span title="In meta description">M</span> = meta.
              </p>
              <div className="mt-2 rounded-md border border-slate-100 bg-slate-50/90 px-2 py-2 text-[11px] leading-relaxed text-slate-600">
                <strong className="text-slate-700">Anti-stuffing:</strong> ~≤2.5% primary density in body is a practical guardrail (plugin-style), not a
                Google formula. Write for people first.
              </div>
              {keywordRows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Add a primary or secondary keyword to populate this table.</p>
              ) : (
                <div className="mt-3 max-h-52 overflow-auto rounded-md border border-slate-100 text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-[1] bg-white shadow-[0_1px_0_0_rgb(226_232_240)]">
                      <tr className="text-slate-500">
                        <th scope="col" className="py-1.5 pr-2 pl-1 font-medium">
                          Phrase
                        </th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">
                          #
                        </th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">
                          Density
                        </th>
                        <th scope="col" className="py-1.5 pr-1 font-medium">
                          T/M
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordRows.map((row, idx) => (
                        <tr
                          key={row.phrase}
                          className={`border-b border-slate-100 ${row.densityPercent > 2.5 ? 'bg-amber-50/90' : ''}`}
                        >
                          <td className="py-1.5 pr-2 pl-1 text-slate-800">
                            <span className="inline-flex flex-wrap items-center gap-1">
                              {idx === 0 && primaryKeyword.trim() ? (
                                <span className="shrink-0 rounded bg-indigo-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-indigo-800">
                                  Primary
                                </span>
                              ) : null}
                              <span>{row.phrase}</span>
                            </span>
                          </td>
                          <td className="py-1.5 pr-2 tabular-nums">{row.count}</td>
                          <td className="py-1.5 pr-2 tabular-nums">
                            {row.densityPercent}%
                            {row.densityPercent > 2.5 && (
                              <span className="ml-1 text-amber-800" title="High density — may read as keyword stuffing">
                                ⚠
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 pr-1 text-slate-600">
                            {(row.inSeoTitle || row.inBlogTitle) && <span title="In SEO or blog title">T </span>}
                            {row.inMeta && <span title="In meta description">M</span>}
                            {!row.inSeoTitle && !row.inBlogTitle && !row.inMeta && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">SEO analysis</h2>
                <span className={`text-[10px] font-semibold ${seoPresentation.text}`}>
                  {seoPresentation.label} · /100
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                From titles, meta, keyword placement, and body usage — editorial heuristic (like common plugins), not a Google score.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all ${seoPresentation.bar}`} style={{ width: `${seo.score}%` }} />
              </div>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${seoPresentation.text}`}>{seo.score}</p>
              {seo.hints.length > 0 ? (
                <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-slate-600">
                  {seo.hints.slice(0, 8).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-emerald-700">Nothing flagged here — still verify the checklist.</p>
              )}
            </section>

            <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Content &amp; readability</p>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Content metrics</h2>
              <p className="mt-1 text-xs text-slate-500">
                Live structure from the editor: headings, paragraphs, images, links. Targets align with long-form web guides.
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Words</dt>
                  <dd className="font-medium tabular-nums">
                    {liveWordCount.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-slate-500">/ {PILLAR_WORD_TARGET.toLocaleString()} target</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Reading time</dt>
                  <dd className="font-medium">~{readingTimeMinutes} min</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">H1 / H2 / H3</dt>
                  <dd className="font-medium tabular-nums">
                    {liveContentStats.h1} / {liveContentStats.h2} / {liveContentStats.h3}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">H4 / H5 / H6</dt>
                  <dd className="font-medium tabular-nums">
                    {liveContentStats.h4} / {liveContentStats.h5} / {liveContentStats.h6}
                  </dd>
                </div>
                {liveWordCount >= LONGFORM_MIN_WORDS_FOR_SUBHEADINGS && (
                  <p className="text-xs text-slate-600">
                    For ~{liveWordCount.toLocaleString()} words, aim for ≥{' '}
                    <strong>{suggestedMinSectionHeadings(liveWordCount)}</strong> combined H2+H3 sections (~1 per ~380 words).
                  </p>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Long paragraphs</dt>
                  <dd className="font-medium">
                    {longParagraphCount} <span className="text-xs font-normal text-slate-500">({LONG_PARAGRAPH_WORD_THRESHOLD}+ words)</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Images</dt>
                  <dd className="font-medium">{liveContentStats.imageCount}</dd>
                </div>
                <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                  {liveContentStats.imageCount === 0
                    ? 'Add images where they clarify the story; set descriptive alt text in the image dialog.'
                    : liveContentStats.imagesMissingAlt > 0
                      ? `${liveContentStats.imagesMissingAlt} image(s) missing alt text — add alt in Quill when inserting images.`
                      : 'All images have alt text.'}
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                  <dt className="text-slate-600">Internal / external links</dt>
                  <dd className="font-medium">
                    {liveContentStats.internalLinkCount} / {liveContentStats.externalLinkCount}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Readability</h2>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {liveWordCount ? fre : '—'} <span className="text-base font-normal text-slate-500">/ 100</span>
              </p>
              <p className="text-sm text-slate-600">{liveWordCount ? fleschLabel(fre) : 'Add content to score.'}</p>
              <p className="mt-2 text-xs text-slate-500">
                Flesch Reading Ease (live text from the editor). Higher = easier; typical web targets are often ~50–60+ for mixed audiences.
              </p>
              {liveWordCount > 0 && Number.isFinite(fre) && fre > 0 && fre < 60 && (
                <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">How to raise this score</p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-sky-950">
                    {fleschImprovementHints(fre).map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                  <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-sky-950">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-sky-300"
                      checked={previewHighlightReadability}
                      onChange={(e) => setPreviewHighlightReadability(e.target.checked)}
                    />
                    <span>
                      <strong className="font-semibold">Live in-context highlights</strong> — sky marks show sentences over{' '}
                      {READABILITY_LONG_SENTENCE_WORDS} words; dense paragraphs/list items (≥{LONG_PARAGRAPH_WORD_THRESHOLD} words) get a blue
                      accent. Updates as you type; saved HTML is unchanged.
                    </span>
                  </label>
                  {previewHighlightReadability && (
                    <div className="mt-3">
                      <p className="text-[11px] font-medium text-sky-900">Body preview (coaching overlay)</p>
                      {readabilityLivePreviewHtml ? (
                        <>
                          <style>{`
                            .blog-readability-live-mount .blog-readability-long-paragraph {
                              box-shadow: inset 3px 0 0 0 #0ea5e9;
                              background-color: rgba(224, 242, 254, 0.45);
                              border-radius: 0 6px 6px 0;
                              padding-left: 0.35rem;
                            }
                          `}</style>
                          <div
                            className="blog-readability-live-mount mt-1 max-h-56 overflow-y-auto rounded-md border border-sky-200/80 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 [&_a]:text-indigo-600 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                            // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify + readability marks only
                            dangerouslySetInnerHTML={{ __html: readabilityLivePreviewHtml }}
                          />
                        </>
                      ) : (
                        <p className="mt-1 text-[11px] text-sky-900/80">Add body content to see highlights.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {liveWordCount > 0 && Number.isFinite(fre) && fre >= 60 && (
                <p className="mt-3 text-xs text-emerald-800">
                  You&apos;re in a comfortable band for many readers. Tighten further only if your audience is time-poor, ESL, or mostly on mobile.
                </p>
              )}
            </section>

            <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Editorial coach</p>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Suggestions for writer</h2>
              <p className="mt-1 text-xs text-slate-500">
                Topic and structure nudges only. SEO title, meta, and checklist items are intentionally{' '}
                <strong className="font-medium text-slate-600">not</strong> repeated here — use <strong>SEO analysis</strong> and{' '}
                <strong>Pre-publish checklist</strong> for those.
              </p>
              {naturalKeywordHints.length === 0 && writerSuggestions.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">No extra coaching flags — keep refining with the sections above.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {naturalKeywordHints.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Topic &amp; keywords</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-700">
                        {naturalKeywordHints.map((s, i) => (
                          <li key={`kw-${i}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {writerSuggestions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Structure &amp; flow</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                        {writerSuggestions.map((s, i) => (
                          <li key={`ws-${i}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Originality &amp; plagiarism</h2>
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

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Link-worthiness</h2>
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

      {cloudinaryPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Choose image from Cloudinary"
          onClick={() => closeCloudinaryPicker()}
        >
          <div
            className="relative my-8 flex max-h-[min(90vh,720px)] w-[calc(100vw-1.5rem)] max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">
                  {cloudinaryPickerFor === 'featured' ? 'Featured image from Cloudinary' : 'Insert from Cloudinary'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Folder: {BLOG_BODY_CLOUDINARY_FOLDER}
                  {cloudinaryPickerFor === 'featured'
                    ? ' — click an image to use as the featured image.'
                    : ' — click an image, then enter alt text to insert at your cursor.'}
                </p>
                <p className="mt-1 text-xs text-slate-500">Scroll to browse all images.</p>
              </div>
              <button
                type="button"
                onClick={() => closeCloudinaryPicker()}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              {cloudinaryLoading && <p className="py-8 text-center text-sm text-slate-600">Loading library…</p>}
              {!cloudinaryLoading && cloudinaryError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{cloudinaryError}</p>
              )}
              {!cloudinaryLoading && !cloudinaryError && cloudinaryImages.length === 0 && (
                <p className="py-8 text-sm text-slate-600">No images in this folder yet. Upload with the image button first.</p>
              )}
              {!cloudinaryLoading && !cloudinaryError && cloudinaryImages.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {cloudinaryImages.map((img) => (
                    <button
                      key={img.publicId?.trim() || img.url}
                      type="button"
                      onClick={() => handleCloudinaryLibraryPick(img.url)}
                      className="group flex min-w-0 flex-col items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200"
                    >
                      <img
                        src={img.url}
                        alt={img.publicId.split('/').pop() ?? 'Library image'}
                        className="h-40 w-full shrink-0 bg-slate-100 object-contain object-center sm:h-44"
                        loading="lazy"
                      />
                      <span className="block truncate px-2 py-1.5 text-[10px] text-slate-500 group-hover:text-slate-700">
                        {img.publicId.split('/').pop()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {importHtmlOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Import HTML"
          onClick={() => closeImportHtml()}
        >
          <div
            className="relative my-16 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-slate-900">Import HTML</h2>
            <p className="mt-1 text-xs text-slate-500">
              Paste HTML from another CMS, a static page, or your notes. It is cleaned to allowed tags (headings, lists, links, images, tables, embeds, etc.), then converted into editor content — same rules as paste and save.
            </p>
            <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="blog-import-html">
              HTML markup
            </label>
            <textarea
              id="blog-import-html"
              className="mt-1 max-h-[min(50vh,420px)] min-h-[160px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={importHtmlDraft}
              onChange={(e) => setImportHtmlDraft(e.target.value)}
              placeholder="<p>…</p>"
              autoFocus
            />
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300"
                checked={importHtmlStripStyles}
                onChange={(e) => setImportHtmlStripStyles(e.target.checked)}
              />
              <span>
                Strip inline styles (helps with Microsoft Word / Google Docs paste noise; also removes color/size from spans)
              </span>
            </label>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => closeImportHtml()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyImportHtmlAtCursor()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Insert at cursor
              </button>
              <button
                type="button"
                onClick={() => applyImportHtmlReplaceAll()}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Replace entire body
              </button>
            </div>
          </div>
        </div>
      )}

      {bodyImageAltDialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image alt text"
          onClick={() => cancelBodyImageAlt()}
        >
          <div
            className="relative my-24 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-slate-900">Alt text for this image</h2>
            <p className="mt-1 text-xs text-slate-500">
              Describe what the image shows. Required for accessibility and before you can publish with images in the body.
            </p>
            <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="blog-body-img-alt">
              Alt text
            </label>
            <input
              id="blog-body-img-alt"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={bodyImageAltDraft}
              onChange={(e) => setBodyImageAltDraft(e.target.value)}
              placeholder="e.g. Technician checking AC outdoor unit in Mumbai"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmBodyImageAlt()
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => cancelBodyImageAlt()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmBodyImageAlt()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Insert image
              </button>
            </div>
          </div>
        </div>
      )}

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
                {readabilityCoachActive && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={previewHighlightReadability}
                      onChange={(e) => setPreviewHighlightReadability(e.target.checked)}
                    />
                    Readability (sky: long sentences &amp; dense blocks)
                  </label>
                )}
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
              <style>{`
                .blog-preview-content img {
                  max-width: 100% !important;
                  width: auto !important;
                  height: auto !important;
                  max-height: min(60vh, 520px) !important;
                  object-fit: contain;
                  display: block;
                  margin-left: auto;
                  margin-right: auto;
                  border-radius: 0.5rem;
                }
                .blog-preview-content .blog-readability-long-paragraph {
                  box-shadow: inset 3px 0 0 0 #0ea5e9;
                  background-color: rgba(224, 242, 254, 0.35);
                  border-radius: 0 6px 6px 0;
                  padding-left: 0.35rem;
                }
                .blog-preview-content .blog-faq__accordion {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                }
                .blog-preview-content .blog-faq__item {
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  background: #f8fafc;
                  overflow: hidden;
                }
                .blog-preview-content .blog-faq__item[open] {
                  background: #fff;
                }
                .blog-preview-content .blog-faq__question {
                  cursor: pointer;
                  font-weight: 600;
                  padding: 0.75rem 1rem;
                  list-style: none;
                }
                .blog-preview-content .blog-faq__question::-webkit-details-marker {
                  display: none;
                }
                .blog-preview-content .blog-faq__answer {
                  padding: 0 1rem 1rem 1rem;
                  color: #475569;
                  font-size: 0.9375rem;
                  line-height: 1.55;
                  border-top: 1px solid #f1f5f9;
                }
              `}</style>
              {featuredImageUrl.trim() && (
                <img
                  src={featuredImageUrl.trim()}
                  alt={featuredImageAlt.trim() || 'Featured image'}
                  className="mb-6 max-h-64 w-full rounded-lg object-cover"
                />
              )}
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title || 'Untitled'}</h1>
              <p className="mt-2 text-sm text-slate-500">{metaDescription || 'No meta description'}</p>
              <div
                className="blog-preview-content mt-8 max-w-none text-slate-800 [&_a]:text-indigo-600 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:max-h-96 [&_iframe]:w-full [&_iframe]:rounded-lg [&_mark]:rounded [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify (+ optional mark from scan)
                dangerouslySetInnerHTML={{ __html: previewArticleHtml }}
              />
              {previewFaqJsonLd && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/90 p-4">
                  <p className="text-xs font-semibold text-amber-950">FAQ JSON‑LD for the public page &lt;head&gt;</p>
                  <p className="mt-1 text-[11px] leading-snug text-amber-900/90">
                    Not part of the rich-text body — your consumer app should inject this script on the blog detail route.
                  </p>
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded border border-amber-100/80 bg-white p-3 font-mono text-[10px] text-slate-800">
                    {`<script type="application/ld+json">\n${previewFaqJsonLd}\n</script>`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogEditor
