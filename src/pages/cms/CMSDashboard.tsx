import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  Images,
  LayoutPanelTop,
  LayoutGrid,
  FileText,
  FolderOpen,
  File,
  Menu,
  Percent,
  Gift,
  Mail,
  FileCode,
  Share2,
  Star,
  MessageSquareQuote,
  HelpCircle,
  Receipt,
  Megaphone,
  Link2,
  Search,
  Tag,
  Newspaper,
  type LucideIcon,
  Loader2,
  Palette,
} from 'lucide-react'
import { CMSService } from '../../services/api'
import { PageHeader, StatHighlightCard } from '../../components/common'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'

interface CMSStats {
  totalPages?: number
  totalBlogs?: number
  totalTestimonials?: number
  totalFAQs?: number
}

type StatKey = 'pages' | 'blogs' | 'testimonials' | 'faqs'

interface HubTile {
  title: string
  description: string
  to: string
  icon: LucideIcon
  stat?: StatKey
}

interface HubSection {
  id: string
  title: string
  subtitle: string
  tiles: HubTile[]
}

const ICON_ACCENTS = [
  'bg-primary/12 text-primary',
  'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  'bg-teal-500/12 text-teal-600 dark:text-teal-400',
  'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  'bg-rose-500/12 text-rose-600 dark:text-rose-400',
]

const HUB_SECTIONS: HubSection[] = [
  {
    id: 'structure',
    title: 'Website structure',
    subtitle: 'Navigation, layouts, and reusable media.',
    tiles: [
      {
        title: 'Homepage',
        description: 'Hero, featured modules, and above-the-fold content.',
        to: '/cms/homepage',
        icon: Home,
      },
      {
        title: 'Site appearance',
        description: 'Public-site colors, type, radius, and spacing tokens.',
        to: '/cms/site-appearance',
        icon: Palette,
      },
      {
        title: 'Pages',
        description: 'Legal, policy, and custom static pages.',
        to: '/cms/pages',
        icon: File,
        stat: 'pages',
      },
      {
        title: 'Menus',
        description: 'Header, footer, and app navigation trees.',
        to: '/cms/menus',
        icon: Menu,
      },
      {
        title: 'Media library',
        description: 'Centralized images, documents, and uploads.',
        to: '/cms/media',
        icon: FolderOpen,
      },
    ],
  },
  {
    id: 'surfaces',
    title: 'Surfaces & campaigns',
    subtitle: 'On-site placements, offers, and referral growth.',
    tiles: [
      {
        title: 'Sliders',
        description: 'Homepage and landing carousel banners.',
        to: '/sliders',
        icon: Images,
      },
      {
        title: 'Banners & pop-ups',
        description: 'Notice bars, modals, and timed announcements.',
        to: '/cms/banners',
        icon: LayoutPanelTop,
      },
      {
        title: 'Promotions',
        description: 'Scheduled offers and campaign messaging.',
        to: '/cms/promotions',
        icon: Tag,
      },
      {
        title: 'Coupons',
        description: 'Discount codes and redemption rules.',
        to: '/coupons',
        icon: Percent,
      },
      {
        title: 'Referrals',
        description: 'Refer-a-friend programs and rewards.',
        to: '/referrals',
        icon: Gift,
      },
    ],
  },
  {
    id: 'editorial',
    title: 'Editorial & social proof',
    subtitle: 'Content, subscribers, and credibility signals.',
    tiles: [
      {
        title: 'Blog posts',
        description: 'Articles, guides, and long-form content.',
        to: '/cms/blogs',
        icon: Newspaper,
        stat: 'blogs',
      },
      {
        title: 'Blog categories',
        description: 'Taxonomy and URL structure for the blog.',
        to: '/cms/blog-categories',
        icon: LayoutGrid,
      },
      {
        title: 'Newsletter',
        description: 'Subscriber lists and email touchpoints.',
        to: '/cms/newsletter',
        icon: Mail,
      },
      {
        title: 'Email templates',
        description: 'Preview and edit transactional HTML (bookings, invoices, admin invites).',
        to: '/cms/email-templates',
        icon: FileCode,
      },
      {
        title: 'Social links',
        description: 'Official profiles for footer and headers.',
        to: '/cms/social-links',
        icon: Share2,
      },
      {
        title: 'Testimonials',
        description: 'Curated quotes and success stories.',
        to: '/cms/testimonials',
        icon: Star,
        stat: 'testimonials',
      },
      {
        title: 'Reviews',
        description: 'Booking and category feedback surfaced on the site.',
        to: '/cms/reviews',
        icon: MessageSquareQuote,
      },
      {
        title: 'FAQs',
        description: 'Structured answers for support and SEO.',
        to: '/cms/faqs',
        icon: HelpCircle,
        stat: 'faqs',
      },
    ],
  },
  {
    id: 'catalog-seo',
    title: 'Catalog content & discovery',
    subtitle: 'Service templates, local SEO signals from admin, internal links, and global SEO records.',
    tiles: [
      {
        title: 'Rate card',
        description: 'Category pricing and spare-parts references.',
        to: '/cms/rate-card',
        icon: Receipt,
      },
      {
        title: 'Industry service pages',
        description: 'Per-vertical landing templates and modules.',
        to: '/cms/category-marketing',
        icon: Megaphone,
      },
      {
        title: 'Cross-linking',
        description: 'Related problems and internal link suggestions.',
        to: '/cms/cross-linking',
        icon: Link2,
      },
      {
        title: 'SEO management',
        description: 'Meta defaults, redirects, and indexation hints.',
        to: '/cms/seo',
        icon: Search,
      },
    ],
  },
]

export default function CMSDashboard() {
  const { checkRouteAccess } = usePermissions()
  const [stats, setStats] = useState<CMSStats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [pages, blogs, testimonials, faqs] = await Promise.allSettled([
        CMSService.getPages({ limit: 1 }),
        CMSService.getBlogPosts({ limit: 1 }),
        CMSService.getTestimonials({ limit: 1 }),
        CMSService.getFAQs({ limit: 1 }),
      ])

      setStats({
        totalPages: pages.status === 'fulfilled' ? pages.value.pagination?.total || 0 : 0,
        totalBlogs: blogs.status === 'fulfilled' ? blogs.value.pagination?.total || 0 : 0,
        totalTestimonials:
          testimonials.status === 'fulfilled'
            ? testimonialTotal(testimonials.value)
            : 0,
        totalFAQs: faqs.status === 'fulfilled' ? faqs.value.pagination?.total || 0 : 0,
      })
    } catch (error) {
      console.error('Error loading CMS stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statValue = (key: StatKey): number => {
    switch (key) {
      case 'pages':
        return stats.totalPages || 0
      case 'blogs':
        return stats.totalBlogs || 0
      case 'testimonials':
        return stats.totalTestimonials || 0
      case 'faqs':
        return stats.totalFAQs || 0
      default:
        return 0
    }
  }

  const visibleSections = useMemo(() => {
    return HUB_SECTIONS.map((section) => ({
      ...section,
      tiles: section.tiles.filter((t) => checkRouteAccess(t.to)),
    })).filter((s) => s.tiles.length > 0)
  }, [checkRouteAccess])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Content & marketing"
        subtitle="Manage site structure, campaigns, editorial content, and SEO from one hub — aligned with how modern CMS products group workflows."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatHighlightCard
          label="Pages"
          value={stats.totalPages || 0}
          tone="primary"
          icon={<File className="h-7 w-7" />}
        />
        <StatHighlightCard
          label="Blog posts"
          value={stats.totalBlogs || 0}
          tone="cyan"
          icon={<FileText className="h-7 w-7" />}
        />
        <StatHighlightCard
          label="Testimonials"
          value={stats.totalTestimonials || 0}
          tone="amber"
          icon={<Star className="h-7 w-7" />}
        />
        <StatHighlightCard
          label="FAQs"
          value={stats.totalFAQs || 0}
          tone="sky"
          icon={<HelpCircle className="h-7 w-7" />}
        />
      </div>

      <div className="space-y-10">
        {visibleSections.map((section) => (
          <section key={section.id} aria-labelledby={`cms-section-${section.id}`}>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id={`cms-section-${section.id}`}
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.tiles.map((tile, i) => {
                const Icon = tile.icon
                const accent = ICON_ACCENTS[i % ICON_ACCENTS.length]
                const count = tile.stat !== undefined ? statValue(tile.stat) : null
                return (
                  <Link
                    key={tile.to}
                    to={tile.to}
                    className={cn(
                      'group block h-full rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm transition-all',
                      'hover:-translate-y-0.5 hover:border-border hover:shadow-md',
                    )}
                  >
                    <Card className="h-full border-0 bg-transparent shadow-none">
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                              accent,
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </div>
                          {count !== null && (
                            <Badge variant="secondary" className="shrink-0 font-semibold tabular-nums">
                              {count}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mb-1 text-base font-semibold leading-snug group-hover:text-primary">
                          {tile.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{tile.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {visibleSections.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          You do not have access to any content tools. Ask an administrator for{' '}
          <span className="font-medium text-foreground">view CMS</span> or{' '}
          <span className="font-medium text-foreground">manage marketing</span> permissions.
        </p>
      )}
    </div>
  )
}

function testimonialTotal(value: unknown): number {
  if (value && typeof value === 'object' && 'pagination' in value) {
    const p = (value as { pagination?: { total?: number } }).pagination?.total
    if (typeof p === 'number') return p
  }
  if (Array.isArray(value)) return value.length
  const o = value as { testimonials?: unknown[]; data?: unknown[] } | null
  return o?.testimonials?.length ?? o?.data?.length ?? 0
}
