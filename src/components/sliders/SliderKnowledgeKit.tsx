import React, { useMemo, useState } from 'react'
import {
  BookOpenCheck,
  Rocket,
  ListChecks,
  LayoutDashboard,
  Image as ImageIcon,
  Film,
  Sparkles,
  CalendarClock,
  Users,
  Target,
  CircleHelp,
  Wand2,
  Search,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  TriangleAlert,
  Smartphone,
  Monitor,
  Store,
  Megaphone,
  Tag,
  Package,
  Layers,
  Sun,
  ShieldAlert,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { cn } from '../../lib/utils'
import { SLIDER_PLACEMENT_LABELS, type SliderPlacement } from '../../types'

/**
 * SliderKnowledgeKit — comprehensive in-product documentation for the
 * Sliders & Banners workspace.
 *
 * Why a separate kit instead of inline hints?
 *   - The sliders module touches media specs, schedules, targeting, playback,
 *     placement layouts, and content rules. Inline tooltips lose the bigger
 *     picture of "where does this thing actually show up?"
 *   - Marketers / ops asked for a single reference they can open mid-task
 *     without leaving the page. Same pattern Shopify/HubSpot use for help.
 *
 * Sections:
 *   1. Quick start  — 3-step "first slide" walkthrough.
 *   2. Placement guide — every placement, where it renders, recommended
 *      content, dimensions, and CTA notes.
 *   3. Field reference — every form field with examples and gotchas.
 *   4. Media specs — image/GIF/video/Lottie size, aspect, file-size caps.
 *   5. Scheduling & audience — when to use start/end dates and target
 *      audience.
 *   6. Troubleshooting — top issues with fixes.
 *   7. Cheatsheet — copy-friendly "do / don't" rules.
 */

type KitSection =
  | 'quick-start'
  | 'placements'
  | 'fields'
  | 'media'
  | 'schedule'
  | 'audience'
  | 'troubleshoot'
  | 'cheatsheet'

const SECTIONS: Array<{
  id: KitSection
  label: string
  icon: React.ReactNode
  hint: string
}> = [
  {
    id: 'quick-start',
    label: 'Quick start',
    icon: <Rocket className="h-4 w-4" />,
    hint: 'Ship your first slide in 3 steps',
  },
  {
    id: 'placements',
    label: 'Placement guide',
    icon: <LayoutDashboard className="h-4 w-4" />,
    hint: 'Where each placement renders + recommended content',
  },
  {
    id: 'fields',
    label: 'Field reference',
    icon: <ListChecks className="h-4 w-4" />,
    hint: 'Every form field, what it does, and the gotchas',
  },
  {
    id: 'media',
    label: 'Media specs',
    icon: <ImageIcon className="h-4 w-4" />,
    hint: 'Image / GIF / video / Lottie dimensions & limits',
  },
  {
    id: 'schedule',
    label: 'Scheduling',
    icon: <CalendarClock className="h-4 w-4" />,
    hint: 'Activation windows & timezone notes',
  },
  {
    id: 'audience',
    label: 'Audience & targeting',
    icon: <Users className="h-4 w-4" />,
    hint: 'Customer vs provider, category & product scoping',
  },
  {
    id: 'troubleshoot',
    label: 'Troubleshooting',
    icon: <CircleHelp className="h-4 w-4" />,
    hint: 'Slide not showing? Wrong size? Start here',
  },
  {
    id: 'cheatsheet',
    label: 'Cheatsheet',
    icon: <Wand2 className="h-4 w-4" />,
    hint: 'Copy-friendly do / don\u2019t rules',
  },
]

const PLACEMENT_ICON: Record<SliderPlacement, React.ReactNode> = {
  home_page_hero: <Monitor className="h-4 w-4" />,
  offers: <Tag className="h-4 w-4" />,
  category: <Layers className="h-4 w-4" />,
  mobile_app_home: <Smartphone className="h-4 w-4" />,
  store_home: <Store className="h-4 w-4" />,
  store_category: <Package className="h-4 w-4" />,
  product_page: <Tag className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
  promo: <Sparkles className="h-4 w-4" />,
  seasonal: <Sun className="h-4 w-4" />,
}

const PLACEMENT_GUIDE: Record<
  SliderPlacement,
  {
    where: string
    audience: string
    aspect: string
    recommendedSize: string
    contentTips: string[]
    ctaTip: string
    /** Should this placement collect a category or product reference? */
    targeting?: 'service-category' | 'store-category' | 'product' | 'none'
  }
> = {
  home_page_hero: {
    where: 'Top of the customer home page on the web storefront — large 21:9 carousel.',
    audience: 'All visitors (logged in or not).',
    aspect: '21:9 (desktop), crops to ~2.1:1 on mobile.',
    recommendedSize: '2400 × 1030 px · ≤ 700 KB (image) · ≤ 6 MB (video)',
    contentTips: [
      'Lead with the offer (e.g. “Up to 40% off AC service”), not the brand name.',
      'Keep key visuals inside the centre 60% so they survive mobile crop.',
      'High-contrast subject + simple background — text overlay must stay legible.',
    ],
    ctaTip: 'Always link the CTA to a /services or /offers landing page — never a raw PDP.',
    targeting: 'none',
  },
  offers: {
    where: 'Offers & promotions strip below the home hero on the storefront.',
    audience: 'All visitors.',
    aspect: '16:9 horizontal cards.',
    recommendedSize: '1600 × 900 px · ≤ 500 KB',
    contentTips: [
      'Repeat the deal value as a visual badge (₹ off / % off / cashback).',
      'Pair with an expiry hint (“Ends Sun”) — increases urgency.',
    ],
    ctaTip: 'CTA should point to a coupon page or filtered services list.',
    targeting: 'none',
  },
  category: {
    where: 'Top of the service category listing page (e.g. /services/ac, /services/cleaning).',
    audience: 'Customers browsing a specific service category.',
    aspect: '16:5 wide banner.',
    recommendedSize: '1920 × 600 px · ≤ 500 KB',
    contentTips: [
      'Show the category context in the visual (an AC unit, a cleaner, etc).',
      'Use this for category-level promos, not store-wide announcements.',
    ],
    ctaTip: 'Pick a category in the targeting field — otherwise the slide is hidden on the category page.',
    targeting: 'service-category',
  },
  mobile_app_home: {
    where: 'Hero carousel on the customer mobile app home screen.',
    audience: 'Customers on iOS / Android app.',
    aspect: '2.1:1 wide card (matches in-app carousel).',
    recommendedSize: '1680 × 800 px · ≤ 400 KB',
    contentTips: [
      'Mobile-first: type sizes scale down — keep headlines ≤ 5 words.',
      'Avoid bottom-edge text; the dot pagination sits underneath.',
      'Test in “Mobile” viewport in Live Preview before publishing.',
    ],
    ctaTip: 'Deep-link to an in-app route (e.g. /services/ac) so customers stay inside the app.',
    targeting: 'none',
  },
  store_home: {
    where: 'Top hero of the e-commerce store landing page (/store).',
    audience: 'Shoppers entering the product store.',
    aspect: '21:9 wide hero.',
    recommendedSize: '2400 × 1030 px · ≤ 700 KB',
    contentTips: [
      'Use product imagery (parts, accessories) — not service photography.',
      'Highlight new arrivals, bundles, or “Flat ₹ off” codes.',
    ],
    ctaTip: 'CTA should land on a filtered store listing (e.g. /store?cat=ac-spares).',
    targeting: 'none',
  },
  store_category: {
    where: 'Aisle / catalog category page in the store (e.g. /store/category/ac-spares).',
    audience: 'Shoppers in a specific store aisle.',
    aspect: '16:5 wide banner.',
    recommendedSize: '1920 × 600 px · ≤ 500 KB',
    contentTips: [
      'Tie messaging to the aisle (“Save 20% on AC compressors this week”).',
      'Avoid generic store-wide messaging — those belong on Store Home.',
    ],
    ctaTip: 'Select the store category in targeting; otherwise the slide will not appear on any aisle.',
    targeting: 'store-category',
  },
  product_page: {
    where: 'Promotional hero on a specific product detail page (/store/product/<slug>).',
    audience: 'Shoppers viewing one product.',
    aspect: '16:9 horizontal card.',
    recommendedSize: '1600 × 900 px · ≤ 500 KB',
    contentTips: [
      'Use cross-sell / accessory imagery, not duplicate product hero.',
      'Mention bundle / warranty / free-install offers tied to this SKU.',
    ],
    ctaTip: 'Pick the exact product — slide is bound to one product page only.',
    targeting: 'product',
  },
  announcement: {
    where: 'Thin announcement bar at the very top of every page (above navigation).',
    audience: 'Everyone visiting the site.',
    aspect: 'No image — text + optional CTA.',
    recommendedSize: '—',
    contentTips: [
      'Keep copy to one sentence (≤ 90 chars) — the bar truncates.',
      'Use for site-wide notices: maintenance, holiday hours, or new launches.',
      'Avoid using for promos — those belong in Offers.',
    ],
    ctaTip: 'Make the CTA optional. Most announcements are informational.',
    targeting: 'none',
  },
  promo: {
    where: 'Inline promo block between sections on the storefront (e.g. between “Popular services” and “How it works”).',
    audience: 'All visitors browsing the home page.',
    aspect: '3:1 or 16:5 strip.',
    recommendedSize: '1800 × 600 px · ≤ 500 KB',
    contentTips: [
      'Pair a short headline with a clear offer + a single CTA.',
      'Works best as a “surprise” block (referral nudge, app download, etc).',
    ],
    ctaTip: 'CTA must take the user somewhere new — never a no-op decorative slide.',
    targeting: 'none',
  },
  seasonal: {
    where: 'Themed campaign banners reused across hero spots (Diwali, Summer, IPL, etc).',
    audience: 'All visitors during the campaign window.',
    aspect: '21:9 wide hero.',
    recommendedSize: '2400 × 1030 px · ≤ 700 KB',
    contentTips: [
      'Use the Schedule section — set both start and end dates so the slide auto-retires.',
      'Match seasonal colour palette to your brand’s campaign kit.',
    ],
    ctaTip: 'Link to a campaign landing page that mirrors the same theme.',
    targeting: 'none',
  },
}

const FIELDS: Array<{
  group: string
  items: Array<{
    name: string
    purpose: string
    examples?: string[]
    tips?: string[]
    gotcha?: string
  }>
}> = [
  {
    group: 'Basic info',
    items: [
      {
        name: 'Title',
        purpose: 'Main headline rendered over the media. Also used as the alt text fallback for accessibility & SEO.',
        examples: ['Monsoon AC Care — Flat ₹300 off', 'New: Same-day appliance repair'],
        tips: ['Keep to ≤ 6 words for mobile readability', 'Use sentence case — easier to scan than ALL CAPS'],
        gotcha: 'Required. Limited to 100 characters.',
      },
      {
        name: 'Subtitle',
        purpose: 'Optional secondary line beneath the title.',
        examples: ['Use code MONSOON300', 'Limited to first 500 bookings'],
        tips: ['Adds context to the offer, not poetry.'],
      },
      {
        name: 'Description',
        purpose: 'Long-form notes shown ONLY in admin / internal previews. Customers never see this.',
        tips: ['Useful for "why we ran this" notes the next operator can read.'],
      },
      {
        name: 'Position',
        purpose: 'Display order inside the carousel for the same placement. Lower = first.',
        tips: ['Use 1 for the most important slide.'],
        gotcha: 'If two slides share the same position, the most-recently-edited one wins.',
      },
      {
        name: 'Placement',
        purpose: 'Where on the storefront / app this slide appears.',
        tips: ['See the “Placement guide” section for the full map.'],
        gotcha: 'Changing placement may invalidate the image aspect ratio — check Live Preview after switching.',
      },
    ],
  },
  {
    group: 'Targeting (dynamic based on placement)',
    items: [
      {
        name: 'Service category',
        purpose: 'Bind the slide to a service category page (AC, Cleaning, etc).',
        gotcha: 'Required for the "Service Category Banner" placement. Slide is hidden if no category is selected.',
      },
      {
        name: 'Store category (aisle)',
        purpose: 'Bind the slide to an e-commerce aisle (AC spares, Tools, etc).',
        gotcha: 'Required for the "Store Category (Aisle)" placement.',
      },
      {
        name: 'Product',
        purpose: 'Bind the slide to a single product detail page.',
        gotcha: 'Required for the "Product Page Promo" placement. The slide appears only on that one PDP.',
      },
    ],
  },
  {
    group: 'Media',
    items: [
      {
        name: 'Media type',
        purpose: 'Pick image, GIF, video, or Lottie animation.',
        tips: [
          'Image — fastest, safest default.',
          'GIF — looping animation, no audio. Watch file size (often huge).',
          'Video — autoplay muted MP4 / WebM. Provide a poster image as fallback.',
          'Lottie — vector JSON animation; great for hero illustrations.',
        ],
        gotcha: 'Switching media type after upload clears the previous asset — re-upload before saving.',
      },
      {
        name: 'Image / Video / Lottie',
        purpose: 'The primary asset shown to customers.',
        tips: ['Upload via the picker or paste a hosted URL.'],
        gotcha: 'Required field — the form blocks save without media (except Announcement Bar).',
      },
      {
        name: 'Poster',
        purpose: 'Static fallback image for video & Lottie. Shown while the asset loads or if autoplay is blocked.',
        tips: ['Use the first frame of the video for seamless transition.'],
      },
      {
        name: 'Image alt text',
        purpose: 'Screen-reader description. Critical for accessibility & SEO.',
        examples: ['Technician servicing a split AC unit'],
      },
      {
        name: 'Playback (video only)',
        purpose: 'Autoplay / loop / muted / inline behaviour for video heroes.',
        tips: ['Keep muted = true. Autoplay with sound is blocked by every modern browser.'],
      },
    ],
  },
  {
    group: 'Call to action',
    items: [
      {
        name: 'Button text',
        purpose: 'Label of the on-slide button.',
        examples: ['Book now', 'View offers', 'Get the app'],
        tips: ['Use an action verb. Avoid "Click here".'],
      },
      {
        name: 'Button URL',
        purpose: 'Destination of the CTA. Can be internal (/services) or absolute (https://...).',
        gotcha: 'If button text is filled, URL becomes required. Form will refuse to save otherwise.',
      },
    ],
  },
  {
    group: 'Schedule & visibility',
    items: [
      {
        name: 'Active status',
        purpose: 'Master toggle. When off, the slide is hidden regardless of schedule.',
        tips: ['Use as a quick kill switch when a campaign needs to pause immediately.'],
      },
      {
        name: 'Start / End date',
        purpose: 'Auto-activate or auto-retire the slide. Both optional.',
        gotcha: 'Server uses tenant timezone. End date must be after start date.',
      },
      {
        name: 'Target audience',
        purpose: 'Customers only, providers only, or both.',
        tips: [
          '"Customers only" hides the slide from logged-in service partners.',
          '"Providers only" only renders inside the partner app surfaces.',
        ],
      },
    ],
  },
]

const MEDIA_SPECS = [
  {
    type: 'Image (JPG / PNG / WebP)',
    icon: <ImageIcon className="h-4 w-4" />,
    notes: [
      'Aspect: 21:9 (hero) or 16:9 / 16:5 (banners). Check Placement guide.',
      'Max file size: 1 MB. We recommend ≤ 500 KB for fast LCP.',
      'Use WebP whenever possible — 30–50% smaller than JPG at the same quality.',
      'Always provide alt text. Screen-readers (and Google) read it.',
    ],
  },
  {
    type: 'GIF',
    icon: <ImageIcon className="h-4 w-4" />,
    notes: [
      'Aspect: same as image.',
      'Max file size: 2 MB. GIFs balloon fast — convert long animations to MP4 instead.',
      'Loops indefinitely. No way to control playback.',
    ],
  },
  {
    type: 'Video (MP4 / WebM)',
    icon: <Film className="h-4 w-4" />,
    notes: [
      'Aspect: 21:9 or 16:9. Mobile crops to ~2.1:1 — center key content.',
      'Max file size: 6 MB. Recommended duration ≤ 10 seconds.',
      'Codec: H.264 / AAC for broadest compatibility.',
      'Provide a poster — autoplay can be blocked on Safari & data-saver browsers.',
      'Keep audio out — autoplay-with-sound is blocked everywhere.',
    ],
  },
  {
    type: 'Lottie (JSON)',
    icon: <Sparkles className="h-4 w-4" />,
    notes: [
      'Vector JSON exported from After Effects via Bodymovin / LottieFiles.',
      'Max file size: 500 KB.',
      'Great for hero illustrations & micro-interactions.',
      'Avoid masks & expressions — they often render incorrectly in lottie-web.',
    ],
  },
]

const TROUBLESHOOTING = [
  {
    q: 'My slide isn\u2019t appearing on the storefront.',
    fix: [
      'Check Active toggle is ON.',
      'Confirm today is between Start and End dates (or both are empty).',
      'Confirm the placement matches the page you\u2019re looking at.',
      'For category / product placements: make sure the targeting field is set.',
      'Hard-refresh the storefront — CDN may be serving the previous list for up to 60 s.',
    ],
  },
  {
    q: 'Image looks stretched or cropped on mobile.',
    fix: [
      'Check the placement\u2019s recommended aspect ratio in the Placement guide.',
      'Move important content into the centre 60% — mobile crops the edges.',
      'Open Live Preview, switch to Mobile, then iterate.',
    ],
  },
  {
    q: 'Video doesn\u2019t autoplay.',
    fix: [
      'Make sure the video is muted in Playback settings — Safari & Chrome block sound.',
      'Provide a poster image so the slide still renders while the user taps to play.',
      'Check the file is ≤ 6 MB. Larger files time out on slow networks.',
    ],
  },
  {
    q: 'The "Save" button is disabled / the form throws errors.',
    fix: [
      'Title is required — fill it in.',
      'Media is required for everything except the Announcement bar.',
      'If Button text is filled, Button URL must be filled too.',
      'For product / category placements, the corresponding target must be selected.',
    ],
  },
  {
    q: 'Two slides at the same position keep flipping.',
    fix: [
      'Set explicit positions on every slide inside the same placement.',
      'Use 1 for the hero, then 2, 3, 4 — duplicates are sorted by last-edited time.',
    ],
  },
]

const CHEATSHEET_DO = [
  'Always preview both Desktop and Mobile before publishing.',
  'Keep headlines ≤ 6 words.',
  'Use WebP images under 500 KB.',
  'Provide alt text and a poster for videos.',
  'Schedule seasonal campaigns with both start AND end dates so they auto-retire.',
]

const CHEATSHEET_DONT = [
  'Don\u2019t upload 4K videos — they choke 3G/4G users.',
  'Don\u2019t use ALL CAPS in titles — bad for accessibility and aesthetics.',
  'Don\u2019t leave Button text without a Button URL.',
  'Don\u2019t put critical copy near the bottom edge of mobile heroes (dots overlap).',
  'Don\u2019t bind home-hero slides to a category — they\u2019ll only show on that one page.',
]

export interface SliderKnowledgeKitProps {
  trigger?: React.ReactNode
  /** Pre-select a section when the kit opens — handy from inline "Learn more" links. */
  defaultSection?: KitSection
}

export function SliderKnowledgeKit({ trigger, defaultSection = 'quick-start' }: SliderKnowledgeKitProps) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<KitSection>(defaultSection)
  const [query, setQuery] = useState('')

  // Reset to the default section every time the dialog opens, so the
  // user always lands somewhere meaningful instead of mid-scroll.
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSection(defaultSection)
      setQuery('')
    }
  }

  const q = query.trim().toLowerCase()

  const filteredFields = useMemo(() => {
    if (!q) return FIELDS
    return FIELDS.map((group) => ({
      ...group,
      items: group.items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.purpose.toLowerCase().includes(q) ||
          (it.tips || []).some((t) => t.toLowerCase().includes(q)) ||
          (it.examples || []).some((e) => e.toLowerCase().includes(q)) ||
          (it.gotcha || '').toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length > 0)
  }, [q])

  const filteredPlacements = useMemo(() => {
    const all = Object.entries(SLIDER_PLACEMENT_LABELS) as Array<[SliderPlacement, string]>
    if (!q) return all
    return all.filter(([key, label]) => {
      const g = PLACEMENT_GUIDE[key]
      return (
        label.toLowerCase().includes(q) ||
        g.where.toLowerCase().includes(q) ||
        g.audience.toLowerCase().includes(q) ||
        g.contentTips.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [q])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <BookOpenCheck className="h-4 w-4" />
            Knowledge kit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(92vh,860px)] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 space-y-1 border-b bg-gradient-to-r from-primary/8 via-background to-background px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-base">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                Sliders & banners — knowledge kit
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Everything you need to ship a great-looking slide: field reference, placement map,
                media specs, troubleshooting, and a do / don&apos;t cheatsheet.
              </p>
            </div>
            <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
              <Lightbulb className="h-3 w-3" />v 1.0
            </Badge>
          </div>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields, placements, media specs…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Section nav */}
          <nav
            aria-label="Knowledge kit sections"
            className="shrink-0 overflow-x-auto border-b bg-muted/30 p-2 md:w-56 md:border-b-0 md:border-r md:p-3"
          >
            <ul className="flex gap-1 md:flex-col">
              {SECTIONS.map((s) => {
                const active = section === s.id
                return (
                  <li key={s.id} className="shrink-0 md:w-full">
                    <button
                      type="button"
                      onClick={() => setSection(s.id)}
                      className={cn(
                        'group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition',
                        active
                          ? 'bg-primary/12 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span className={cn('shrink-0', active && 'text-primary')}>{s.icon}</span>
                      <span className="hidden flex-1 truncate md:block">{s.label}</span>
                      <span className="md:hidden">{s.label}</span>
                      <ChevronRight
                        className={cn(
                          'ml-auto hidden h-3 w-3 opacity-0 transition group-hover:opacity-60 md:inline',
                          active && 'opacity-100',
                        )}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {section === 'quick-start' && <QuickStartSection />}
            {section === 'placements' && <PlacementSection items={filteredPlacements} />}
            {section === 'fields' && <FieldsSection groups={filteredFields} />}
            {section === 'media' && <MediaSection />}
            {section === 'schedule' && <ScheduleSection />}
            {section === 'audience' && <AudienceSection />}
            {section === 'troubleshoot' && <TroubleshootSection />}
            {section === 'cheatsheet' && <CheatsheetSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────────────────  Section renderers  ───────────────────────── */

function SectionTitle({ icon, title, intro }: { icon: React.ReactNode; title: string; intro?: string }) {
  return (
    <div className="mb-4 space-y-1">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      {intro ? <p className="text-sm text-muted-foreground">{intro}</p> : null}
    </div>
  )
}

function QuickStartSection() {
  const steps = [
    {
      title: 'Pick the placement first',
      body: 'It dictates aspect ratio, audience, and which targeting fields you\u2019ll see. Open the Placement guide if unsure.',
    },
    {
      title: 'Upload the asset that matches that placement',
      body: 'Match the recommended aspect ratio + keep the file under the size cap. Live Preview shows desktop and mobile crop side-by-side.',
    },
    {
      title: 'Title, CTA, schedule — then save',
      body: 'Headline ≤ 6 words, optional CTA (label + URL together), optional start/end dates. Set Active = ON. Done.',
    },
  ]
  return (
    <div>
      <SectionTitle
        icon={<Rocket className="h-4 w-4" />}
        title="Quick start"
        intro="Three steps from blank page to published slide. Total time ~3 minutes once your asset is ready."
      />
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="rounded-lg border bg-card p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/[0.04] p-3 text-xs">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
          <Lightbulb className="h-3.5 w-3.5" />
          Pro tip
        </p>
        <p className="text-muted-foreground">
          When in doubt, duplicate an existing well-performing slide and swap the asset.
          The placement, aspect ratio, and CTA shape will all carry over.
        </p>
      </div>
    </div>
  )
}

function PlacementSection({ items }: { items: Array<[SliderPlacement, string]> }) {
  return (
    <div>
      <SectionTitle
        icon={<LayoutDashboard className="h-4 w-4" />}
        title="Placement guide"
        intro="Every placement, where it actually renders, and the content rules that work best for each."
      />
      {items.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          No placements match your search.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(([key, label]) => {
            const g = PLACEMENT_GUIDE[key]
            return (
              <article key={key} className="rounded-lg border bg-card p-3">
                <header className="mb-2 flex items-start gap-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {PLACEMENT_ICON[key]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{g.where}</p>
                  </div>
                </header>
                <dl className="space-y-1.5 text-[12px]">
                  <Row label="Audience" value={g.audience} />
                  <Row label="Aspect" value={g.aspect} />
                  <Row label="Recommended" value={g.recommendedSize} />
                  <Row
                    label="Targeting"
                    value={
                      g.targeting === 'service-category'
                        ? 'Service category required'
                        : g.targeting === 'store-category'
                          ? 'Store category required'
                          : g.targeting === 'product'
                            ? 'Specific product required'
                            : 'None — site-wide'
                    }
                  />
                </dl>
                <ul className="mt-2 space-y-1 border-t pt-2 text-[12px] text-muted-foreground">
                  {g.contentTips.map((t, i) => (
                    <li key={i} className="flex gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-storm-deep" />
                      <span>{t}</span>
                    </li>
                  ))}
                  <li className="flex gap-1.5 text-foreground">
                    <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium">CTA:</span> {g.ctaTip}
                    </span>
                  </li>
                </ul>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-[88px] shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-foreground">{value}</dd>
    </div>
  )
}

function FieldsSection({ groups }: { groups: typeof FIELDS }) {
  return (
    <div>
      <SectionTitle
        icon={<ListChecks className="h-4 w-4" />}
        title="Field reference"
        intro="Every form field, exactly what it does on the storefront, and the gotchas to watch out for."
      />
      {groups.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">No fields match your search.</p>
      ) : (
        <Accordion type="multiple" defaultValue={groups.map((g) => g.group)} className="space-y-2">
          {groups.map((group) => (
            <AccordionItem key={group.group} value={group.group} className="rounded-lg border bg-card px-3">
              <AccordionTrigger className="py-2.5 text-sm font-semibold">
                {group.group}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {group.items.length} field{group.items.length === 1 ? '' : 's'}
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-3">
                  {group.items.map((it) => (
                    <div key={it.name} className="rounded-md border bg-muted/20 p-3">
                      <p className="text-sm font-semibold">{it.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{it.purpose}</p>
                      {it.examples && it.examples.length > 0 ? (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Examples: </span>
                          {it.examples.map((e, i) => (
                            <span key={i} className="mr-1 inline-block rounded bg-background px-1.5 py-0.5 font-mono">
                              {e}
                            </span>
                          ))}
                        </p>
                      ) : null}
                      {it.tips && it.tips.length > 0 ? (
                        <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                          {it.tips.map((t, i) => (
                            <li key={i} className="flex gap-1.5">
                              <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-bloom-coral" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {it.gotcha ? (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/[0.08] p-1.5 text-[11px] text-amber-700">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{it.gotcha}</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

function MediaSection() {
  return (
    <div>
      <SectionTitle
        icon={<ImageIcon className="h-4 w-4" />}
        title="Media specs"
        intro="What to upload for each media type. Stay inside these limits and slides render edge-to-edge across every device."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {MEDIA_SPECS.map((spec) => (
          <article key={spec.type} className="rounded-lg border bg-card p-3">
            <header className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                {spec.icon}
              </span>
              <p className="text-sm font-semibold">{spec.type}</p>
            </header>
            <ul className="space-y-1.5 text-[12px] text-muted-foreground">
              {spec.notes.map((n, i) => (
                <li key={i} className="flex gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-storm-deep" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-bloom-coral/30 bg-bloom-coral/[0.06] p-3 text-[12px] text-foreground">
        <p className="flex items-center gap-1.5 font-semibold text-bloom-coral">
          <TriangleAlert className="h-3.5 w-3.5" />
          Big files = slow stores
        </p>
        <p className="mt-1 text-muted-foreground">
          Every 100 KB of hero weight adds ~120 ms to LCP on a 4G phone. Hold your assets under
          the recommended caps even when the upload technically succeeds.
        </p>
      </div>
    </div>
  )
}

function ScheduleSection() {
  return (
    <div>
      <SectionTitle
        icon={<CalendarClock className="h-4 w-4" />}
        title="Scheduling"
        intro="How activation windows work, and why you should set them for any campaign."
      />
      <div className="space-y-3 text-sm">
        <p className="rounded-md border bg-card p-3 text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">How it resolves: </span>
          A slide is visible when <span className="font-mono">Active = ON</span> AND
          <span className="font-mono"> now</span> is between <span className="font-mono">start_date</span> and
          <span className="font-mono"> end_date</span>. Empty start = visible from now. Empty end = visible forever
          (until you turn it off).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-lg border bg-card p-3">
            <p className="text-sm font-semibold">Set both start AND end for campaigns</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Diwali, Summer Sale, IPL — schedule once, the slide auto-retires. No more orphaned
              banners showing &ldquo;Diwali sale&rdquo; on Jan 4.
            </p>
          </article>
          <article className="rounded-lg border bg-card p-3">
            <p className="text-sm font-semibold">Use Active toggle as a kill switch</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Need to pause a slide immediately (incorrect price, bad creative)? Toggle Active off.
              It bypasses the schedule and hides instantly.
            </p>
          </article>
        </div>
        <p className="rounded-md border border-amber-500/30 bg-amber-500/[0.07] p-3 text-[12px] text-amber-700">
          <ShieldAlert className="mr-1.5 inline h-3.5 w-3.5" />
          Dates evaluate against the tenant&apos;s server timezone. If your tenant is set to Asia/Kolkata,
          a 23:30 IST end_date stays live for 30 more minutes &mdash; not 30 hours.
        </p>
      </div>
    </div>
  )
}

function AudienceSection() {
  return (
    <div>
      <SectionTitle
        icon={<Users className="h-4 w-4" />}
        title="Audience & targeting"
        intro="Two layers of targeting — who sees it, and where."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold">Target audience</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Customers only, providers only, or both.
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
            <li>• Logged-out visitors are treated as customers.</li>
            <li>• Provider-only slides render exclusively inside the partner app.</li>
            <li>• Use &ldquo;All users&rdquo; for site-wide announcements.</li>
          </ul>
        </article>
        <article className="rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold">Page-level targeting</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Service category, store category, and product placements bind a slide to a specific page.
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
            <li>• Missing target → slide is invisible on that page.</li>
            <li>• One slide cannot target multiple categories. Duplicate it.</li>
          </ul>
        </article>
      </div>
    </div>
  )
}

function TroubleshootSection() {
  return (
    <div>
      <SectionTitle
        icon={<CircleHelp className="h-4 w-4" />}
        title="Troubleshooting"
        intro="The 5 issues we hear about most often, with the exact fixes that work."
      />
      <Accordion type="single" collapsible className="space-y-2">
        {TROUBLESHOOTING.map((t, i) => (
          <AccordionItem key={i} value={`q-${i}`} className="rounded-lg border bg-card px-3">
            <AccordionTrigger className="py-2.5 text-left text-sm font-semibold">{t.q}</AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="space-y-1.5 text-[12px] text-muted-foreground">
                {t.fix.map((f, idx) => (
                  <li key={idx} className="flex gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-storm-deep" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function CheatsheetSection() {
  return (
    <div>
      <SectionTitle
        icon={<Wand2 className="h-4 w-4" />}
        title="Cheatsheet"
        intro="Copy-friendly do / don\u2019t list. Stick on the wall next to the marketing calendar."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-storm-deep/30 bg-storm-deep/[0.05] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-storm-deep">
            <CheckCircle2 className="h-4 w-4" />
            Do
          </p>
          <ul className="space-y-1.5 text-[12px] text-muted-foreground">
            {CHEATSHEET_DO.map((t, i) => (
              <li key={i} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-storm-deep" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-destructive/30 bg-destructive/[0.05] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <TriangleAlert className="h-4 w-4" />
            Don&apos;t
          </p>
          <ul className="space-y-1.5 text-[12px] text-muted-foreground">
            {CHEATSHEET_DONT.map((t, i) => (
              <li key={i} className="flex gap-1.5">
                <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  )
}

export default SliderKnowledgeKit
