import React, { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Store,
  Megaphone,
  Tag,
  Layers,
  Package,
  Sparkles,
  Sun,
  ShoppingBag,
  Search,
  ChevronLeft,
  Heart,
  Star,
  ArrowRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  SLIDER_PLACEMENT_LABELS,
  SliderPlacement,
  PRODUCT_PLACEMENTS,
  SERVICE_CATEGORY_PLACEMENTS,
  STORE_CATEGORY_PLACEMENTS,
} from '../../types'
import { SliderMediaPreview } from './SliderMediaPreview'
import type { SliderPreviewSources } from '../../lib/sliderMedia'

/**
 * PlacementContextPreview — renders the slide *inside* a mock of the page where
 * the placement actually lives on the storefront. Helps operators answer
 * the question "where will my visitors see this?" without leaving the form.
 *
 * Why we built our own mocks rather than reusing SliderResponsivePreview:
 *   - Knowing the slide fills its frame is necessary but not sufficient.
 *     Operators kept asking "what shows above / below it?" — so each placement
 *     gets a low-fi storefront sketch with the actual hero slot highlighted.
 *
 * Mock fidelity:
 *   - We deliberately use grey skeleton rectangles for surrounding content so
 *     attention stays on the slide. Realism > pixel-perfect parity.
 *   - The breakpoint (desktop vs mobile) is forced by the placement: e.g.
 *     `mobile_app_home` only renders the mobile frame because that placement
 *     does not exist on web.
 */

export interface PlacementContextPreviewProps {
  placement: SliderPlacement
  sources: SliderPreviewSources
  title?: string
  subtitle?: string
  buttonText?: string
  /** Optional category name to render inside category-page mocks. */
  categoryName?: string
  /** Optional product name to render inside product-page mocks. */
  productName?: string
  className?: string
}

type Viewport = 'desktop' | 'mobile'

const PLACEMENT_VIEWPORT_OPTIONS: Record<SliderPlacement, Viewport[]> = {
  home_page_hero: ['desktop', 'mobile'],
  offers: ['desktop', 'mobile'],
  category: ['desktop', 'mobile'],
  mobile_app_home: ['mobile'],
  store_home: ['desktop', 'mobile'],
  store_category: ['desktop', 'mobile'],
  product_page: ['desktop', 'mobile'],
  announcement: ['desktop', 'mobile'],
  promo: ['desktop', 'mobile'],
  seasonal: ['desktop', 'mobile'],
}

const PLACEMENT_DESCRIPTION: Record<SliderPlacement, string> = {
  home_page_hero: 'Top hero on the customer home page.',
  offers: 'Promotions strip below the home hero.',
  category: 'Banner above the service listings of one category page.',
  mobile_app_home: 'Hero card in the mobile app home carousel.',
  store_home: 'Hero on the e-commerce store landing page.',
  store_category: 'Banner above an e-commerce aisle (product category).',
  product_page: 'Promo card on a specific product detail page.',
  announcement: 'Thin notice bar that sits above the site navigation.',
  promo: 'Inline promo block between storefront sections.',
  seasonal: 'Campaign hero (same slot as Home page hero) during a date window.',
}

const PLACEMENT_ICON: Record<SliderPlacement, React.ReactNode> = {
  home_page_hero: <Monitor className="h-3.5 w-3.5" />,
  offers: <Tag className="h-3.5 w-3.5" />,
  category: <Layers className="h-3.5 w-3.5" />,
  mobile_app_home: <Smartphone className="h-3.5 w-3.5" />,
  store_home: <Store className="h-3.5 w-3.5" />,
  store_category: <Package className="h-3.5 w-3.5" />,
  product_page: <Tag className="h-3.5 w-3.5" />,
  announcement: <Megaphone className="h-3.5 w-3.5" />,
  promo: <Sparkles className="h-3.5 w-3.5" />,
  seasonal: <Sun className="h-3.5 w-3.5" />,
}

export function PlacementContextPreview({
  placement,
  sources,
  title,
  subtitle,
  buttonText,
  categoryName,
  productName,
  className,
}: PlacementContextPreviewProps) {
  const supported = PLACEMENT_VIEWPORT_OPTIONS[placement]
  const [viewport, setViewport] = useState<Viewport>(supported[0])

  // Guard: if a placement no longer supports the current viewport (user
  // switched from a multi-viewport placement to mobile-only), snap back.
  if (!supported.includes(viewport)) {
    setViewport(supported[0])
  }

  const targetingHint = (() => {
    if (PRODUCT_PLACEMENTS.includes(placement)) {
      return productName
        ? `Bound to "${productName}"`
        : 'Pick a target product so this slide appears on its PDP.'
    }
    if (SERVICE_CATEGORY_PLACEMENTS.includes(placement)) {
      return categoryName
        ? `Bound to "${categoryName}" service category`
        : 'Pick a service category so this slide appears on its listing page.'
    }
    if (STORE_CATEGORY_PLACEMENTS.includes(placement)) {
      return categoryName
        ? `Bound to "${categoryName}" store aisle`
        : 'Pick a store category so this slide appears on its aisle page.'
    }
    return 'Site-wide — no extra targeting required.'
  })()

  const targetingIsMissing =
    (PRODUCT_PLACEMENTS.includes(placement) && !productName) ||
    (SERVICE_CATEGORY_PLACEMENTS.includes(placement) && !categoryName) ||
    (STORE_CATEGORY_PLACEMENTS.includes(placement) && !categoryName)

  const slot = (
    <SliderMediaPreview
      sources={sources}
      title={title}
      subtitle={subtitle}
      buttonText={buttonText}
      nested
      viewport={viewport}
    />
  )

  return (
    <Card className={cn('overflow-hidden border-primary/15 shadow-md', className)}>
      <CardHeader className="space-y-2 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/[0.08] text-primary">
              {PLACEMENT_ICON[placement]}
              Placement preview
            </Badge>
            <span className="text-sm font-semibold">{SLIDER_PLACEMENT_LABELS[placement]}</span>
          </div>
          {supported.length > 1 ? (
            <div className="inline-flex rounded-lg border bg-background p-0.5">
              <ViewportToggle
                active={viewport === 'desktop'}
                onClick={() => setViewport('desktop')}
                icon={<Monitor className="h-3.5 w-3.5" />}
                label="Desktop"
              />
              <ViewportToggle
                active={viewport === 'mobile'}
                onClick={() => setViewport('mobile')}
                icon={<Smartphone className="h-3.5 w-3.5" />}
                label="Mobile"
              />
            </div>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile-only placement
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {PLACEMENT_DESCRIPTION[placement]}
        </p>
        <p
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]',
            targetingIsMissing
              ? 'bg-amber-500/[0.1] text-amber-700'
              : 'bg-muted/60 text-muted-foreground',
          )}
        >
          <Tag className="h-3 w-3" />
          {targetingHint}
        </p>
      </CardHeader>

      <CardContent className="bg-muted/20 p-4 sm:p-5">
        <PlacementMock
          placement={placement}
          viewport={viewport}
          slot={slot}
          categoryName={categoryName}
          productName={productName}
          title={title}
          subtitle={subtitle}
          buttonText={buttonText}
        />
      </CardContent>
    </Card>
  )
}

/* ──────────────────────────  Internals  ────────────────────────── */

function ViewportToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium', active && 'shadow-sm')}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

/* ────  Placement-specific mocks  ──── */

interface MockProps {
  placement: SliderPlacement
  viewport: Viewport
  slot: React.ReactNode
  categoryName?: string
  productName?: string
  title?: string
  subtitle?: string
  buttonText?: string
}

function PlacementMock({ placement, viewport, slot, categoryName, productName, title, subtitle, buttonText }: MockProps) {
  // The announcement bar has no media — render a dedicated text mock.
  if (placement === 'announcement') {
    return viewport === 'mobile' ? (
      <MobileShell>
        <AnnouncementBar title={title} subtitle={subtitle} buttonText={buttonText} dense />
        <MobileNavBar />
        <MobileSkeletonContent />
      </MobileShell>
    ) : (
      <DesktopShell>
        <AnnouncementBar title={title} subtitle={subtitle} buttonText={buttonText} />
        <DesktopNavBar />
        <DesktopSkeletonContent />
      </DesktopShell>
    )
  }

  if (placement === 'mobile_app_home') {
    return (
      <MobileAppFrame>
        <MobileAppCarouselSlot slot={slot} />
      </MobileAppFrame>
    )
  }

  // Home hero / Seasonal — same surface, different intent.
  if (placement === 'home_page_hero' || placement === 'seasonal') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <DesktopNavBar />
        <HeroSlot slot={slot} />
        <SkeletonRowGrid />
      </DesktopShell>
    ) : (
      <MobileShell>
        <MobileNavBar />
        <HeroSlot slot={slot} mobile />
        <MobileSkeletonContent />
      </MobileShell>
    )
  }

  if (placement === 'offers') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <DesktopNavBar />
        <FlatHeroSkeleton />
        <SectionHeading icon={<Tag className="h-3 w-3" />} label="Top offers for you" />
        <OffersSlot slot={slot} />
      </DesktopShell>
    ) : (
      <MobileShell>
        <MobileNavBar />
        <FlatHeroSkeleton dense />
        <SectionHeading icon={<Tag className="h-3 w-3" />} label="Top offers" dense />
        <OffersSlot slot={slot} mobile />
      </MobileShell>
    )
  }

  if (placement === 'category') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <DesktopNavBar />
        <Breadcrumb crumbs={['Services', categoryName || 'Category']} />
        <HeroSlot slot={slot} />
        <SectionHeading icon={<Layers className="h-3 w-3" />} label="Available services" />
        <CategoryListGrid />
      </DesktopShell>
    ) : (
      <MobileShell>
        <MobileNavBar />
        <Breadcrumb crumbs={['Services', categoryName || 'Category']} dense />
        <HeroSlot slot={slot} mobile />
        <MobileSkeletonContent />
      </MobileShell>
    )
  }

  if (placement === 'store_home') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <StoreNavBar />
        <HeroSlot slot={slot} />
        <SectionHeading icon={<ShoppingBag className="h-3 w-3" />} label="Shop by category" />
        <StoreCategoryStripe />
      </DesktopShell>
    ) : (
      <MobileShell>
        <StoreNavBar dense />
        <HeroSlot slot={slot} mobile />
        <MobileSkeletonContent />
      </MobileShell>
    )
  }

  if (placement === 'store_category') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <StoreNavBar />
        <Breadcrumb crumbs={['Store', categoryName || 'Aisle']} />
        <HeroSlot slot={slot} />
        <SectionHeading icon={<Package className="h-3 w-3" />} label={`${categoryName || 'Aisle'} products`} />
        <ProductGrid />
      </DesktopShell>
    ) : (
      <MobileShell>
        <StoreNavBar dense />
        <Breadcrumb crumbs={['Store', categoryName || 'Aisle']} dense />
        <HeroSlot slot={slot} mobile />
        <MobileProductGrid />
      </MobileShell>
    )
  }

  if (placement === 'product_page') {
    return viewport === 'desktop' ? (
      <DesktopShell>
        <StoreNavBar />
        <Breadcrumb crumbs={['Store', 'Product', productName || 'Item']} />
        <ProductPageBody productName={productName} slot={slot} />
      </DesktopShell>
    ) : (
      <MobileShell>
        <StoreNavBar dense />
        <ProductPageBody productName={productName} slot={slot} mobile />
      </MobileShell>
    )
  }

  // Inline promo — sandwiched between content sections.
  return viewport === 'desktop' ? (
    <DesktopShell>
      <DesktopNavBar />
      <FlatHeroSkeleton />
      <SectionHeading icon={<Sparkles className="h-3 w-3" />} label="Popular services" />
      <SkeletonRowGrid />
      <PromoStrip slot={slot} />
      <SectionHeading icon={<Sparkles className="h-3 w-3" />} label="How it works" />
      <SkeletonRowGrid lines={3} />
    </DesktopShell>
  ) : (
    <MobileShell>
      <MobileNavBar />
      <FlatHeroSkeleton dense />
      <SectionHeading icon={<Sparkles className="h-3 w-3" />} label="Popular services" dense />
      <MobileSkeletonContent compact />
      <PromoStrip slot={slot} mobile />
      <MobileSkeletonContent compact />
    </MobileShell>
  )
}

/* ────  Layout primitives  ──── */

function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Monitor className="h-3 w-3" />
        Desktop · storefront mock
      </div>
      <div className="space-y-3 rounded-xl border bg-background p-3 shadow-inner">{children}</div>
    </div>
  )
}

function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col items-center">
      <div className="mb-2 flex w-full items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="h-3 w-3" />
        Mobile · storefront mock
      </div>
      <div className="w-full overflow-hidden rounded-[2rem] border-[7px] border-ink-soft bg-ink shadow-xl dark:border-charcoal">
        <div className="relative flex h-7 items-end justify-center bg-ink pb-1">
          <div className="absolute left-1/2 top-1.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
          <span className="relative z-[1] text-[9px] font-medium text-graphite">9:41</span>
        </div>
        <div className="space-y-2 bg-background px-2.5 pb-3 pt-2">{children}</div>
        <div className="flex justify-center bg-ink py-2">
          <div className="h-1 w-[100px] rounded-full bg-graphite" />
        </div>
      </div>
    </div>
  )
}

function MobileAppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col items-center">
      <div className="mb-2 flex w-full items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="h-3 w-3" />
        Mobile app · in-app carousel
      </div>
      <div className="w-full overflow-hidden rounded-[2rem] border-[7px] border-ink-soft bg-ink shadow-xl dark:border-charcoal">
        <div className="relative flex h-7 items-end justify-center bg-ink pb-1">
          <div className="absolute left-1/2 top-1.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
          <span className="relative z-[1] text-[9px] font-medium text-graphite">9:41</span>
        </div>
        <div className="bg-background px-3 pb-3 pt-2">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex h-7 flex-1 items-center gap-1.5 rounded-lg bg-muted/80 px-2">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">Search services</span>
            </div>
            <div className="h-7 w-7 rounded-full bg-muted/80" />
          </div>
          {children}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
          </div>
          <MobileSkeletonContent compact />
        </div>
        <div className="flex justify-center bg-ink py-2">
          <div className="h-1 w-[100px] rounded-full bg-graphite" />
        </div>
      </div>
    </div>
  )
}

function MobileAppCarouselSlot({ slot }: { slot: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg shadow-md ring-1 ring-black/5"
      style={{ aspectRatio: '2.1 / 1' }}
    >
      {slot}
    </div>
  )
}

/* ────  Chrome bits  ──── */

function DesktopNavBar() {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-primary/50" />
        <div className="hidden gap-2 sm:flex">
          <Pill />
          <Pill />
          <Pill />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-32 rounded-md bg-background" />
        <div className="h-6 w-6 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  )
}

function StoreNavBar({ dense }: { dense?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border bg-muted/40',
        dense ? 'px-2 py-1.5' : 'px-3 py-2',
      )}
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className={cn('text-primary', dense ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <div className={cn('rounded bg-foreground/60', dense ? 'h-3 w-12' : 'h-4 w-14')} />
      </div>
      <div className="flex items-center gap-1.5">
        <Search className={cn('text-muted-foreground', dense ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <Heart className={cn('text-muted-foreground', dense ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <ShoppingBag className={cn('text-muted-foreground', dense ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      </div>
    </div>
  )
}

function MobileNavBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 flex-1 items-center gap-1.5 rounded-lg bg-muted/80 px-2">
        <Search className="h-3 w-3 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">Search</span>
      </div>
      <div className="h-7 w-7 rounded-full bg-muted/80" />
    </div>
  )
}

function AnnouncementBar({
  title,
  subtitle,
  buttonText,
  dense,
}: {
  title?: string
  subtitle?: string
  buttonText?: string
  dense?: boolean
}) {
  const text = (title || subtitle || 'Site-wide announcement appears in this thin bar')
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md bg-primary text-primary-foreground',
        dense ? 'gap-2 px-2 py-1 text-[10px]' : 'gap-3 px-3 py-1.5 text-[11px]',
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Megaphone className={cn(dense ? 'h-3 w-3' : 'h-3.5 w-3.5', 'shrink-0')} />
        <span className="truncate font-medium">{text}</span>
      </div>
      {buttonText ? (
        <span
          className={cn(
            'shrink-0 rounded bg-primary-foreground/15 px-1.5 py-0.5 font-semibold',
            dense ? 'text-[9px]' : 'text-[10px]',
          )}
        >
          {buttonText}
        </span>
      ) : null}
    </div>
  )
}

function Breadcrumb({ crumbs, dense }: { crumbs: string[]; dense?: boolean }) {
  return (
    <nav
      aria-label="Mock breadcrumb"
      className={cn('flex items-center gap-1 text-[10px] text-muted-foreground', dense && 'text-[9px]')}
    >
      <ChevronLeft className={cn(dense ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {crumbs.map((c, i) => (
        <React.Fragment key={c + i}>
          <span className={cn(i === crumbs.length - 1 && 'font-semibold text-foreground')}>{c}</span>
          {i < crumbs.length - 1 ? <span>/</span> : null}
        </React.Fragment>
      ))}
    </nav>
  )
}

function HeroSlot({ slot, mobile }: { slot: React.ReactNode; mobile?: boolean }) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
      )}
      style={{ aspectRatio: mobile ? '2.1 / 1' : '21 / 9' }}
    >
      {slot}
      <div className="absolute -top-2.5 left-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
        Your slide
      </div>
    </div>
  )
}

function FlatHeroSkeleton({ dense }: { dense?: boolean }) {
  return (
    <div
      className={cn('w-full rounded-md bg-muted/60', dense ? 'aspect-[16/9]' : 'aspect-[21/9]')}
      aria-hidden
    />
  )
}

function OffersSlot({ slot, mobile }: { slot: React.ReactNode; mobile?: boolean }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: mobile ? '1.4fr 1fr' : '1.6fr 1fr 1fr' }}>
      <div
        className="relative overflow-hidden rounded-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
        style={{ aspectRatio: '16/9' }}
      >
        {slot}
        <div className="absolute -top-2.5 left-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          Your slide
        </div>
      </div>
      <div className="rounded-md bg-muted/60" style={{ aspectRatio: '16/9' }} />
      {!mobile ? <div className="rounded-md bg-muted/60" style={{ aspectRatio: '16/9' }} /> : null}
    </div>
  )
}

function PromoStrip({ slot, mobile }: { slot: React.ReactNode; mobile?: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
      style={{ aspectRatio: mobile ? '16/6' : '16/5' }}
    >
      {slot}
      <div className="absolute -top-2.5 left-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
        Your promo
      </div>
    </div>
  )
}

function SectionHeading({ icon, label, dense }: { icon: React.ReactNode; label: string; dense?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-foreground', dense ? 'text-[10px]' : 'text-xs')}>
      <span className="text-primary">{icon}</span>
      <span className="font-semibold">{label}</span>
    </div>
  )
}

function SkeletonRowGrid({ lines = 4 }: { lines?: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="aspect-square rounded-md bg-muted/60" />
          <div className="h-2 w-3/4 rounded bg-muted/60" />
          <div className="h-2 w-1/2 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  )
}

function MobileSkeletonContent({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('space-y-2', compact ? '' : 'pt-1')}>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted/70" />
        ))}
      </div>
      {!compact ? (
        <>
          <div className="h-2 w-1/2 rounded bg-muted/60" />
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-[4/3] rounded-md bg-muted/60" />
            <div className="aspect-[4/3] rounded-md bg-muted/60" />
          </div>
        </>
      ) : null}
    </div>
  )
}

function CategoryListGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1 rounded-md border bg-card p-2">
          <div className="aspect-[4/3] rounded bg-muted/60" />
          <div className="h-2 w-3/4 rounded bg-muted/60" />
          <div className="flex items-center justify-between">
            <div className="h-2 w-1/3 rounded bg-muted/40" />
            <Star className="h-2.5 w-2.5 text-amber-400" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StoreCategoryStripe() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-md bg-muted/40 p-2">
          <div className="h-8 w-8 rounded-full bg-muted/70" />
          <div className="h-1.5 w-3/4 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  )
}

function ProductGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1 rounded-md border bg-card p-1.5">
          <div className="aspect-square rounded bg-muted/60" />
          <div className="h-2 w-3/4 rounded bg-muted/60" />
          <div className="h-2 w-1/3 rounded bg-primary/30" />
        </div>
      ))}
    </div>
  )
}

function MobileProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1 rounded-md border bg-card p-1.5">
          <div className="aspect-square rounded bg-muted/60" />
          <div className="h-2 w-2/3 rounded bg-muted/60" />
          <div className="h-2 w-1/3 rounded bg-primary/30" />
        </div>
      ))}
    </div>
  )
}

function ProductPageBody({
  productName,
  slot,
  mobile,
}: {
  productName?: string
  slot: React.ReactNode
  mobile?: boolean
}) {
  return (
    <div className={cn('grid gap-2', mobile ? 'grid-cols-1' : 'grid-cols-[1fr_1.2fr]')}>
      <div className={cn('rounded-md bg-muted/60', mobile ? 'aspect-[4/3]' : 'aspect-square')} />
      <div className="space-y-2">
        <div className="space-y-1">
          <div className={cn('rounded bg-foreground/60', mobile ? 'h-3 w-2/3' : 'h-3 w-3/5')} />
          <div className="flex items-center gap-1">
            <div className="h-2 w-12 rounded bg-amber-400/70" />
            <div className="h-2 w-10 rounded bg-muted/50" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 rounded bg-primary/40" />
          <div className="h-3 w-10 rounded bg-muted/40" />
        </div>
        <div className="h-7 w-full rounded-md bg-primary/80" />

        {/* The slide */}
        <div className="pt-1">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-primary">
            Promo for {productName || 'this product'}
          </p>
          <div
            className="relative overflow-hidden rounded-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
            style={{ aspectRatio: '16/9' }}
          >
            {slot}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowRight className="h-2.5 w-2.5" />
          <span>Add-ons, reviews, similar products follow…</span>
        </div>
      </div>
    </div>
  )
}

function Pill() {
  return <div className="h-3 w-8 rounded-full bg-muted-foreground/30" />
}

function DesktopSkeletonContent() {
  return (
    <>
      <div className="aspect-[21/9] w-full rounded-md bg-muted/60" />
      <SkeletonRowGrid />
    </>
  )
}

export default PlacementContextPreview
