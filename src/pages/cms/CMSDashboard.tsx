import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  ImageIcon,
  Tag,
  Star,
  HelpCircle,
  Search,
  FileText,
  FolderOpen,
  File,
  Menu,
  Receipt,
  Megaphone,
  Link2,
  Loader2,
} from 'lucide-react'
import { CMSService } from '../../services/api'
import { PageHeader, StatHighlightCard } from '../../components/common'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'

interface CMSStats {
  totalPages?: number
  totalBlogs?: number
  totalMedia?: number
  totalTestimonials?: number
  totalFAQs?: number
  recentActivity?: number
}

interface Module {
  title: string
  description: string
  icon: React.ElementType
  link: string
  color: string
  stat: number | null
}

export default function CMSDashboard() {
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

  const modules: Module[] = [
    {
      title: 'Homepage Management',
      description: 'Manage hero sections, featured content, and homepage layout',
      icon: Home,
      link: '/cms/homepage',
      color: 'hsl(var(--primary))',
      stat: null,
    },
    {
      title: 'Banner Management',
      description: 'Create and schedule promotional banners',
      icon: ImageIcon,
      link: '/cms/banners',
      color: 'hsl(var(--secondary))',
      stat: null,
    },
    {
      title: 'Announcements & Pop-ups',
      description: 'Site-wide notice bars and pop-up modals',
      icon: ImageIcon,
      link: '/cms/banners',
      color: '#9C27B0',
      stat: null,
    },
    {
      title: 'Promotions & Offers',
      description: 'Manage discount codes and promotional campaigns',
      link: '/cms/promotions',
      icon: Tag,
      color: 'hsl(142.1 70.6% 45.3%)',
      stat: null,
    },
    {
      title: 'Testimonials',
      description: 'Manage customer reviews and testimonials',
      icon: Star,
      link: '/cms/testimonials',
      color: 'hsl(38 92% 50%)',
      stat: stats.totalTestimonials ?? null,
    },
    {
      title: 'Reviews',
      description: 'View all booking reviews and category feedback',
      icon: Star,
      link: '/cms/reviews',
      color: '#C2410C',
      stat: null,
    },
    {
      title: 'FAQs',
      description: 'Manage frequently asked questions',
      icon: HelpCircle,
      link: '/cms/faqs',
      color: 'hsl(199.4 85.2% 47.1%)',
      stat: stats.totalFAQs || null,
    },
    {
      title: 'Rate Card',
      description: 'Category-wise spare parts & pricing for catalog',
      icon: Receipt,
      link: '/cms/rate-card',
      color: '#795548',
      stat: null,
    },
    {
      title: 'Industry service pages',
      description: 'Per-industry SEO template: hero, cards, FAQs, pricing notes',
      icon: Megaphone,
      link: '/cms/category-marketing',
      color: '#5C6BC0',
      stat: null,
    },
    {
      title: 'Cross-Linking',
      description: 'Common problems per category for SEO',
      icon: Link2,
      link: '/cms/cross-linking',
      color: '#00897B',
      stat: null,
    },
    {
      title: 'SEO Management',
      description: 'Manage meta tags and SEO settings',
      icon: Search,
      link: '/cms/seo',
      color: 'hsl(0 84.2% 60.2%)',
      stat: null,
    },
    {
      title: 'Blog Management',
      description: 'Create and manage blog posts',
      icon: FileText,
      link: '/cms/blogs',
      color: '#00BCD4',
      stat: stats.totalBlogs || null,
    },
    {
      title: 'Blog Categories',
      description: 'Organize blog posts by category',
      icon: FileText,
      link: '/cms/blog-categories',
      color: '#03A9F4',
      stat: null,
    },
    {
      title: 'Media Library',
      description: 'Manage images, videos, and files',
      icon: FolderOpen,
      link: '/cms/media',
      color: '#009688',
      stat: null,
    },
    {
      title: 'Pages',
      description: 'Create and manage static pages',
      icon: File,
      link: '/cms/pages',
      color: '#FF9800',
      stat: stats.totalPages || null,
    },
    {
      title: 'Menus',
      description: 'Manage navigation menus',
      icon: Menu,
      link: '/cms/menus',
      color: '#8BC34A',
      stat: null,
    },
    {
      title: 'Newsletter & Email',
      description: 'Subscribers and email campaign setup',
      icon: Tag,
      link: '/cms/newsletter',
      color: '#E91E63',
      stat: null,
    },
    {
      title: 'Social Links',
      description: 'Social and website URLs for footer/header',
      icon: Tag,
      link: '/cms/social-links',
      color: '#607D8B',
      stat: null,
    },
  ]

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
        title="Content Management System"
        subtitle="Manage your website content, promotions, and SEO"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatHighlightCard
          label="Total pages"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link
              key={module.link + module.title}
              to={module.link}
              className={cn(
                'block h-full rounded-xl border border-transparent bg-card text-card-foreground shadow-sm transition-all',
                'hover:-translate-y-1 hover:shadow-lg',
              )}
              style={{ borderColor: `color-mix(in srgb, ${module.color} 25%, transparent)` }}
            >
              <Card className="h-full border-0 bg-transparent shadow-none">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${module.color} 12%, transparent)`,
                        color: module.color,
                      }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    {module.stat !== null && (
                      <Badge
                        className="font-semibold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${module.color} 15%, transparent)`,
                          color: module.color,
                        }}
                      >
                        {module.stat}
                      </Badge>
                    )}
                  </div>
                  <h2 className="mb-1 text-lg font-semibold">{module.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
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
